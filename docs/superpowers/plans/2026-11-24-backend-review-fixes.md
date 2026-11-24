# Backend Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every finding of the 2026-11-24 backend review except the four "before real users" items, without breaking the live web app between deploys.

**Architecture:** Five releases in deploy order. R1 is backend-only with no contract change (refactors, hardening). R2 adds API (new routes beside old ones, idempotency, conversations table, tighter DTOs). R3 switches the web. R4 removes old routes after R3 is live. R5 moves data into the catalogue (cycle-start month, advice text, districts). Owner content gates sit inside R5.

**Tech Stack:** NestJS 11, Prisma 6 (Neon), zod 4, class-validator, Jest unit + e2e; React web (Vitest + MSW).

**Spec:** The review findings in the conversation of 2026-11-24 (three reviewers: data-in-code; SOLID/errors/logging; security/scaling/API). No separate spec doc; this plan's Global Constraints carry the binding rules.

## Global Constraints

- `docs/coding-principles.md` §8 checklist applies to every task.
- **Out of scope; do not touch even when nearby:** the SMS provider; OTP compare/race/counter/expiry (`auth.service.ts verifyOtp`, `redis.service.ts incrWithTtl`); `WeatherService`, `seasonal/weather`, the weather queue/processor and the cached weather response; `marketplace` routes; queue failed-job hooks (`queue-defaults.ts`, `@OnWorkerEvent`).
- Behaviour-preserving refactors: existing unit and e2e tests stay green unchanged; never edit a test to fit a refactor.
- Old routes keep working until R4. Vercel deploys web on merge; Render deploys API by hand.
- Migrations and catalogue pushes are run only after the owner's go-ahead; order per `docs/deploy.md`.
- Horticultural values and Hindi text: source check + owner's explicit yes before they are written (add-plant playbook).
- Auth bucket stays 5/min per IP until the OTP race (out of scope) is fixed: raising it now widens brute force.

## Review Focus

1. A forged/expired bearer token on an unbucketed route must be limited per IP, never per the token's claimed `sub`. Task 11.
2. Two retries of the same journal POST with one `Idempotency-Key` arrive concurrently: one entry, the second gets the stored response or 409, never a duplicate. Task 13.
3. Inbox after A→B then B→A: one conversation, total 1, newest message shown; a blocked user's conversation is not listed. Task 15.
4. A plant owned by another user on `GET plants/:id/timeline|cycles|tasks|mitigation-plan` still 404s after the ownership check moves out of the controller. Task 3.
5. Mango entry on 2026-11-05 still lands in cycle 2026 after the cycle-start month moves to the catalogue (and January for a family without the field). Task 19.

---

## R1 — backend only, no contract change

### Task 1: Repositories own the transaction writes
**Files:** modify `plant-ledger/repositories/{task,cycle,plant,journal}.repository.ts`, `services/{crop-journey,crop-plan,plant-end}.service.ts`. Tests: the repositories' specs (or new `*.repository.spec.ts` against the e2e DB per existing pattern) + existing service specs.
**Produces (all take optional `tx?: Tx`, use `this.db(tx)`):**
- `TaskRepository.cancelPending(plantId: string, opts: { source?: TaskSource }, tx?): Promise<number>` — replaces crop-journey:329, plant-end:66, and the cancel half of crop-plan:156 (`cancelByIds(ids, tx)`).
- `TaskRepository.pendingForPlant(plantId, source: TaskSource, tx?): Promise<Task[]>`; `completeByIds(ids, at: Date, tx?)`; `cancelByIds(ids, tx?)`; `deleteForPlant(plantId, tx?)`.
- `CycleRepository.openFor(plantId, tx?)`, `lastOfYear(plantId, year, tx?)`, `createSeason(data, tx?)`, `setPlace(cycleId, placeId, tx?)`, `close(cycleId, at, tx?)`, `countFor(plantId, tx?)`.
- `PlantRepository.setCropStage(plantId, stage, tx?)`, `markEnded(plantId, data, tx?)`, `clearEnded(plantId, tx?)`, `findOwnedCrop(userId, plantId, tx?)`, `delete(plantId, tx?)`.
- `JournalRepository.findInPlant(entryId, plantId, tx?)`, `createEntry(data, tx?)`, `deleteForPlant(plantId, tx?)`.
- [ ] Failing spec for `cancelPending` (only PENDING of that source/plant become CANCELLED; returns count).
- [ ] Add methods; replace every `tx.<model>.*` in the three services (grep must return nothing: `grep -n "tx\.\(plant\|plantCycle\|task\|journalEntry\|user\)\." src/modules/plant-ledger/services`).
- [ ] `npx jest src/modules/plant-ledger` + `npm run test:e2e -- crop plant-end` green; commit `refactor(ledger): repositories own transaction writes`.

