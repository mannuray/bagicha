# Slice 0 — API & behaviour changes

Every deliberate API or behaviour change made by the backend cleanup
(`docs/superpowers/plans/2026-11-10-backend-cleanup.md`). Slice 1 (React)
is built against the "After" column.

| Endpoint / area | Before | After | Task |
|---|---|---|---|
| `POST vision/diagnose` | unknown/unowned `plant_id` → diagnosed without context (200/201) | 404 | 2 |
| `POST diagnosis/finalize`, `POST vision/diagnose`, `POST community/ask-ai` | any signed-in user could read/write another user's plant (or resolve their session) | 404 unless the caller owns the plant (and the session belongs to it) | 2 |
| `GET media/download-url/*key` | route never matched under Nest 11 (always 500); would have signed any key | works; private prefixes (`vision/`, `journal/`) only for the owner, otherwise 404; malformed keys 404 | 3 |
| `POST subscription/webhook` | unauthenticated; any POST could grant premium | requires a valid `X-Razorpay-Signature` (HMAC-SHA256 of raw body with `RAZORPAY_WEBHOOK_SECRET`), else 401 `WEBHOOK_SIGNATURE_INVALID`; missing secret = always 401; payload validated | 4 |
| `POST auth/verify-otp` | hard-coded `+916202042225`/`123456` worked in every environment | only when `AUTH_DEV_OTP_PHONE`/`AUTH_DEV_OTP_CODE` are set **and** `NODE_ENV !== production` (set both in local `.env` to keep the mock-data login) | 5 |
| startup | JWT signed with fallback secret `bagicha-secret-key-2026` if unset | app refuses to start without `JWT_SECRET` (and `DATABASE_URL`) | 5 |
| `POST auth/request-otp` | OTP from `Math.random`, printed with `console.log` | `crypto.randomInt`; logged at debug only outside production | 5 |
| rate limits (all routes) | none | 429 `RATE_LIMITED` with `details.bucket`. Buckets (shared per user when signed in, else per IP): `auth` 5/min per IP (request-otp, verify-otp; plus a per-phone cap: an OTP is burned after 5 wrong guesses), `ai` 20/h (vision identify/diagnose, community ask-ai, diagnosis finalize), `upload` 30/h (media images), `catalogue` 60/min (plants search/resolve); everything else 300/min per route. Fails open if Redis is down. | 10 |
| `GET health`, `GET health/live` | none | readiness: 200 `{status:'ok',checks:{database,redis}}`, or 503 error envelope `HEALTH_CHECK_FAILED` with `details.checks`; liveness always 200. Unauthenticated, not rate-limited. | 11 |
| cycle year (all journal/diagnosis writes) | ledger used UTC month, diagnosis used server-local month | one rule, IST month (`Asia/Kolkata`); only events near IST midnight on the 1st move; existing cycles unchanged | 14 |
| `GET ledger/plants/:id` (and every `ledger/plants/:id/*` route) on another user's plant | 403 `Access denied` | 404 `PLANT_NOT_FOUND` | 15 |
| `GET ledger/plants`, `GET ledger/plants/:id/cycles`, `GET ledger/plants/:id/tasks`, `GET ledger/tasks` | bare arrays (tasks capped at 20/30, others unbounded) | `data` + `pagination`; `?page` (1–10,000) and `?page_size` (1–100, default 20); bad values → 422. Dashboard that showed 30 tasks should pass `page_size=30` | 15 |
| `POST diagnosis/finalize` `event_at` | any string (garbage → 500) | ISO-8601 required → else 422 | final review |
| `GET media/download-url/*key?expires=` | non-numeric → link with `X-Amz-Expires=NaN` | non-numeric → default 3600 s; clamped 60–86,400 | final review |
| `materialize-tasks` per-item failure `reason` | raw internal error message | stable code `TASK_CREATE_FAILED` (details in logs) | final review |
| logs | `authorization`/cookie headers written on every request line; keys `time`/`msg` | credentials redacted; keys `timestamp`/`message` | final review |
| `PUT ledger/plants/:id/tasks/:taskId` | task view without plant fields | same view plus `plant_id`, `tree_name`, `record_kind` (additive) | 15 |
| unknown task id on `PUT ledger/plants/:id/tasks/:taskId` | 404 `NOT_FOUND` | 404 `TASK_NOT_FOUND` | 15 |
| lifecycle task generation (background) | mango prune due 9 months out (shared Date mutated); retries duplicated tasks | prune due in 3 months, feed in 6; retries skip existing tasks (`lifecycle:{plant}:{stage}:{type}` key) | 15 |
| AI routes (`vision/*`, `community/ask-ai`) when unconfigured | silently called Gemini with `'MOCK_KEY'` and hard-coded `gemini-1.5-flash` | 502 `AI_NOT_CONFIGURED` unless `GEMINI_API_KEY` **and** `GEMINI_MODEL` are set; provider failure → 502 `AI_PROVIDER_ERROR`; unusable output → 502 `AI_RESPONSE_INVALID` (was `{raw_text, error}` passed through) | 16 |
| `POST diagnosis/finalize` | `{success, data:{session_id, outcome_id, log_ids, task_ids}}` double-wrapped inside the envelope | envelope `data: {session_id, outcome_id, log_ids, tasks: [{sourceKey, status: created\|skipped\|failed, taskId?, reason?}]}`; unsupported subject → 422 `DIAGNOSIS_SUBJECT_UNSUPPORTED`; foreign session → 404 `DIAGNOSIS_SESSION_NOT_FOUND` | 17 |
| `POST vision/diagnose` | malformed/empty AI output saved as an UNKNOWN diagnosis; numeric `confidence` and single-string actions dropped; raw model JSON returned | AI output with neither a recognised issue nor a summary → 502 `AI_RESPONSE_INVALID`, nothing saved; response `diagnosis` is the cleaned-up object (`confidence: 87` → `"87"`, `recommended_actions: "x"` → `["x"]`, `follow_up_days` capped at 60) | 18 |
| `User.badge_level` / premium | `badge_level = 'Rooted'` meant paid | new `subscription_tier` (`FREE`/`PREMIUM`, default FREE) + `premium_expires_at` (null = lifetime); `badge_level` is rank only. Migration: `Rooted` users → PREMIUM lifetime, badge reset to `Seedling` | 19 |
| `POST subscription/create-order` | any `plan_id` string | `plan_id` must be `PREMIUM_MONTHLY` or `PREMIUM_YEARLY` (else 422); response adds `notes: {user_id, plan_id}` | 19 |
| `POST subscription/webhook` (`order.paid`) | set `badge_level='Rooted'`, every delivery | payload validated only for `order.paid` (other events are acknowledged); plan/user read from the server-set **order** notes when present; paid `amount` must equal the plan price (else not applied, logged); unknown plan → 500 so Razorpay retries/alerts; +30/+365 days from the later of now/current expiry (lifetime stays lifetime); same `payment.entity.id` applied once (`{received:true, duplicate:true}`); audited `SUBSCRIPTION_CHANGED` | 19 |
| seasonal personalization (paid-only overlay) | gated on `badge_level === 'Rooted'` | gated on `isPremium(user, now)` (wired in Task 20) | 19 |
| `POST seasonal/plant/:id/materialize-tasks` | `{created_count, created_tasks:[…]}` | `{results:[{sourceKey, status: created\|skipped\|failed, taskId?, reason?}], created_count}` | 20 |
| season window / seasonal guide | server-local month | IST month (flips at IST midnight on the 1st) | 20 |
| weather job | always re-fetched on retry | skips when the pincode is already cached | 20 |
| `GET community/feed` | `?page`/`?page_size` unvalidated | validated (`page` ≥1, `page_size` 1–100) → bad values 422 | 21 |
| `GET chat/inbox`, `GET chat/messages/:userId` | bare arrays, unbounded | `data` + `pagination` (default 20/page); conversation oldest-first | 21 |
| `GET plants/search` | `data: {items: [top 8]}` | `data: [...]` + `pagination` (default 20/page, ranked) | 21 |
| `POST plants/resolve` | body unvalidated | `query` required (≤100 chars), `region_cluster` must be a known cluster (either case), `language` ≤10 chars → else 422 | 21 |
| `POST media/images`, `GET media/download-url/*key` | `{success, data}` double-wrapped inside the envelope | plain envelope `data` | 21 |
| `POST community/posts/:id/report`, `…/comments/:id/report` | report row only | report + `COMMUNITY_REPORT_FILED` audit row in one transaction (repeat reports write nothing) | 21 |
| `POST chat/messages` unknown receiver | 404 `NOT_FOUND` | 404 `RECEIVER_NOT_FOUND` | 21 |
| indexes | none on `trees.user_id`, `messages`, verified comments | `trees(user_id)`, `messages(sender_id, receiver_id, created_at)`, `messages(receiver_id, created_at)`, `comments(is_expert_verified, is_hidden, created_at)`, plus `audit_events` indexes | 13, 22 |
| error envelope | `error.code` free-form | every error carries a machine-readable `error.code` (the `reason`), e.g. `PLANT_NOT_FOUND`, `RATE_LIMITED`, `AI_RESPONSE_INVALID`; unknown errors never leak their message | 7 |

