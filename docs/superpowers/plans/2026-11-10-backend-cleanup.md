# Backend Cleanup ("Slice 0") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the backend's security holes, then bring the whole `backend/` codebase up to `docs/coding-principles.md` without changing what the slice-one loop endpoints mean.

**Architecture:** Security fixes land first, as small commits on today's structure, each proven by a real-database e2e test. Next comes a shared foundation in `src/common/`: logging, errors, tracing and metrics, clock, rate limiting, health, audit and pagination. Then each module is rebuilt on top of it. `plant-ledger` becomes the only owner of plants, journal, cycles and tasks, behind user-scoped repositories. Every other module reaches it only through its `index.ts` barrel.

**Tech Stack:** NestJS 11, Prisma 6 (PostgreSQL 15), Redis 7 / ioredis, BullMQ, MinIO, Gemini (`@google/generative-ai`), Jest 30 + supertest. New: nestjs-pino/pino-http, OpenTelemetry SDK (node), @nestjs/throttler with Redis storage, @nestjs/terminus. Verify each version live before installing, and prefer proven majors.

**Spec:** `docs/superpowers/specs/2026-11-10-backend-cleanup-design.md`. The standard is `docs/coding-principles.md`. Executors read both.

## Global Constraints

- Every rule in `docs/coding-principles.md` applies to every task. A `MUST` that can't be met means stop and ask. Never work around one silently.
- "Tenant-scoped" means **user-owned**. Plants, journal entries, plant cycles, tasks, diagnosis sessions/outcomes and personalized overlays are reached only through user-scoped repositories. An ownership miss returns **404**, never 403.
- **Kathawachak (`src/common/monitor`) stays** and runs alongside pino/OTel. Don't remove or rewire it.
- Prisma migrations must keep existing rows. No `migrate reset` against the dev database.
- Secrets come from env only. No literal secrets or secret fallbacks in code.
- Month-based rules use **IST (Asia/Kolkata)**: cycle year, season window, seasonal intelligence, weather guide. Existing `PlantCycle` rows are **not** recalculated.
- Logic moves; it doesn't change. Where a task changes behaviour on purpose, it's listed under that task's **Breaking/behaviour change**. Copy each one into `docs/api-changes-slice0.md` (created in Task 1, finished in Task 22).
- The mocked integrations stay mocked: OTP delivery, Razorpay order creation, marketplace items, weather data.
- No abstraction with a single caller. The only interfaces allowed are the ones this plan names.
- Work on a branch (`backend-cleanup`), never `main`.
- Commands run from `backend/`. The e2e suite needs `docker compose up -d postgres redis minio`.

## Review Focus

Five inputs that no task's main tests hit but that will bite real users. Each is pinned by a test in the task that owns the code:

1. **Crafted media keys.** `vision/<me>/../<other>/x.jpg`, URL-encoded slashes, an empty owner segment or a missing prefix all return 404 and never sign another user's key. → Task 3
2. **AI output that is valid JSON with wrong types.** For example `confidence: 87`, `recommended_actions: "water it"`, an unknown `primary_issue`, or prose wrapped around the JSON. These are either mapped safely or fail with `AI_RESPONSE_INVALID`. Never a 500, never a half-saved diagnosis. → Task 18
3. **Razorpay retries the same webhook.** The same payment delivered twice extends premium once. → Task 19
4. **Garbage paging parameters** (`page=0`, `page=-3`, `page=abc`, `page_size=10000`). These return 422 or are capped at the max, never a 500 or an unbounded query. → Task 13
5. **Redis is down.** Rate limiting fails open (the allowed exception), OTP verify fails closed (no sign-in without a stored OTP), and `/health` reports Redis down. → Task 10

---

## Phase A: Security fixes (land first, one commit each)

### Task 1: Real-database e2e harness

**Files:**
- Create: `test/e2e/global-setup.ts`, `test/e2e/app.ts`, `test/e2e/fixtures.ts`, `.env.test.example`, `docs/api-changes-slice0.md`
- Modify: `test/jest-e2e.json`, `package.json` (scripts), `.gitignore` (add `.env.test`)
- Delete: `test/app.e2e-spec.ts` (the stub)

**Interfaces:**
- Produces:
  - `createTestApp(): Promise<INestApplication>`. Boots `AppModule` with the same global pipes, filters, interceptors and prefix as `main.ts`. Export a `configureApp(app)` from a new `src/bootstrap.ts` so `main.ts` and the tests share it.
  - `resetDb(prisma: PrismaClient): Promise<void>`. Truncates every table except `_prisma_migrations` with `TRUNCATE ... CASCADE`.
  - `seedUser(prisma, overrides?: Partial<User>): Promise<User>`
  - `seedPlant(prisma, userId: string, overrides?): Promise<Plant>`
  - `tokenFor(app, user: User): string`. Signs a JWT with the app's `JwtService`.

- [ ] **Step 1:** Create the branch `backend-cleanup` from `main`.
- [ ] **Step 2:** Add `.env.test.example`. It sets `DATABASE_URL` to the database `bagicha_test` on the compose Postgres, plus `REDIS_*`, `MINIO_*`, `JWT_SECRET=test-secret` and `RAZORPAY_WEBHOOK_SECRET=test-webhook-secret`.
- [ ] **Step 3:** Write `global-setup.ts`. It loads `.env.test`, creates `bagicha_test` if missing, and runs `prisma migrate deploy`. Wire it in `jest-e2e.json` with `"globalSetup"`, `"testTimeout": 30000` and `"maxWorkers": 1`.
- [ ] **Step 4:** Write `test/e2e/smoke.e2e-spec.ts`. `GET /api/v1/plants/search?q=mango` returns 200 with `success: true`.
- [ ] **Step 5:** Run `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6:** Create `docs/api-changes-slice0.md` with a header and an empty table (Endpoint | Before | After | Task).
- [ ] **Step 7:** Commit: `test: add real-database e2e harness`.

### Task 2: Ownership on diagnosis, vision and ask-ai

**Files:**
- Modify: `src/modules/diagnosis/diagnosis.controller.ts`, `src/modules/diagnosis/services/diagnosis-pipeline.service.ts`, `src/modules/vision/vision.controller.ts`, `src/modules/vision/vision.service.ts`, `src/modules/community/community.service.ts`
- Test: `test/e2e/ownership.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `DiagnosisPipelineService.finalize(userId: string, input: FinalizeDiagnosisDto)`
  - `VisionService.diagnosePlant(userId: string, dto)`
  - `VisionService.identifyPlant(userId: string, dto)` (the userId is used later for rate limiting and logs)
  - `CommunityService.askAi(userId, dto)`. Signature unchanged; it now filters by owner.