### Task 2: Region lookup through UserRepository
**Files:** `user/user.repository.ts`, `crop-journey.service.ts:355` (`groupOf`). **Produces:** `UserRepository.findRegion(id, tx?): Promise<{ region_cluster; district } | null>`.
- [ ] Failing spec for `findRegion`; implement; `groupOf` uses it. Commit `refactor(ledger): read the gardener's region via UserRepository`.

### Task 3: Ownership checks live in the services
**Files:** create `plant-ledger/services/plant-access.service.ts`; modify `plant-record.service.ts` (delegate `getOwnedOrThrow`/`assertGrowing`), `journal.service.ts` (`addEntry`, `timeline`), `cycle.service.ts` (`list`), `task.service.ts` (`listForPlant`, `updateStatus`), `mitigation-planner` service (`plan`), `plant-ledger.controller.ts:136-220` (remove the pre-checks).
**Produces:** `PlantAccess.owned(userId, plantId, tx?): Promise<Plant>` (404 `PLANT_NOT_FOUND`), `PlantAccess.growing(userId, plantId, tx?): Promise<Plant>` (409 `PLANT_ENDED`).
- [ ] Failing service specs: each of the six methods throws `PLANT_NOT_FOUND` for another user's plant; `addEntry`/`updateStatus` throw `PLANT_ENDED` on an ended plant.
- [ ] Implement; controller calls the services directly. e2e for ledger routes green (Review Focus 4). Commit `refactor(ledger): services check plant ownership themselves`.

### Task 4: One handler per crop-journey log type
**Files:** `crop-journey.service.ts:114-341`. **Produces:** private `onSowing`, `onTransplanting`, `onHarvest`, `onGermination`, `onThinning`, `onSeasonEnd`, each `(ctx: EntryContext) => Promise<void>`; `afterEntry` dispatches via a `Partial<Record<LogType, handler>>` map. `EntryContext = { tx; userId; plant; crop; catalogue; cycle; log; at; group }`.
- [ ] Existing crop-journey specs + e2e green before and after (no new behaviour). Commit `refactor(ledger): crop journey handlers per log type`.

### Task 5: Split the god services
**Files:** create `seasonal/services/tree-task-materializer.service.ts` (move `materializeTasksForTree` and the flower/anchor/overlay helpers `seasonal.service.ts:168-430`); create `community/services/ask-ai.service.ts` (move `askAi`, `relevantKnowledge`, prompt building `community.service.ts:227-268,320-352`). Controllers call the new services. Weather code stays where it is.
**Produces:** `TreeTaskMaterializer.materialize(userId, plantId, lang?)` (same signature/return as `materializeTasksForTree`); `AskAiService.ask(userId, dto)`.
- [ ] Move specs alongside; existing unit + e2e green unchanged. Constructor deps: SeasonalService ≤ 8, CommunityService ≤ 8. Commit `refactor: split tree-task materialising and ask-ai out of their services`.