## Running locally (new requirements)

- `JWT_SECRET` and `DATABASE_URL` are required at startup.
- AI needs `GEMINI_API_KEY` **and** `GEMINI_MODEL`.
- Payments webhook needs `RAZORPAY_WEBHOOK_SECRET`.
- Mock-data login: set `AUTH_DEV_OTP_PHONE=+916202042225` and `AUTH_DEV_OTP_CODE=123456` (ignored in production).
- Tracing export: set `OTEL_EXPORTER_OTLP_ENDPOINT` (otherwise spans stay local; logs still carry `traceId`).
- Start scripts load `dist/instrumentation.js` via `node --require` (never import it from `main.ts`). It installs no signal handlers: Nest owns SIGTERM and flushes OpenTelemetry last (`OtelShutdownHook`).
- Behind a load balancer, set Express `trust proxy` so `req.ip` (used for anonymous rate limits) is the client address.
- e2e: `cp .env.test.example .env.test`, `docker compose up -d postgres redis minio`, `npm run test:e2e`.

## Principles review (docs/coding-principles.md §8, whole backend)

**Design**
- ✅ One reason to change per class — the 1,221-line ledger service is split into plant records, journal, cycles, tasks and mitigation; pure rules live in `plant-ledger/domain`, `seasonal/domain`, `vision/ai-diagnosis.mapper.ts`. Follow-up: `plants.service.ts` still holds both seed data and ranking.
- ✅ Extension points — species config map, rate-limit buckets, `AiProvider`.
- ✅ Substitutability — `GeminiProvider`/`AiProvider`, throttler guard subclasses honour their base contracts.
- ✅ Siblings import only `index.ts` — enforced by `scripts/check-module-imports.js` (part of `npm run check:boundaries`). Exception: `app.module.ts` (composition root) imports module classes directly.
- ✅ Constructor injection — the Gemini SDK comes through an injected factory. `MitigationService` holds a `new MitigationPlanner()`: stateless pure logic with no dependencies.
- ✅ Persistence behind repositories — `check:boundaries` greps for user-owned tables outside repositories. Exceptions: the health probe (`SELECT 1`) and Kathawachak's Prisma listeners.
- ✅ Acyclic — `npm run check:cycles` (madge).