- [ ] **Step 1: Write the failing e2e tests.** Seed user A with a plant and user B. Use B's token for each case:
  - `diagnosis finalize on another user's plant returns 404`: POST `/api/v1/diagnosis/finalize` with A's plant id → 404, and the counts of `diagnosisSession`, `journalEntry` and `task` don't change.
  - `diagnosis finalize with another user's session_id returns 404`: B owns a plant, but `session_id` is a session on A's plant → 404.
  - `vision diagnose with another user's plant_id returns 404`. Stub the Gemini call by overriding the `GeminiService` provider in `createTestApp` with a fake that returns a fixed diagnosis JSON.
  - `ask-ai with another user's plant_id returns 404`. Same stub.
  - Positive control for each: A on A's plant → 200.
- [ ] **Step 2:** Run `npm run test:e2e -- ownership`. Expected: the 404 cases FAIL (they currently return 200).
- [ ] **Step 3: Implement.**
  - Every plant lookup on these paths uses `findFirst({ where: { id, user_id: userId } })`, and a miss throws `NotFoundException`.
  - In `finalize`, a supplied `session_id` must belong to that same plant, otherwise 404.
  - Controllers pass `req.user.id`.
  - Today `buildTreeContext` returns `null` for an unknown plant. Change that: an unowned or unknown `plant_id` throws 404 instead of carrying on without context.
- [ ] **Step 4:** Run `npm run test:e2e -- ownership`. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(security): enforce plant ownership on diagnosis, vision and ask-ai`.

**Breaking/behaviour change:** `vision/diagnose` with an unknown `plant_id` now returns 404 instead of diagnosing without context.

### Task 3: Media download-url ownership

**Files:**
- Modify: `src/modules/media/media.controller.ts`, `src/modules/media/media.service.ts`, `src/modules/media/media.config.ts`
- Test: `test/e2e/media-ownership.e2e-spec.ts`, `src/modules/media/media-key.spec.ts`

**Interfaces:**
- Produces: `parseMediaKey(key: string): { kind: MediaKind; ownerId: string; file: string } | null` in `media.config.ts` (pure). It returns `null` for anything that isn't exactly `{prefix}/{ownerId}/{uuid}.jpg`.
- Produces: `MediaService.getDownloadUrlFor(callerId: string, key: string, expirySeconds: number): Promise<string>`

- [ ] **Step 1: Write the failing unit tests** (`media-key.spec.ts`):
  - `parseMediaKey('vision/u1/3f2c…-uuid.jpg')` returns `{kind:'vision', ownerId:'u1', …}`.
  - It returns `null` for each of: `'vision/u1/../u2/x.jpg'`, `'vision//x.jpg'`, `'vision/u1'`, `'unknown/u1/x.jpg'`, `'vision/u1/x.jpg/extra'`, `'vision%2Fu2%2Fx.jpg'`, `''`.
- [ ] **Step 2: Write the failing e2e tests.** Upload a `vision` image as A. Then:
  - B requests `/api/v1/media/download-url/<A's key>` → 404.
  - A requests the same key → 200 with a URL.
  - B requests `posts/<A>/<uuid>.jpg` → 200, because public prefixes stay readable.
  - The Review Focus #1 keys, each requested by B → 404.
- [ ] **Step 3:** Run both. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - Private kinds (anything not in `PUBLIC_PREFIXES`) require `ownerId === callerId`.
  - A `null` parse or an owner mismatch throws `NotFoundException`.
  - The controller passes `req.user.id`.
- [ ] **Step 5:** Run both. Expected: PASS.
- [ ] **Step 6:** Commit: `fix(security): restrict private media download URLs to their owner`.

### Task 4: Verify the Razorpay webhook signature

**Files:**
- Modify: `src/main.ts` / `src/bootstrap.ts` (`rawBody: true`), `src/modules/subscription/subscription.controller.ts`, `src/modules/subscription/subscription.service.ts`
- Create: `src/modules/subscription/razorpay-signature.ts`, `src/modules/subscription/dto/razorpay-webhook.dto.ts`
- Test: `src/modules/subscription/razorpay-signature.spec.ts`, `test/e2e/webhook.e2e-spec.ts`

**Interfaces:**
- Produces: `verifyRazorpaySignature(rawBody: Buffer, signature: string | undefined, secret: string | undefined): boolean` (pure). It computes HMAC-SHA256 hex over the raw body and compares with `crypto.timingSafeEqual`. It returns `false` when the signature or secret is missing or empty.

- [ ] **Step 1: Write the failing unit tests:**
  - A valid signature returns `true`.
  - A flipped byte returns `false`.
  - A missing header returns `false`.
  - A missing secret returns `false`.
  - A different-length signature returns `false` without throwing.
- [ ] **Step 2: Write the failing e2e tests:**
  - POST `/api/v1/subscription/webhook` with no `X-Razorpay-Signature` → 401 and the user is not upgraded.
  - A bad signature → 401.
  - A valid signature (computed in the test with `RAZORPAY_WEBHOOK_SECRET`) → 200 and the user is upgraded. At this point "upgraded" still means `badge_level === 'Rooted'`; Task 19 changes the assertion.
- [ ] **Step 3:** Run both. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - The controller reads `req.rawBody` and the header, then calls `verifyRazorpaySignature` with `config.get('RAZORPAY_WEBHOOK_SECRET')`. A `false` result throws `UnauthorizedException`, so the check fails closed.
  - Validate the payload with `RazorpayWebhookDto`: `event` (string), and `payload.payment.entity.id` and `notes.user_id` (strings).
- [ ] **Step 5:** Run both. Expected: PASS.
- [ ] **Step 6:** Commit: `fix(security): verify Razorpay webhook signatures`.

### Task 5: Auth hardening

The spec covers these under fail-closed and no-secrets-in-code. They're security fixes found while planning.

**Files:**
- Modify: `src/modules/auth/auth.service.ts`, `src/modules/auth/strategies/jwt.strategy.ts`, `src/modules/auth/auth.module.ts`, `src/app.module.ts` (config validation)
- Create: `src/config/env.validation.ts`
- Test: `src/modules/auth/auth.service.spec.ts`, `src/config/env.validation.spec.ts`

**Interfaces:**
- Produces: `validateEnv(raw: Record<string, unknown>): Env`, used as `ConfigModule.forRoot({ validate })`. Required: `DATABASE_URL` and `JWT_SECRET`. Optional: `AUTH_DEV_OTP_PHONE`, `AUTH_DEV_OTP_CODE`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `RAZORPAY_*`, `OTEL_EXPORTER_OTLP_ENDPOINT`. Later tasks add their keys here.

- [ ] **Step 1: Write the failing tests:**
  - `validateEnv` throws when `JWT_SECRET` is missing.
  - `verifyOtp` rejects `+916202042225`/`123456` when the `AUTH_DEV_OTP_*` env vars are unset.
  - `verifyOtp` accepts the configured dev phone and code when `NODE_ENV !== 'production'`, and rejects them when `NODE_ENV === 'production'`.
  - `requestOtp` produces a 6-digit code using `crypto.randomInt`. Assert the stored value matches `/^\d{6}$/`.
- [ ] **Step 2:** Run `npm test -- auth env.validation`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Remove the hard-coded backdoor and the `'bagicha-secret-key-2026'` fallback.
  - Generate the OTP with `crypto.randomInt(100000, 1000000)`.
  - Stop logging the OTP value. It's logged only in non-production, through the Nest `Logger` for now; Task 6 converts it.
