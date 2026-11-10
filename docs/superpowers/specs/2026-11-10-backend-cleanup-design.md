# Backend Cleanup ("Slice 0") — Design

**Date:** 2026-11-10
**Scope:** the whole `backend/` NestJS codebase (all 12 modules + `common/`)
**Standard:** `docs/coding-principles.md` (the team's coding rule set, committed as part of this work)

## 1. Why

Bagicha is about to get a new React frontend (Slice 1), built around one loop:
*my plants → what to do this week → log what happened → learn for next season.*
That frontend will be written directly against these endpoints and response
shapes, so the backend needs to be safe and well structured **before** the
React work starts, not after.

An audit found:

- **Three security holes.** (1) Any signed-in user can read or write another
  user's plant through `diagnosis/finalize`, `vision/diagnose` and
  `community/ask-ai`, because those paths look up a plant by ID with no owner
  check. (2) `GET media/download-url/*` signs a URL for *any* key, so any
  signed-in user can fetch another user's private `vision/` and `journal/`
  photos (keys are `{prefix}/{ownerId}/{uuid}.jpg`). (3) The Razorpay webhook is
  unverified, so anyone can grant themselves premium. (The vision routes *do*
  have an auth guard, but no rate limit, so the Gemini bill is exposed to any
  signed-in account.)
- **SOLID violations.** `plant-ledger.service.ts` is 1,221 lines with at least
  six jobs. Domain rules are duplicated across modules, and the copies already
  disagree: the cycle-year logic uses UTC in the ledger and local time in
  diagnosis. Four modules write the plant and task tables. Callers are tightly
  coupled to a concrete `GeminiService`.
- **A large gap against the coding principles:** no repository layer, no error
  hierarchy with reason codes, `console.log` in 11 places, no tracing, no
  metrics, no rate limiting, no audit trail, no health endpoint or graceful
  shutdown, unpaginated lists, constructors that do I/O, and modules that
  import each other's internal files.

## 2. Goals

1. Every rule in `docs/coding-principles.md` is satisfied across the whole
   backend, or the exception is written down in §7 of this document with a reason.
2. The three security holes are closed.
3. Each domain rule has exactly one owner (cycle year, task creation, task
   type mapping, species-specific config, paid status).
4. Behaviour of the slice-one loop endpoints is preserved, apart from the
   deliberate fixes listed here. A gardener's data and flows still work.

## 3. Non-goals

- New product features. Nothing user-visible is added except safer behaviour.
- Making the mocked parts real: Razorpay order creation, OTP and the
  marketplace stay mocked. Only their *structure* and *security* get fixed.
- Building the React frontend (that's Slice 1, with its own design).
- Keeping the shelved Android app working. It is on hold, and nothing ships
  against this API yet, so **API breaking changes are allowed** where the rules
  require them. Every breaking change must be listed in the final summary so
  Slice 1 is built against the new shapes.

## 4. Anti-goals (a failure even if it technically works)

- A rewrite that changes what the loop endpoints *mean*, for example different
  task generation, different seasonal advice or different mitigation output,
  without saying so. Logic moves; it does not silently change.
- Abstractions with one caller "for the future" (principles §7). The AI-provider
  interface is justified because two callers use it (vision and community) and
  tests need a stub. Don't add interfaces beyond what the rules require.
- Ripping out Kathawachak.
- Leaving any `MUST` silently unmet. If one can't be met, stop and record it.

## 5. Constraints

- Stack stays as is: NestJS, Prisma, PostgreSQL, Redis, BullMQ, MinIO and Gemini,
  running through `backend/docker-compose.yml`.
- **Kathawachak (`common/monitor`) stays and runs alongside** the new pino
  logging and OpenTelemetry tracing. Neither replaces the other. *(User decision.)*
- Prisma migrations are fine. This is a dev database, but migrations must keep
  existing rows (no data-dropping resets).
- Secrets come only from env/config. Nothing is committed.
- Verify current dependency versions live, preferring the longer-proven major
  version (principles §7).

## 6. Decisions

### Decided by the user
- Clean up the **whole codebase**, not just the slice-one modules.
- Held to **`docs/coding-principles.md`** in full.
- **Keep Kathawachak**, running alongside pino and OTel.
- This happens **before** the React frontend.

### Decided by Claude (recorded as my calls; the user can override)

**Adapting the rule set to Bagicha.** The rules were written for a multi-tenant
codebase. Bagicha has no tenants.
- "Tenant-scoped" means **user-owned**. Plants, journal entries, plant cycles,
  tasks, diagnosis sessions and personalized overlays belong to a user, directly
  or through a plant. Every query for them goes through a **user-scoped
  repository** that always filters by the owner. No service queries those tables
  with Prisma directly, and nothing can bypass the owner filter.
  Ownership failures return **404 (not found)**, not 403, so plant IDs can't be
  probed. Lookups fail closed: if ownership is ambiguous, access is denied.
- Log/trace context uses `userId` (and `traceId`) where the rules say `tenantId`.
- The cited ADRs and `@optimiser/*` packages don't exist here. Build small local
  equivalents in `src/common/`: an error base class with reason codes, a
  `withSpan()` helper, a meter helper, a clock provider and a rate-limit setup.

**Structure**
- Every module exposes an `index.ts` barrel, and siblings import only from it.
  The module graph must stay acyclic. Concretely, `plant-ledger` becomes the sole
  owner of plants, journal, cycles and tasks. `seasonal`, `diagnosis`, `vision`
  and `community` call ledger services through its barrel instead of writing those
  tables themselves.
- `plant-ledger.service.ts` is split by reason to change. The builder chooses the
  exact seams, but at minimum: plant CRUD, journal and milestones, cycles,
  tasks, and the mitigation/"learn for next season" engine.
- The **cycle-year rule** lives in one place and uses one timezone. **IST
  (Asia/Kolkata)**, because a cycle boundary is a gardener's calendar month in
  India, not a server's. **All month-based rules switch to IST together:** cycle
  year, season window (`resolveSeasonWindow`), seasonal intelligence and the
  weather service. This is a deliberate, stated change in meaning. The only
  effect is that advice flips at IST midnight on the 1st instead of server
  midnight (5.5 hours apart).
  **Existing `PlantCycle` rows are not recalculated.** Only new events use IST.
  Recalculating could move boundary events between cycles and force cycle
  merges, which isn't worth the risk on dev data.
- The **task type/category/priority mapping** lives in one place, and task creation goes through one ledger service.
- **Species-specific values** (cycle start months, etc.) move out of `switch`
  statements into data, either the existing `PlantCatalogEntry` or a single
  config map. The builder chooses which, so adding a species is a data change.
- An **AI provider interface** sits in front of Gemini. The model name comes from
  config (`GEMINI_MODEL`), with no hard-coded model and no `'MOCK_KEY'` fallback.
  A missing key fails clearly at call time instead of making fake calls.
  Malformed AI output raises a typed operational error. It is never saved as a
  real diagnosis.
- **Paid status** gets its own fields on `User` (a subscription tier plus a
  nullable expiry), separate from `badge_level`, which goes back to being only
  the gamification rank. Defaults to free (principles §5: off until granted).
  - Existing `badge_level = 'Rooted'` users → premium with **no expiry**
    (null = lifetime), so nobody loses access. Their `badge_level` is reset to
    `Seedling`, because no code ever awarded `Rooted` as a rank (only the
    webhook set it).
  - New purchases: the mocked `create-order` writes `plan_id` into the order
    `notes` alongside `user_id`. The webhook reads it and sets expiry to
    +30 days for `PREMIUM_MONTHLY` or +365 days for the yearly plan. Don't add
    an orders table; that comes when Razorpay becomes real.
  - "Is premium" is decided at read time (tier = premium and expiry is null
    or in the future, using the injected clock), in one place that seasonal and
    other callers use.

**API & errors**
- One error hierarchy. Every error carries a machine-readable `reason`
  (e.g. `PLANT_NOT_FOUND`, `VALIDATION_FAILED`, `AI_RESPONSE_INVALID`,
  `RATE_LIMITED`) and is classed as operational (logged at `warn`) or
  programmer (logged at `error`). The global filter puts `reason` into the
  existing error envelope.
- Remove the double-wrapping in `diagnosis.controller`. Every response goes
  through the one global envelope.
- Auth guard **plus** permission guard on every route that needs authorization.
  For Bagicha, the "permission" is mostly ownership, enforced by the scoped
  repositories, plus an expert/premium check where a route needs one. Permission
  logic stays out of controllers.
- `vision/*` keeps its existing auth guard, adds the ownership check through
  the scoped repository, and gets rate-limited.
- `plants/search` and `plants/resolve` (the public catalogue) stay unauthenticated
  but get rate-limited. That's a deliberate exception: onboarding uses them
  before or around sign-in.
- Any bulk operation (e.g. `materialize-tasks`) reports per-item outcomes
  (created, skipped or failed for each task).

**Security**
- **Media access:** private prefixes (`vision/`, `journal/`) are **owner-only**.
  `download-url` checks that the key's owner segment matches the caller, and
  returns 404 otherwise. Nothing today shares private images with other users
  (experts, community posts), so the rule fails closed. A future sharing flow
  must grant access explicitly. Any non-private prefixes keep their current
  behaviour.
- Razorpay webhook: verify the HMAC signature with `RAZORPAY_WEBHOOK_SECRET`.
  **Fail closed**: a missing secret or bad signature is rejected. Validate the
  payload with a DTO.
- Rate limits on: OTP request and verify, every AI call (vision identify and
  diagnose, community ask-ai, diagnosis), media upload, and the public plant
  catalogue. Use Redis-backed limiting, since Redis already exists. The builder
  picks the limits but must write them down.
- **Audit trail:** a new audit table (append-only). Write an entry, with a
  snapshot of the affected data, at the moment of: sign-in (OTP verified), paid
  status change, a community report being filed, and any plant deletion if
  deletion exists. The builder may add more security-relevant mutations, but not fewer.

**Observability**
- pino structured logging (via a Nest integration) with fixed fields:
  `timestamp, level, service, version, env, message, traceId, spanId`, plus
  `userId` where known. No `console.*` anywhere.
- OpenTelemetry auto-instrumentation using the two-file `instrumentation.ts` /
  `main.ts` split. Export over OTLP to a configurable endpoint, and turn
  exporting off cleanly when no endpoint is set (local dev).
- `withSpan()` around every external or expensive call: Gemini, MinIO, the
  weather API, and Razorpay once it's real.
- Business metrics through one meter helper, at minimum: AI calls (by
  feature/outcome), diagnoses recorded, tasks created (by source), task
  completions, BullMQ queue depth, and rate-limit rejections.

**Testability**
- A constructor never does I/O. Gemini, Redis and MinIO clients connect in
  lifecycle hooks or on first use.
- A **clock** is injected wherever business logic reads the current time (cycle
  year, season window, task due dates, follow-up dates). No bare `new Date()` /
  `Date.now()` in rules. IDs come from the database or an injected generator.
- **Tests (my call on how many):** the rules don't require spec files, but this
  work does add them where they prove a fix or protect moved logic:
  1. ownership: user B cannot read or write user A's plant through any path
     (diagnosis, vision, community, ledger), and gets a 404 every time;
  2. webhook: bad or missing signature is rejected, valid signature upgrades;
  3. unit tests for each extracted pure rule: cycle year (including IST month
     boundaries), task mapping, mitigation engine, species config;
  4. the AI provider stubbed, so vision and diagnosis can be tested without Gemini.
  Replace the existing "should be defined" stubs or delete them.
  **Where the tests run:** unit tests (`npm test`) need no services and use
  stubs. The ownership and webhook tests are **e2e tests against a real
  Postgres and Redis** from `backend/docker-compose.yml` (`npm run test:e2e`:
  migrate, seed two users, supertest), because only a real database proves the
  owner filter in the queries. Include media `download-url` in the ownership
  e2e suite.

**Running the service**
- `/health` endpoint (database + Redis checks) and graceful shutdown (Nest
  shutdown hooks, closing Prisma, Redis, BullMQ and MinIO cleanly).
- Every list endpoint paginates by default with a capped page size: plants,
  timeline, cycles, tasks (per plant and per user), community feed, chat inbox
  and messages, and the catalogue search.
- Indexes: add the ones the new query shapes need. Known gap: **`Plant.user_id`
  has no index**, but every user-scoped query filters on it.
- BullMQ consumers (`task.processor`, `weather.processor`) are idempotent and
  check whether their step already ran before running it again.

## 7. Documented exceptions to the rule set

- **Optimistic concurrency (§6):** the rule covers resources *multiple humans*
  edit at once. Every plant, journal entry and task in Bagicha has exactly one
  owner, and posts and comments are edited only by their author, so no resource
  qualifies today. Not applied. Revisit if shared gardens or co-owners arrive.
- **Public catalogue routes:** unauthenticated by design (see §6, API). They're
  rate-limited to make up for it.
- **Mocked integrations** (Razorpay order creation, OTP, marketplace) keep their
  mocks. They get correct structure, validation and verification, but no real
  provider calls.

## 8. Left to the builder

- Exact service seams inside `plant-ledger`, and file layout within each module.
- Whether species config lives in `PlantCatalogEntry` or a config map.
- Library choices for pino/Nest, OTel, rate limiting and health checks.
  Verify versions live and prefer proven majors.
- Concrete rate-limit numbers, metric names and the full `reason` code list.
- The order the work is done in. One constraint: the **security fixes must land
  first**, as their own commits.

## 9. Done means

- `npm run build`, `npm run lint`, `npm test` and `npm run test:e2e` (with
  docker-compose services up) pass in `backend/`.
- Every item in the principles §8 checklist has been checked against the whole
  backend, and any "no" is either fixed or listed in §7.
- `grep` finds no `console.` calls, no Prisma calls to user-owned tables outside
  repositories, and no imports of a sibling module's internal files.
- A short summary lists every **breaking API change**, for Slice 1.
- `docs/coding-principles.md` is committed.