### Task 6: Invariant errors and the injected clock
**Files:** `plant-ledger/domain/care/engine.ts:12`, `domain/care/region-care.ts:87-96`, `crops/crops.service.ts:74`, `common/filters/http-exception.filter.ts:89,115`, `bootstrap.ts:36`.
- [ ] Failing specs: `resolveRegionCare` with a dangling `sameAs` throws `InvariantError` with `reason === 'INTERNAL_INVARIANT'` and details `{ family, region }`; same for `verifiedCare`.
- [ ] Replace `new Error` with `InvariantError`; `crops.service` uses `this.clock.now()`; filter takes `Clock` (`new HttpExceptionFilter(logger, app.get(Clock))`). Commit `fix: invariant errors carry a reason; one clock`.

### Task 7: Crop-plan sync in a fixed number of queries
**Files:** `crop-plan.service.ts:99-165`, `plant.repository.ts` (`seasonStartsFor(plantIds): Map<string, Date[]>`), `task.repository.ts` (`pendingForPlants(plantIds, source)`), `task.service.ts` (`createTasks` batch path if needed).
- [ ] Failing spec: `sync` for 5 waiting crops calls `seasonStartsFor` once and `pendingForPlants` once (repository mocks count calls); created count unchanged vs current fixtures.
- [ ] Implement: one season query, one pending query, one `cancelByIds` for all stale reminders, then per-plant `createTasks` (already idempotent via `source_key`). Commit `perf(crop-plan): sync without per-crop queries`.

### Task 8: Untrusted community text is fenced in the ask-ai prompt
**Files:** `community/services/ask-ai.service.ts` (from Task 5).
- [ ] Failing spec: a post whose content says "ignore previous instructions" appears only inside a `<community_snippets>` block, the prompt states that block is untrusted reference text, and post content is capped at 160 chars (as now); the user's own question is inside `<question>`.
- [ ] Implement. Commit `fix(ai): fence community text in the ask-ai prompt`.

### Task 9: Vision images are decoded before the AI sees them
**Files:** `media/index.ts` (export `decodeSafely`), `vision/vision.service.ts:11-16`.
**Produces:** `async toImage(imageBase64: string): Promise<AiImage>` — strips a data-URL prefix, `Buffer.from(b64,'base64')`, `decodeSafely`, returns `{ data: jpeg.toString('base64'), mimeType: 'image/jpeg' }`.
- [ ] Failing specs: non-image base64 → `MEDIA_TYPE_UNSUPPORTED` (422) and the AI provider is not called; a valid PNG reaches the provider as JPEG.
- [ ] Implement. Commit `fix(vision): decode and re-encode photos before the AI call`.

### Task 10: Boundary validation
**Files:** `user/dto/update-profile.dto.ts` (`latitude` `@Min(-90) @Max(90)`, `longitude` `@Min(-180) @Max(180)`), `diagnosis/dto/finalize-diagnosis.dto.ts` (`event_at` `@IsISO8601()`), `diagnosis-pipeline.service.ts:108-114` (remove the in-service check).
- [ ] Failing e2e/DTO specs: lat 91 → 422; bad `event_at` → 422 `VALIDATION_ERROR` at the boundary. Implement. Commit `fix: validate coordinates and diagnosis dates at the boundary`.

### Task 11: Rate limits per verified user; a write bucket
**Files:** `common/rate-limit/user-or-ip.tracker.ts`, `rate-limit.guards.ts`, `rate-limit.module.ts`, `limits.ts`, `chat.controller.ts` (`POST messages`, `blocks`), `community.controller.ts` (`posts`, `comments`, `report`s).
**Produces:** `trackerFor(req, verifiedUserId: string | null): string`; guards resolve `verifiedUserId` = `req.user?.id` ?? `JwtService.verify(bearer, { algorithms: ['HS256'] }).sub` (signature + expiry only, no DB; any failure → null). New bucket `write: { limit: 30, ttl: MINUTE }`.
- [ ] Failing specs: valid token on an unbucketed route → `user:<sub>`; forged/expired token → `ip:<ip>` (Review Focus 1); `write` bucket rejects the 31st post in a minute.
- [ ] Implement; `limits.ts` comment corrected. Commit `fix(rate-limit): limit signed-in callers per user; write bucket`.