- [ ] **Step 4:** Add `AUTH_DEV_OTP_PHONE=+916202042225` and `AUTH_DEV_OTP_CODE=123456` to `.env.test.example`. Note them in `docs/api-changes-slice0.md` so the mock-data login keeps working locally.
- [ ] **Step 5:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6:** Commit: `fix(security): remove auth backdoor and default JWT secret`.

---

## Phase B: Shared foundations (`src/common/`)

### Task 6: Structured logging

**Files:**
- Create: `src/common/logging/logging.module.ts`, `src/common/logging/request-context.ts`
- Modify: `src/app.module.ts`, `src/bootstrap.ts`, and every file in `grep -rn "console\." src` (11 sites), including `src/common/filters/http-exception.filter.ts`

**Interfaces:**
- Produces:
  - Every class logs through an injected `PinoLogger` from nestjs-pino (`@InjectPinoLogger(Ctx.name)`). No `new Logger()` and no `console.*`.
  - `RequestContext.get(): { userId?: string; requestId: string } | undefined` and `RequestContext.setUser(userId: string): void`. This is ALS set by middleware, and a global interceptor calls `setUser` after the guards run. If the builder prefers, it may delegate to `MonitorContext` (already ALS) instead of creating a second store.

- [ ] **Step 1: Write the failing test** `logging.module.spec.ts`. Capture pino output to a stream and assert one log line has keys `level, time, service, version, env, msg`. `service` is `bagicha-backend` and `version` is `package.json` `version`. When called inside an OTel span, `traceId` and `spanId` are present (use the API's no-op tracer with a manually created span context). When `RequestContext` has a user, `userId` is present.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Use `LoggerModule.forRootAsync` with a pino `mixin` that adds `traceId`/`spanId` from `trace.getActiveSpan()` and `userId` from `RequestContext`.
  - Set `bufferLogs: true` and `app.useLogger(app.get(Logger))`.
  - Variable data goes in the object argument, never interpolated into the message.
- [ ] **Step 4:** Replace all 11 `console.*` calls. Run `grep -rn "console\." src`. Expected: no output.
- [ ] **Step 5:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat(observability): structured pino logging with trace and user context`.

### Task 7: Error hierarchy with reason codes

**Files:**
- Create: `src/common/errors/app-error.ts`, `src/common/errors/index.ts`
- Modify: `src/common/filters/http-exception.filter.ts`
- Test: `src/common/filters/http-exception.filter.spec.ts`

**Interfaces:**
- Produces:

```ts
export type ErrorKind = 'operational' | 'programmer';
export abstract class AppError extends Error {
  abstract readonly reason: string;      // machine-readable, SCREAMING_SNAKE
  abstract readonly httpStatus: number;
  abstract readonly kind: ErrorKind;
  constructor(message: string, readonly details?: Record<string, unknown>) { super(message); }
}
// operational: NotFoundError(404), ValidationError(422), ConflictError(409),
//   UnauthorizedError(401), ForbiddenError(403), RateLimitedError(429), UpstreamError(502)
// programmer:  InvariantError(500)
```

  Each subclass constructor is `(reason: string, message: string, details?)`, except `InvariantError(message, details?)`, whose reason is always `INTERNAL_INVARIANT`.
- Produces: the error envelope keeps its current shape (`success:false, error:{code, message, request_id, timestamp, path, details, validation_errors}`). For an `AppError`, `error.code` is its `reason`. For a plain Nest `HttpException`, `code` comes from the status (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `VALIDATION_ERROR`, `RATE_LIMITED`). Unknown errors give `INTERNAL_SERVER_ERROR`.
- Logging: `operational` errors are logged at `warn`, `programmer` and unknown errors at `error`.

- [ ] **Step 1: Write the failing tests:**
  - `new NotFoundError('PLANT_NOT_FOUND','…')` produces status 404, `error.code === 'PLANT_NOT_FOUND'` and a warn log.
  - `InvariantError` produces 500, `INTERNAL_INVARIANT` and an error log.
  - A plain `Error` produces 500 and `INTERNAL_SERVER_ERROR` without leaking its message.
  - A validation-pipe failure produces 422 and `VALIDATION_ERROR` with `validation_errors` filled in.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the hierarchy and the filter.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(errors): shared error hierarchy with reason codes`.

From here on, new and changed code throws `AppError` subclasses only. Phase C tasks convert the remaining Nest exceptions in each module they touch.

### Task 8: Tracing and metrics

**Files:**
- Create: `src/instrumentation.ts`, `src/common/observability/with-span.ts`, `src/common/observability/metrics.ts`, `src/common/observability/observability.module.ts`
- Modify: `package.json` (`start`, `start:dev`, `start:prod` load `instrumentation` through `node --require`, never imported from `main.ts`), `src/app.module.ts`, `src/config/env.validation.ts`
- Test: `src/common/observability/with-span.spec.ts`, `src/common/observability/metrics.spec.ts`

**Interfaces:**
- Produces: `withSpan<T>(name: string, attributes: Record<string, string | number | boolean>, fn: () => Promise<T>): Promise<T>`. It starts an active span, records the exception and sets ERROR status on throw, ends the span on every exit, and rethrows.
- Produces: `Metrics` (injectable, global). Every later task emits through these methods:
  - `aiCall(feature: 'identify' | 'diagnose' | 'ask_ai', outcome: 'ok' | 'invalid_response' | 'error' | 'not_configured'): void`
  - `diagnosisRecorded(issue: string): void`
  - `taskCreated(source: TaskSource, count?: number): void`
  - `taskCompleted(): void`
  - `rateLimitRejected(bucket: string): void`
  - `registerQueueDepth(name: string, getDepth: () => Promise<number>): void`. An observable gauge `bagicha.queue.depth{queue}`.
  - Names use the prefix `bagicha.`, e.g. `bagicha.ai.calls`.
- `instrumentation.ts`: the NodeSDK with auto-instrumentations. It exports traces and metrics over OTLP/HTTP only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Otherwise it starts with no exporter: no errors and no network calls.

- [ ] **Step 1: Write the failing tests:**
  - `withSpan` ends the span on success and on throw, and records the exception. Use an in-memory span exporter.
  - `Metrics.aiCall('diagnose','ok')` increments the counter with those attributes. Use an in-memory metric reader.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm run build && node --require ./dist/instrumentation.js dist/main.js` with no OTLP env set. Expected: the app boots and logs no OTel errors. Stop it.
- [ ] **Step 5:** Commit: `feat(observability): OpenTelemetry tracing, withSpan and metrics helper`.

### Task 9: Clock, IST helpers and pagination primitives

**Files:**
- Create: `src/common/time/clock.ts`, `src/common/time/ist.ts`, `src/common/pagination/pagination.ts`, `src/common/pagination/pagination-query.dto.ts`
- Test: `src/common/time/ist.spec.ts`, `src/common/pagination/pagination.spec.ts`

**Interfaces:**
- Produces:
  - `abstract class Clock { abstract now(): Date }`, with `SystemClock` and `FixedClock(date: Date)` (for tests). Provided globally as `Clock`.
  - `istMonth(d: Date): number` (1–12), `istYear(d: Date): number` and `addDays(d: Date, days: number): Date`.
  - `PaginationQueryDto { page: number = 1 (@IsInt @Min(1)); page_size: number = 20 (@IsInt @Min(1) @Max(100)) }` with `@Type(() => Number)`.
  - `type Page<T> = { items: T[]; pagination: { page; page_size; total_items; total_pages; has_next; has_previous } }`. This is the shape `TransformInterceptor` already unwraps.
  - `toPage<T>(items: T[], total: number, q: { page: number; page_size: number }): Page<T>`
  - `toSkipTake(q): { skip: number; take: number }`

- [ ] **Step 1: Write the failing tests:**
  - `istMonth(new Date('2026-10-31T19:00:00Z'))` is `11`. IST is +05:30, so this is 1 Nov 00:30.
  - `istMonth(new Date('2026-10-31T18:00:00Z'))` is `10`.
  - `istYear(new Date('2026-12-31T19:00:00Z'))` is `2027`.
  - `toPage([..2], 45, {page:2,page_size:20})` gives `{total_pages:3, has_next:true, has_previous:true}`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement with `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata' })`. Don't add a date library.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(common): clock, IST helpers and pagination primitives`.

### Task 10: Rate limiting

**Files:**
- Create: `src/common/rate-limit/rate-limit.module.ts`, `src/common/rate-limit/user-or-ip.tracker.ts`, `src/common/rate-limit/limits.ts`
- Modify: `src/app.module.ts`, controllers in auth, vision, community, diagnosis, media, plants
- Test: `test/e2e/rate-limit.e2e-spec.ts`, `src/common/rate-limit/user-or-ip.tracker.spec.ts`

**Interfaces:**
- Produces: named throttler buckets in `limits.ts`. Limits are per user when signed in, otherwise per IP. These numbers are my call:
  - `auth`: 5 per minute per IP. Applies to `request-otp` and `verify-otp`.
  - `ai`: 20 per hour. Applies to `vision/identify`, `vision/diagnose`, `community/ask-ai` and `diagnosis/finalize`.
  - `upload`: 30 per hour. Applies to `media/images`.
  - `catalogue`: 60 per minute per IP. Applies to `plants/search` and `plants/resolve`.
  - `default`: 300 per minute, everything else.
- Storage: Redis-backed. If Redis is unavailable the limiter **fails open** (the allowed exception) and logs at `warn`.
- A rejection is a `RateLimitedError('RATE_LIMITED', …)` with `details.bucket`, and calls `metrics.rateLimitRejected(bucket)`.

- [ ] **Step 1: Write the failing tests.**
  - e2e: the 6th `request-otp` from one IP within a minute → 429 with `error.code === 'RATE_LIMITED'`.
  - Unit: the tracker returns `user:<id>` when `req.user` is set, and `ip:<ip>` otherwise.
  - **Review Focus #5:** an e2e case with the throttler storage swapped for one that throws. Requests still succeed (fail open). `verify-otp` with no stored OTP still → 401 (fail closed).
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement and record the numbers in `limits.ts` with a one-line note on why.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(security): Redis-backed rate limiting on costly and abusable routes`.

### Task 11: Health, graceful shutdown and constructor hygiene

**Files:**
- Create: `src/common/health/health.module.ts`, `src/common/health/health.controller.ts`
- Modify: `src/bootstrap.ts` (`enableShutdownHooks()`), `src/common/redis/redis.service.ts` (close with `quit()`), `src/common/monitor/monitor.service.ts` (move `process.env.NODE_ENV` to `ConfigService`)
- Test: `test/e2e/health.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `GET /api/v1/health`, unauthenticated and not rate-limited. It returns `{ status: 'ok' | 'error', checks: { database, redis } }`. HTTP 200 when everything is up, 503 otherwise.
  - Liveness at `GET /api/v1/health/live` always returns 200 while the process runs.

- [ ] **Step 1: Write the failing e2e tests:**
  - `/health` → 200 with `checks.database.status === 'up'`.
  - With `RedisService` overridden by a ping that throws → 503 with `redis.status === 'down'`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement** with terminus indicators: a Prisma `SELECT 1` and Redis `PING`.
  - Shutdown closes Prisma (already does), Redis (`quit`) and BullMQ workers (`@nestjs/bullmq` handles this on shutdown hooks).
  - Grep for I/O in constructors: `grep -rn "constructor" src | xargs` and review. `GeminiService` is fixed in Task 18.
- [ ] **Step 4:** Run `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(ops): health endpoint and graceful shutdown`.

### Task 12: Audit trail

**Files:**
- Modify: `prisma/schema.prisma`
- Create: a migration (`add_audit_events`), `src/modules/audit/audit.module.ts`, `src/modules/audit/audit.repository.ts`, `src/modules/audit/audit.service.ts`, `src/modules/audit/index.ts`
- Test: `src/modules/audit/audit.service.spec.ts`

**Interfaces:**
- Produces: the Prisma model

```prisma
model AuditEvent {
  id            String   @id @default(uuid())
  actor_user_id String?
  action        String   // AuditAction value
  target_type   String
  target_id     String
  snapshot      Json
  created_at    DateTime @default(now())
  @@index([target_type, target_id])
  @@index([actor_user_id, created_at])
  @@map("audit_events")
}
```

- Produces:
  - `enum AuditAction { AUTH_SIGNED_IN = 'AUTH_SIGNED_IN', SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED', COMMUNITY_REPORT_FILED = 'COMMUNITY_REPORT_FILED' }`
  - `AuditService.record(event: { actorUserId: string | null; action: AuditAction; targetType: string; targetId: string; snapshot: Record<string, unknown> }, tx?: Prisma.TransactionClient): Promise<void>`. The table is append-only: there's no update or delete method.
- Produces, in `src/common/prisma/transaction.ts`: `TransactionRunner.run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>`. Every repository method takes an optional `tx` from here on.

- [ ] **Step 1: Write the failing test.** `record` inside a transaction that rolls back leaves no row. Run it against the test DB in the e2e suite as `test/e2e/audit.e2e-spec.ts`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Add the model and migration (`npx prisma migrate dev --name add_audit_events`) and implement.
- [ ] **Step 4:** Wire `AUTH_SIGNED_IN` into `AuthService.verifyOtp`. The snapshot is `{ user_id, phone_number_last4, is_new_user }`; never the OTP. Extend the auth unit test to assert one `record` call.
- [ ] **Step 5:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat(security): append-only audit trail`.

---

## Phase C: Modules on the foundation

### Task 13: Plant ledger repositories (user-scoped)

**Files:**
- Create in `src/modules/plant-ledger/repositories/`: `plant.repository.ts`, `journal.repository.ts`, `cycle.repository.ts`, `task.repository.ts`
- Modify: `prisma/schema.prisma` (add `@@index([user_id])` to `Plant`) and a migration (`index_plant_user_id`)
- Test: `test/e2e/ledger-repositories.e2e-spec.ts`

**Interfaces:**
- Produces. Every method is owner-filtered and takes an optional `tx`. Methods that can miss return `null`; they never throw.
  - `PlantRepository`: `findOwned(userId, plantId)`, `listOwned(userId, q: {skip,take})` returning `{rows, total}`, `create(userId, data)`, `updateOwned(userId, plantId, data)` (returns `null` on miss) and `findOwnedWithContext(userId, plantId)` (the include shape vision needs today).
  - `JournalRepository`: `listForPlant(userId, plantId, q)`, `create(userId, plantId, data)`, `listForCycle(userId, plantId, cycleId)` and `recentByTypes(userId, plantId, types, take)`.
  - `CycleRepository`: `upsertForYear(userId, plantId, cycleYear)`, `listForPlant(userId, plantId, q)`, `latestTwo(userId, plantId)` and `update(userId, cycleId, data)`.
  - `TaskRepository`: `listForPlant(userId, plantId, q)`, `listForUser(userId, q)`, `findOwned(userId, plantId, taskId)`, `create(userId, plantId, data)`, `findPendingBySourceKey(userId, plantId, source, sourceKey)` and `updateStatus(userId, plantId, taskId, status, completedAt)`.
- Ownership on child tables goes through the relation: `where: { plant: { user_id: userId }, ... }`.

- [ ] **Step 1: Write the failing e2e tests.** For each repository, user B calling every read and update method with user A's ids gets `null` or an empty list, and A's rows are unchanged. `listOwned` respects `skip`/`take`, and `total` counts only the owner's rows.
- [ ] **Step 2:** Run them. Expected: FAIL (the files don't exist yet).
- [ ] **Step 3:** Implement and add the index migration.
- [ ] **Step 4: Review Focus #4.** Add `test/e2e/pagination.e2e-spec.ts`:
  - `GET /api/v1/ledger/plants?page=0` → 422.
  - `?page=abc` → 422.
  - `?page_size=10000` → 422.
  - The same for `/ledger/tasks` and `/community/feed`.

  These tests start passing in Tasks 15 and 20, which wire `PaginationQueryDto`. Mark them `it.todo` here and switch them on there.
- [ ] **Step 5:** Run `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat(ledger): user-scoped repositories and Plant.user_id index`.

### Task 14: Pure ledger domain rules

**Files:**
- Create in `src/modules/plant-ledger/domain/`: `species-config.ts`, `cycle-year.ts`, `task-mapping.ts`, `follow-up-templates.ts`, `planting-date.ts`, `cycle-summary.ts`, `mitigation-planner.ts`
- Test: one `.spec.ts` beside each

**Interfaces:** All of these are pure functions or classes with no Nest dependencies. They are moved from today's private methods with identical logic, except for the IST change.
- `SPECIES_CONFIG: Record<string, { cycleStartMonth: number }>`: mango 11, litchi 11, citrus 7, guava 6, pomegranate 6, banana 1, default 1. This is the config map, which is my call over `PlantCatalogEntry`.
- `resolveCycleYear(speciesFamily: string, eventAt: Date): number`. Uses `istMonth`/`istYear`. Returns `month >= start ? year : year - 1`.
- `taskTypeFromCategory(c: string): TaskType`, `taskCategoryFromCategory(c: string): TaskCategory` and `taskPriorityFrom(p: string): TaskPriority`. These come from `seasonal.service.ts:395-442`.
- `taskTypeFromIssue(i: DiagnosisIssueType): TaskType`, `taskCategoryFromIssue(i)` and `taskPriorityFromSeverity(s: DiagnosisSeverity, index: number)`. These come from `diagnosis-pipeline.service.ts:244-283`.
- `defaultTaskTitle(type: TaskType): string`
- `followUpTemplateFor(plantName: string, logType: LogType): FollowUpTemplate | null`. This comes from `plant-ledger.service.ts:867`.
- `parsePlantingDate(input, precision?, clock: Clock): ParsedPlantingDate`
- `buildCycleSnapshot(entries: JournalEntry[]): CycleSnapshot`. This is the computation inside `refreshCycleSummary` plus `buildCycleSummary`/`buildRecommendedActions`, returning exactly the fields written to `PlantCycle` today.
- `class MitigationPlanner { plan(input: { latest, previous, recentHealthLogs, latestCycleTasks, latestCycleLogs }): MitigationPlan }`. `MitigationPlan` is the exact object `getMitigationPlan` returns today.
- `buildTaskSourceSummary(...)` and `mapTaskView(...)`. These are the response mappers, unchanged.

- [ ] **Step 1: Write the failing tests:**
  - `resolveCycleYear('mango', 2026-10-31T19:00Z)` is `2026`, because 1 Nov IST is at or after November.
  - `resolveCycleYear('mango', 2026-10-31T18:00Z)` is `2025`.
  - `resolveCycleYear('citrus', 2026-06-30T19:00Z)` is `2026`.
  - Each mapping table, row by row, matches today's switch statements.
  - `followUpTemplateFor('Aam', PEST_DIAGNOSIS)` gives `{type: TREAT, priority: HIGH, dueInDays: 1}`.
  - **Golden tests for `MitigationPlanner` and `buildCycleSnapshot`:** before moving any code, record the outputs of the *current* private methods for three fixtures (a healthy cycle, a heavy fruit drop with pests, and an empty cycle) into `__fixtures__/` JSON, then assert the new functions produce exactly the same output.
- [ ] **Step 2:** Run `npm test -- domain`. Expected: FAIL.
- [ ] **Step 3:** Move the logic.
- [ ] **Step 4:** Run `npm test -- domain`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(ledger): extract pure domain rules with golden tests`.

**Breaking/behaviour change:** the cycle year is now decided by the IST month, which affects only events near IST midnight on the 1st.

### Task 15: Split the ledger service and publish its barrel

**Files:**
- Create in `src/modules/plant-ledger/services/`: `plant-record.service.ts`, `journal.service.ts`, `cycle.service.ts`, `task.service.ts`, `mitigation.service.ts`. Also create `src/modules/plant-ledger/index.ts`.
- Modify: `plant-ledger.controller.ts`, `plant-ledger.module.ts`, `processors/task.processor.ts`, `services/lifecycle.service.ts`, `services/seasonal-intelligence.service.ts` (inject `Clock`, use `istMonth`)
- Delete: `plant-ledger.service.ts`, `plant-ledger.service.spec.ts`, `plant-ledger.controller.spec.ts` (the stubs)
- Test: `test/e2e/ledger.e2e-spec.ts`, plus unit specs for `task.service` and `task.processor`

**Interfaces:**
- Produces, exported from `index.ts`, which is the only import path for siblings:
  - `PlantRecordService.getOwnedOrThrow(userId, plantId): Promise<Plant>`. Throws `NotFoundError('PLANT_NOT_FOUND')`.
  - `PlantRecordService.getContextForAi(userId, plantId): Promise<PlantAiContext>`. This is today's `buildTreeContext` output shape.
  - `CycleService.ensureCycle(userId, plant: Plant, eventAt: Date, tx?): Promise<PlantCycle>`
  - `JournalService.addEntry(userId, plantId, data: NewJournalEntry, tx?): Promise<JournalEntry>`. Handles the cycle, milestones, summary refresh and follow-up task.
  - `TaskService.createTasks(userId, plantId, drafts: TaskDraft[], tx?): Promise<TaskCreationResult[]>`. **This is the single task-creation entry point.** `TaskDraft = { type; category; priority; title; source: TaskSource; sourceKey: string; reason?; metadata?; dueDate: Date; plantCycleId?; seasonalPackId?; personalizedOverlayId?; diagnosisOutcomeId? }`. `TaskCreationResult = { sourceKey: string; status: 'created' | 'skipped' | 'failed'; taskId?: string; reason?: string }`. A draft whose `(source, sourceKey)` already has a PENDING task is `skipped`. Emits `metrics.taskCreated`.
  - `TaskService.updateStatus(...)`. Emits `metrics.taskCompleted` when status becomes COMPLETED.
  - `SeasonalIntelligenceService` and `SpeciesNormalizationService` (re-exported).
  - The types `TaskDraft`, `TaskCreationResult`, `NewJournalEntry` and `PlantAiContext`.
- Every list route takes `PaginationQueryDto` and returns `Page<T>`: `GET ledger/plants`, `plants/:id/cycles`, `plants/:id/tasks` and `tasks`. The timeline already pages.
- The task-generation job payload becomes `{ user_id, plant_id, lifecycle_stage, species }`. `TaskProcessor` uses `TaskService.createTasks` with `sourceKey = lifecycle:{plant_id}:{stage}:{type}`. That makes it idempotent: a retry gives `skipped`. Due dates come from `Clock`, and the processor no longer mutates `now`. Today `now.setMonth` mutates one Date for both tasks, so the prune date is 9 months out instead of 3. Fixing this is a behaviour change; list it.

- [ ] **Step 1: Write the failing tests.**
  - `ledger.e2e-spec.ts` covers the loop end to end as A: create a plant, add a journal entry (`PEST_DIAGNOSIS`), get the timeline, cycles and tasks (expect the follow-up `TREAT` task), complete the task, and get the mitigation plan.
  - Every response's `data` matches today's field names. Today's shapes are listed in `plant-ledger.service.ts`; check before deleting it.
  - B gets 404 on every `:id` route with A's ids.
  - Switch on the Task 13 pagination `todo`s for the ledger routes.
  - Unit: `createTasks` with a duplicate PENDING source key returns `skipped`.
  - Unit: `TaskProcessor.process` run twice with the same job creates its tasks once.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement the split. Services depend only on repositories, the domain functions, `Clock`, `Metrics`, `TransactionRunner` and the logger. Every exception is an `AppError`.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(ledger): split ledger service by responsibility behind a barrel`.

**Breaking/behaviour change:**
- `GET ledger/plants/:id` on another user's plant now returns 404 (it was 403).
- The four list routes return `pagination`.
- Lifecycle task due dates are fixed.

### Task 16: AI provider interface

**Files:**
- Create in `src/modules/ai/`: `ai.module.ts`, `ai-provider.ts`, `gemini.provider.ts`, `json-response.ts`, `index.ts`
- Delete: `src/modules/vision/services/gemini.service.ts`
- Modify: `src/config/env.validation.ts` (`GEMINI_MODEL`)
- Test: `src/modules/ai/json-response.spec.ts`, `src/modules/ai/gemini.provider.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface AiImage { data: string; mimeType: string }
export abstract class AiProvider {
  abstract generateJson(req: { feature: 'identify' | 'diagnose' | 'ask_ai'; prompt: string; image?: AiImage }): Promise<Record<string, unknown>>;
}
```

- `extractJsonObject(text: string): Record<string, unknown>` (pure). Strips code fences, takes the first balanced `{…}` and parses it. Anything that doesn't give an object throws `UpstreamError('AI_RESPONSE_INVALID', …)`.
- `GeminiProvider implements AiProvider`:
  - Creates the client on first use, never in the constructor.
  - Reads `GEMINI_API_KEY` and `GEMINI_MODEL` at call time. If either is missing it throws `UpstreamError('AI_NOT_CONFIGURED', …)` and records `metrics.aiCall(feature, 'not_configured')`.
  - Wraps the call in `withSpan('ai.generate', { feature, model })`.
  - Records `metrics.aiCall` with `ok`, `invalid_response` or `error`.
  - Provider failures become `UpstreamError('AI_PROVIDER_ERROR')`.
- There are two consumers, vision and community, which justifies the interface.
- The e2e tests from Task 2 override `GeminiService`. Switch those overrides to a fake `AiProvider` in this task.

- [ ] **Step 1: Write the failing tests:**
  - `extractJsonObject` handles a fenced block, prose plus JSON, and plain JSON.
  - It throws `AI_RESPONSE_INVALID` for `'not json'`, `'[1,2]'` and `''`.
  - `GeminiProvider` with no key throws `AI_NOT_CONFIGURED` without touching the network.
  - A stubbed SDK returning prose-wrapped JSON gives the object.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test -- ai`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(ai): provider interface with Gemini implementation`.

**Breaking/behaviour change:** a missing AI configuration now fails with `AI_NOT_CONFIGURED` instead of calling with `'MOCK_KEY'`.

### Task 17: Diagnosis on the ledger

**Files:**
- Create: `src/modules/diagnosis/repositories/diagnosis.repository.ts`, `src/modules/diagnosis/index.ts`
- Modify: `src/modules/diagnosis/services/diagnosis-pipeline.service.ts`, `src/modules/diagnosis/diagnosis.controller.ts` (remove the `{success,data}` double wrap), `src/modules/diagnosis/diagnosis.module.ts`
- Test: `src/modules/diagnosis/services/diagnosis-pipeline.service.spec.ts`, plus extend `test/e2e/ownership.e2e-spec.ts`

**Interfaces:**
- Consumes: `PlantRecordService.getOwnedOrThrow`, `CycleService.ensureCycle`, `JournalService.addEntry`, `TaskService.createTasks`, the `taskTypeFromIssue` family, `TransactionRunner`, `Clock` and `Metrics`.
- Produces:
  - `DiagnosisRepository`: `findOwnedSession(userId, sessionId, plantId)`, `createSession(userId, plantId, data, tx)`, `resolveSession(userId, sessionId, data, tx)` and `createOutcome(userId, plantId, data, tx)`. All are owner-filtered through `plant.user_id`.
  - `DiagnosisPipelineService.finalize(userId, input): Promise<FinalizeDiagnosisResult>`. The result becomes `{ session_id, outcome_id, log_ids, tasks: TaskCreationResult[] }`, with per-item outcomes replacing `task_ids`.
  - Calls `metrics.diagnosisRecorded(primary_issue)`.
- The barrel exports `DiagnosisPipelineService` and `FinalizeDiagnosisInput`. Vision passes `FinalizeDiagnosisInput`, not the HTTP DTO.

- [ ] **Step 1: Write the failing unit tests**, using stub ledger services and `FixedClock`:
  - Five actions with severity HIGH give five drafts. The first is priority HIGH and due at `eventAt + follow_up_days`. Later ones are MEDIUM and due at `+follow_up_days + index*2`. This matches today's logic.
  - `MAX_TASKS_FROM_DIAGNOSIS = 5` caps seven actions at five.
  - `subject_type !== TREE` throws `ValidationError('DIAGNOSIS_SUBJECT_UNSUPPORTED')`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Everything runs in one `TransactionRunner.run`, passing `tx` through the ledger services.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(diagnosis): write through the ledger with per-item task outcomes`.

**Breaking/behaviour change:**
- `diagnosis/finalize` returns `tasks[]` instead of `task_ids`.
- The response is no longer double-wrapped.

### Task 18: Vision on the AI provider and diagnosis

**Files:**
- Create: `src/modules/vision/diagnosis-prompt.ts`, `src/modules/vision/ai-diagnosis.mapper.ts`, `src/modules/vision/index.ts`
- Modify: `src/modules/vision/vision.service.ts`, `src/modules/vision/vision.module.ts`
- Test: `src/modules/vision/ai-diagnosis.mapper.spec.ts`, `src/modules/vision/vision.service.spec.ts`

**Interfaces:**
- Consumes: `AiProvider`, `PlantRecordService.getContextForAi` and `DiagnosisPipelineService.finalize`.
- Produces:
  - `buildDiagnosisPrompt(context: PlantAiContext | null, note: string | null): string` (pure). The prompt text is unchanged from today.
  - `buildIdentifyPrompt(): string`
  - `mapAiDiagnosis(raw: Record<string, unknown>): FinalizeDiagnosisInput` (pure). Uses today's coercions: `mapDiagnosisIssue`, `mapDiagnosisSeverity`, `mapRelatedLogType`, `toStringArray`, `toPositiveInt` and `toBoolean`. It throws `UpstreamError('AI_RESPONSE_INVALID')` when there is no usable `primary_issue` **and** no `reasoning_summary`.
  - `VisionService.identifyPlant(userId, dto)` and `VisionService.diagnosePlant(userId, dto)`. Each is a short orchestration: context, prompt, provider, mapper, pipeline.

- [ ] **Step 1: Write the failing tests (Review Focus #2).** `mapAiDiagnosis` handles:
  - `confidence: 87` → `'87'`
  - `recommended_actions: 'water it'` → `['water it']`
  - unknown `primary_issue` with a summary present → `UNKNOWN`
  - `follow_up_days: '-3'` → the default 5
  - `{}` → throws `AI_RESPONSE_INVALID`

  `VisionService.diagnosePlant` with a provider that throws `AI_RESPONSE_INVALID` calls `finalize` **zero** times.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(vision): AI provider, pure prompt and mapper, persist through diagnosis`.

**Breaking/behaviour change:** malformed AI output now returns 502 `AI_RESPONSE_INVALID` instead of saving an UNKNOWN diagnosis.

### Task 19: Premium status, separate from rank

**Files:**
- Modify: `prisma/schema.prisma` (`User`)
- Create:
  - migration `separate_premium_from_badge`, which adds the columns and then runs the SQL data step
  - `src/modules/user/premium-policy.ts`
  - `src/modules/user/user.repository.ts`
  - `src/modules/user/index.ts`
  - `src/modules/subscription/plans.ts`
- Modify: `src/modules/subscription/subscription.service.ts`, `src/modules/subscription/dto/create-order.dto.ts`, `src/modules/user/user.service.ts`
- Test: `src/modules/user/premium-policy.spec.ts`, `src/modules/subscription/subscription.service.spec.ts`, update `test/e2e/webhook.e2e-spec.ts`

**Interfaces:**
- Produces, in the schema: `enum SubscriptionTier { FREE PREMIUM }`, then on `User`: `subscription_tier SubscriptionTier @default(FREE)` and `premium_expires_at DateTime?`.
- The data step, in the same migration:

```sql
UPDATE users SET subscription_tier = 'PREMIUM', premium_expires_at = NULL, badge_level = 'Seedling'
WHERE badge_level = 'Rooted';
```

- Produces:
  - `PremiumPolicy.isPremium(user: Pick<User,'subscription_tier'|'premium_expires_at'>, now: Date): boolean`. True only when the tier is PREMIUM and the expiry is null or later than `now`.
  - `PLANS = { PREMIUM_MONTHLY: { amountPaise: 29900, days: 30 }, PREMIUM_YEARLY: { amountPaise: 299900, days: 365 } } as const`. `CreateOrderDto.plan_id` becomes `@IsIn(Object.keys(PLANS))`.
  - `createOrder` returns `notes: { user_id, plan_id }` alongside the order.
  - The webhook (still signature-verified) handles `order.paid` and reads `notes.user_id` and `notes.plan_id`.
    - New expiry = `max(now, current expiry ?? now) + plan.days`. A null (lifetime) expiry stays null.
    - **Idempotent:** Redis `SET webhook:razorpay:{payment_id} 1 NX EX 604800`. If the key exists, return `{received:true, duplicate:true}` without changing anything.
    - Writes `AuditAction.SUBSCRIPTION_CHANGED` with a before/after snapshot of `{tier, expires_at}`.

- [ ] **Step 1: Write the failing tests:**
  - `isPremium`: PREMIUM with null expiry → true. PREMIUM expired yesterday → false. FREE → false.
  - Webhook: MONTHLY on a FREE user gives expiry `now+30d` (with `FixedClock`). MONTHLY on a user with 10 days left gives `+40d`. A lifetime user stays null. One audit record each.
  - **Review Focus #3:** the same `payment_id` twice gives one extension and one audit record, and the second response has `duplicate: true`.
  - e2e: a valid signed webhook gives `subscription_tier === 'PREMIUM'` and leaves `badge_level` unchanged. Update the Task 4 assertion.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement, then run `npx prisma migrate dev --name separate_premium_from_badge`. Check against the dev DB that `Rooted` users became PREMIUM.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(subscription): premium tier and expiry separate from badge rank`.

**Breaking/behaviour change:**
- `badge_level` no longer means paid.
- `create-order` rejects unknown `plan_id` values.
- Users who were `Rooted` show `Seedling`.

### Task 20: Seasonal on the ledger

**Files:**
- Create in `src/modules/seasonal/`: `repositories/seasonal-pack.repository.ts`, `repositories/overlay.repository.ts`, `domain/season-window.ts`, `domain/region-cluster.ts`, `domain/overlay-rules.ts`, `index.ts`
- Modify: `src/modules/seasonal/seasonal.service.ts`, `src/modules/seasonal/services/weather.service.ts`, `src/modules/seasonal/processors/weather.processor.ts`, `src/modules/seasonal/seasonal.module.ts`
- Test: specs beside each domain file, `src/modules/seasonal/seasonal.service.spec.ts`, `src/modules/seasonal/processors/weather.processor.spec.ts`

**Interfaces:**
- Consumes: `PlantRecordService.getOwnedOrThrow`, `JournalService` (recent entries), `TaskService.createTasks`, `PremiumPolicy`, `Clock` and `Metrics`.
- Produces:
  - `resolveSeasonWindow(now: Date): SeasonWindow`, using `istMonth`.
  - `resolveRegionCluster(district: string | null): RegionCluster`
  - `buildPersonalizedOverlay(plant, entries, pack, now: Date)`. The rules move unchanged; `expires_at` is `now + 48h`.
  - `OverlayRepository` filters by `user_id` (the overlay is user-owned). `SeasonalPackRepository` is shared and not user-owned.
  - `materializeTasksForTree(userId, plantId)` returns `{ results: TaskCreationResult[], created_count: number }`, with per-item outcomes.
  - `WeatherService.getSeasonalSuggestions` uses `Clock` and `istMonth`.
  - `WeatherProcessor` skips the fetch when `weather:{pincode}` is already cached. That's the idempotency check.
  - `BullMQ queue depth` is registered with `metrics.registerQueueDepth` for both queues.
  - `WeatherService.getWeather` is wrapped in `withSpan('weather.fetch', { pincode })`. It's still mocked, but it's the external-call seam.

- [ ] **Step 1: Write the failing tests:**
  - `resolveSeasonWindow(2026-06-30T19:00Z)` is `MONSOON` (1 Jul IST), and `(2026-06-30T18:00Z)` is `SUMMER`.
  - `materializeTasksForTree` run twice gives everything `created` the first time and everything `skipped` the second.
  - A non-premium user gets no overlay. A premium user with a dryness log gets two overlay tasks.
  - `WeatherProcessor` with a cache hit calls `getWeather` zero times.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. `seasonal` no longer touches the plant or task tables directly.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(seasonal): repositories, IST season window, tasks via ledger`.

**Breaking/behaviour change:**
- `materialize-tasks` returns `results[]` with per-item outcomes.
- The season window flips at IST midnight.

### Task 21: Community, chat, user, plants catalogue and marketplace

**Files:**
- Create repositories:
  - `src/modules/community/repositories/{post,comment,report,expert}.repository.ts`
  - `src/modules/chat/message.repository.ts`
  - `src/modules/plants/catalog.repository.ts`
  - `src/modules/plants/dto/resolve-plant.dto.ts`
- Create an `index.ts` in community, chat, plants, marketplace, media, auth and subscription.
- Modify the services and controllers in those modules, plus `src/modules/user/user.service.ts` (use `UserRepository`).
- Test: `src/modules/community/community.service.spec.ts` (replace the stub), `test/e2e/community.e2e-spec.ts`, `test/e2e/chat.e2e-spec.ts`

**Interfaces:**
- Consumes: `AiProvider`, `PlantRecordService.getOwnedOrThrow` (ask-ai plant context), `AuditService`, `PaginationQueryDto` and `Page`.
- Produces:
  - `askAi` gets plant context only from `PlantRecordService`, and calls `AiProvider.generateJson({feature:'ask_ai', …})`.
  - `reportPost` and `reportComment` write `AuditAction.COMMUNITY_REPORT_FILED` with a snapshot `{ target_type, target_id, reason, content_excerpt (≤200 chars), reporter_id }` in the same transaction as the report row.
  - Pagination: `chat/inbox`, `chat/messages/:userId` and `plants/search` take `PaginationQueryDto` and return `Page`. The community feed switches to the DTO.
  - `plants/resolve` validates its body with `ResolvePlantDto { query: string (@IsNotEmpty @MaxLength(100)); region_cluster?: RegionCluster (@IsEnum); language?: string (@MaxLength(10)) }`.
  - `PlantsService.onModuleInit` keeps its seeding but must be safe to run repeatedly (`createMany` with `skipDuplicates`, or a check-then-insert).
  - Remove the double wraps in `media.controller` (both routes).
  - `MediaService` wraps `putObject`, `presignedGetObject` and the bucket setup in `withSpan('minio.<op>', { bucket })`.
  - `AuthService` stops generating user ids with `uuidv4()` and lets the database default (`@default(uuid())`) assign them. Auth reads and writes users through `UserRepository`.

- [ ] **Step 1: Write the failing tests:**
  - Reporting a post writes exactly one audit row, and reporting again (idempotent) writes none.
  - The feed's `?page_size=10000` → 422 (switch on the Task 13 todo).
  - Chat messages page in order, and `page=2` returns the next slice.
  - `plants/resolve` with an empty `query` → 422.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. No service in these modules calls `PrismaService` directly.
- [ ] **Step 4:** Run `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor: repositories, pagination and audit for community, chat, user, plants, marketplace`.

**Breaking/behaviour change:**
- Chat and catalogue lists return `pagination`.
- `plants/resolve` rejects invalid bodies with 422.
- Media responses are no longer double-wrapped.

### Task 22: Enforce boundaries and final verification

**Files:**
- Modify: `eslint.config.mjs`, `package.json`
- Create: `scripts/check-boundaries.sh`
- Finish: `docs/api-changes-slice0.md`
- Delete: every remaining `*.spec.ts` stub that only asserts `toBeDefined()`

**Interfaces:**
- ESLint `no-restricted-imports` bans cross-module deep imports: under `src/modules/<a>/`, any import that resolves into `src/modules/<b>/` must target `<b>/index` (or the folder).
- `npm run check:cycles` runs `madge --circular --extensions ts src` and fails on any cycle.
- `scripts/check-boundaries.sh` fails if any of these find a match:
  - `grep -rn "console\." src`
  - `grep -rnE "prisma\.(plant|journalEntry|plantCycle|task|diagnosisSession|diagnosisOutcome|personalizedOverlay)\b" src --include=*.ts | grep -v "/repositories/"`
  - `grep -rn "new Date()" src/modules --include=*.ts | grep -v -e "\.spec\.ts" -e "clock.ts"`
  - `grep -rn "throw new Error(" src --include=*.ts`

- [ ] **Step 1:** Add the lint rule, the madge script and the boundary script. Run `npm run lint`, `npm run check:cycles` and `bash scripts/check-boundaries.sh`. Fix everything they report.
- [ ] **Step 2:** Walk the `docs/coding-principles.md` §8 checklist against the full diff (`git diff main...HEAD`). Record each item as ✅, fixed, or a documented exception (spec §7) in a "Principles review" section at the bottom of `docs/api-changes-slice0.md`.
- [ ] **Step 3:** Complete the breaking-changes table from every task's **Breaking/behaviour change** note.
- [ ] **Step 4:** Run the full verification:

```bash
npm run build && npm run lint && npm test && npm run check:cycles && bash scripts/check-boundaries.sh
docker compose up -d postgres redis minio && npm run test:e2e
```

  Expected: every command exits 0.
- [ ] **Step 5:** Commit: `chore: enforce module boundaries and document slice-0 API changes`.