**API & errors**
- ✅ Domain-prefixed routes; ✅ one envelope (double wraps removed in diagnosis and media).
- ✅ DTOs validated at the boundary (added: plants/resolve, search, feed, webhook payload, create-order plan).
- ✅ Error hierarchy with `reason`. Remaining Nest exceptions (`UnauthorizedException` in auth/JWT with explicit `code`, `BadRequestException` in media upload) are mapped to reason codes by the filter.
- ✅ Auth guard + permission. "Permission" here = ownership, enforced in owner-scoped repositories (fail closed, 404).
- ✅ Per-item outcomes: `diagnosis/finalize`, `materialize-tasks`, `TaskService.createTasks`.

**Testability**
- ✅ Direct instantiation with stubs (every new unit spec does this).
- ✅ No constructor I/O in our classes. **Exception:** Kathawachak `MonitorService` builds its batcher in the constructor (left as-is: "Kathawachak stays").
- ✅ No bare `new Date()` in `src/modules` (grep-enforced). The envelope/filter timestamps in `common/` are response metadata, not business logic.

**Observability**
- ✅ pino only (no `console.*`, grep-enforced), with `timestamp, level, service, version, env, message, traceId, spanId, requestId, userId`; credentials redacted.
- ✅ `withSpan` around Gemini, MinIO (put/presign/bucket setup) and weather.
- ✅ Metrics: `bagicha.ai.calls`, `bagicha.diagnoses.recorded`, `bagicha.tasks.created`, `bagicha.tasks.completed`, `bagicha.rate_limit.rejected`, `bagicha.queue.depth`.