### Task 12: Pin the JWT algorithm
**Files:** `auth/auth.module.ts:19` (`signOptions.algorithm: 'HS256'`), `auth/strategies/jwt.strategy.ts` (`algorithms: ['HS256']`).
- [ ] Failing spec: a token signed with `none`/HS512 is rejected; existing tokens still pass. Implement. Commit `fix(auth): pin the JWT algorithm`. (Issuer/audience and refresh tokens: follow-up, not here — verifying new claims would sign everyone out.)

**R1 finish:** full unit + e2e + lint + tsc; final whole-branch review; owner go-ahead → merge → Render deploy (no migration, no push).

---

## R2 — additive API (old clients keep working)

### Task 13: Idempotency-Key on creates
**Files:** create `common/http/idempotency.interceptor.ts` + `idempotent.decorator.ts`; apply to `POST ledger/plants/:id/journal`, `POST diagnosis/...finalize`, `POST vision/diagnose`.
**Behaviour:** header optional; valid = `^[A-Za-z0-9_-]{8,128}$` else 422. Redis key `idem:{userId}:{routePattern}:{key}`: `setIfAbsent(pending, 60s)`; already pending → 409 `IDEMPOTENCY_IN_PROGRESS`; stored → replay the stored body with the original status; success → store body 24h; error → delete key. Redis down → proceed without (warn log, metric), matching the rate-limit fail-open.
- [ ] Failing specs: same key twice sequentially → one row, identical body; concurrent → one 201 + one 409 (Review Focus 2); different user same key → independent; no header → unchanged behaviour.
- [ ] Implement. Commit `feat(api): idempotent creates with Idempotency-Key`.

### Task 14: Consistent routes beside the old ones
- `PATCH user/profile` (old `PUT user/profile/update` stays); `PATCH ledger/plants/:id`; `PATCH ledger/plants/:id/tasks/:taskId`; `GET seasonal/plants/:id/intelligence`; `POST seasonal/plants/:id/materialize-tasks`. Same handlers, same DTOs.
- Community `data.success` stays until R4 (grep `web/src` for `.success` in R3 first).
- [ ] e2e: each new route returns the same body as its old twin. Commit `feat(api): consistent route names alongside the old ones`.

### Task 15: Conversations table for the chat inbox
**Files:** `prisma/schema.prisma` (`model Conversation { id; user_a; user_b; last_message_id; last_at; @@unique([user_a,user_b]); @@index([user_a,last_at]); @@index([user_b,last_at]) }`, `user_a < user_b`), migration `2026112512xxxx_chat_conversations` with backfill SQL from `messages` (latest per unordered pair), `chat/message.repository.ts` (`create` upserts the conversation in the same transaction; `inbox` reads conversations ordered by `last_at desc`, excluding pairs where the user blocked the other, paginated in SQL, `total = count`).
- [ ] Failing specs (Review Focus 3): A→B then B→A → one row, total 1, newest message; blocked user's conversation absent; page 2 correct.
- [ ] Implement; e2e chat green. Commit `fix(chat): one inbox row per conversation, paged in the database`. **Deploy: migration before API.**

### Task 16: Tighter journal and diagnosis DTOs
**Files:** `plant-ledger/dto/add-log.dto.ts`, `diagnosis/dto/finalize-diagnosis.dto.ts`.
- `AddLogDto.type`: `@IsIn(USER_LOGGABLE)` where `USER_LOGGABLE = LogType values minus PLANT_ENDED, DIAGNOSIS` (system-written: plant-end, diagnosis pipeline). `metadata`: `@ValidateNested` `JournalMetadataDto` with the keys the web sends (`photo_key`, `severity` ∈ LOW|MEDIUM|HIGH, `quantity_value` ≥ 0, `quantity_unit` ∈ kg|pieces|crates, `quality` ∈ poor|fair|good|excellent, `place_id`, `step`), whitelist on. Grep `web/src` and `test/` for every metadata key posted before fixing the list.
- Diagnosis `attachments`: `@ArrayMaxSize(10)` of `{ kind: string ≤ 20; source: string ≤ 40 }`; `messages`: `@ArrayMaxSize(50)` of `{ role ∈ user|assistant; content ≤ 2000 }`.
- [ ] Failing e2e: posting `PLANT_ENDED` → 422; unknown metadata key → 422; every web-sent shape still 201. Commit `fix(api): system-only log types and typed JSON bodies`.