**Security**
- ✅ Fail closed: ownership (404), webhook signature, required `JWT_SECRET`, dev OTP off by default and never in production. The only fail-open is the rate limiter on a Redis outage.
- ✅ Defaults off: `subscription_tier` defaults to FREE; private media is owner-only.
- ✅ Owner-scoped repositories for every user-owned table; ✅ rate limits on AI, OTP, uploads and the catalogue.
- ✅ No secrets in code (test values in `.env.test.example` are dummies; `.env*` gitignored).

**Scaling**
- ✅ Every list endpoint paginates (max 100). **Exception:** `marketplace/items` (a static mock list of 3).
- ✅ Indexes for new query shapes (see table above).
- ✅ Idempotent consumers: task generation (source keys), weather (cache check), webhook (payment-id dedupe).
- ⛔ Optimistic concurrency — documented exception (spec §7: single-owner records).

**Habits**
- ✅ Audit at write time with snapshots: `AUTH_SIGNED_IN`, `SUBSCRIPTION_CHANGED`, `COMMUNITY_REPORT_FILED`.
- ✅ No single-caller abstractions (`AiProvider` has two callers plus the test fake).
- ✅ `/health` + `/health/live`, graceful shutdown (`enableShutdownHooks`, Redis `quit`, Prisma disconnect, BullMQ workers).

**Known, unchanged behaviour flagged for Slice 1**
- `GET seasonal/weather` always uses pincode `800001`: users have no pincode field (the old code read `req.user.pincode`, which never existed).

## Slice 1

| Endpoint / area | Before | After | Task |
|---|---|---|---|
| `POST vision/identify`, `POST vision/diagnose` | default 100 KB JSON limit (phone photos rejected, unhandled 500) | 8 MB JSON limit on `/api/v1/vision/*`; elsewhere 100 KB. Oversized bodies → 413 `PAYLOAD_TOO_LARGE`, malformed JSON → 400 `BAD_REQUEST` (shared envelope) | S1-1 |
| CORS | none (browser apps could not call the API) | allow-list from `WEB_ORIGINS` (comma-separated); unset → CORS off; allowed headers `Authorization`, `Content-Type`, `X-Request-Id`; no credentials | S1-2 |
| `AI_PROVIDER` env (dev/test only) | Gemini always | `AI_PROVIDER=fake` binds a deterministic fake (used by the web e2e run); refused at startup when `NODE_ENV=production`; unknown values refused | S1-3 |