**R2 finish:** review; owner go-ahead → Neon migration (Task 15) → merge → Render deploy.

## R3 — web switches (after R2 is live)

### Task 17: Web uses the new routes and sends Idempotency-Key
**Files:** `web/src/features/{user,plants,biography,seasonal,journal,scan}/api.ts`.
- [ ] MSW handlers move to the new routes; journal/diagnose/vision mutations send `Idempotency-Key: crypto.randomUUID()` generated once per user action (kept across the mutation's retries).
- [ ] `cd web && npm test && npm run lint && npx tsc -b`. Commit `feat(web): new API routes and idempotent creates`. Merge → Vercel.

## R4 — remove old routes (after R3 has been live a few days)

### Task 18: Remove the old twins and `data.success`
- [ ] Delete the five old routes and community `success`; e2e updated to the new routes only. Commit `chore(api): remove superseded routes`.

---

## R5 — data into the catalogue

### Task 19: Cycle-start month in the catalogue
**Files:** `catalogue/domain/schemas.ts` (fruit type `cycle_start_month: z.number().int().min(1).max(12).optional()`), `types.ts`, `catalogue.ts` (`cycleStartMonth(family): number`, default 1), `seed/fruit-types.seed.ts` (move mango 11, litchi 11, citrus 7, guava 6, pomegranate 6, banana 1 word for word), `plant-ledger/domain/cycle-year.ts` (`resolveCycleYear(startMonth: number, eventAt: Date)`), `cycle.service.ts:87`; delete `species-config.ts`.
- [ ] Failing specs (Review Focus 5): mango 2026-11-05 → 2026, 2026-10-31 → 2025; papaya (no field) → calendar year; catalogue returns 1 for unknown family.
- [ ] Implement. Commit `feat(catalogue): fruiting-cycle start month per family`. **Deploy: push first (old API ignores the field), then API.** New months for other families are content: add-plant gate, separate batch.

### Task 20: Advice text in a bilingual catalogue kind
**Files:** create `catalogue/domain/advice.ts` + `advice.schema.ts` (`{ key; en; hi? }`, keys unique, `{placeholder}` sets equal across en/hi), `seed/advice.seed.ts` (move the English of `mitigation-planner.ts:27-290`, `cycle-summary.ts:82-163`, `seasonal/domain/overlay-rules.ts:47-73` word for word), Prisma `CatalogueAdvice` + migration, repository/push/store kind; rule code returns keys + params, a `adviceText(key, params, lang)` renders.
- [ ] Failing specs: every key used by the rule code exists in the seed; rendering fills params; Hindi falls back to English; English output identical to today for the existing fixtures.
- [ ] Implement; Hindi drafted afterwards → review doc → **owner's yes** → push. Commit `feat(catalogue): advice text as a bilingual catalogue kind`. Deploy: migrate → push → API.

### Task 21: Districts in the catalogue
**Files:** `catalogue/domain/district.schema.ts`, `seed/districts.seed.ts` (move `regions/domain/districts.ts:46-1109` and `STATE_ALIASES` word for word), Prisma `CatalogueDistrict` + migration, store kind (refuse to boot when empty), `regions/*` (`district-locator`, `district-match`, `link-shapes`, `regions.controller`) read from `catalogue.snapshot()` — matching functions take the district list as a parameter so they stay synchronous and pure.
- [ ] Failing specs: the existing district-match/locator specs pass with the list injected; the store refuses an empty district list; region of every district unchanged (snapshot test of district → cluster).
- [ ] Implement. Commit `feat(catalogue): districts and state aliases from the catalogue`. Deploy: migrate → push → API.
