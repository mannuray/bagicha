# Catalogue in the database — stage 1 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vegetables, seasonal flowers, planting methods and care-step wording are read from Postgres instead of code, filled by a push from repo seed files, with no user-visible change.

**Architecture:** A new `catalogue` module owns the types, the seed files, the tables, a repository, a push service (CLI) and a `CatalogueStore` that serves an in-memory `Catalogue` snapshot, re-checking a version row at most once a minute. `plant-ledger`, `crops` and `seasonal` get crops, methods and care steps from the store instead of `CROPS`/`cropById`/`MATERIAL`/`CARE_TITLES`. The web reads method and care-step texts from the API.

**Tech Stack:** NestJS 11, Prisma 6 (Neon Postgres), zod 4 (new backend dependency, same major as the web), nestjs-pino, OpenTelemetry metrics, React/Vite/zod on the web.

**Spec:** `docs/superpowers/specs/2026-11-14-catalogue-in-database-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md`; review against its §8 checklist.
- Users see no change in dates, reminders or texts (spec anti-goal 1). Existing e2e and web tests pass unchanged except where a test names a removed constant.
- Status values `DRAFT`, `APPROVED`, `RETIRED`; the column defaults to `DRAFT` (off until granted).
- Lists, search and the calendar show only `APPROVED`; lookups by id find `APPROVED` and `RETIRED`; `DRAFT` is found by nothing.
- The push never deletes, never retires automatically, and stops with nothing changed if the database holds a key the seed lacks.
- The API reloads after a push within about a minute, with no restart; it refuses to start if the catalogue can't be read or has no approved crops.
- Journey shapes known to code: `NURSERY`, `DIRECT`, `PLANT`.
- No `console.log`; structured logs via nestjs-pino; one metric for catalogue loads.
- Old constants (`RAW`, `DETAILS`, flower `RAW`) stay until stage 1 is live, then go in Task 8.
- Work on branch `catalogue-db`; the owner pushes and runs migration + catalogue push.

## Review Focus

1. A seed that drops a crop the database has → push fails with `CATALOGUE_MISSING_FROM_SEED`, database unchanged (Task 4 test).
2. A crop marked `RETIRED` → gone from the calendar, but a user's existing plant still gets its journey and reminders (Task 3 + Task 5 tests).
3. A crop naming a method or care step that doesn't exist → push rejects it before writing (Task 4 test).
4. Running the push twice → second run reports every item `unchanged` and doesn't bump the version (Task 4 test).
5. A method key the web has never seen (e.g. `CORM`) in the calendar response → the web still renders the list (Task 6 test).

---

### Task 1: Catalogue types, schemas, seed files and the parity test

**Files:**
- Create: `backend/src/modules/catalogue/domain/types.ts`, `backend/src/modules/catalogue/domain/schemas.ts`, `backend/src/modules/catalogue/domain/catalogue.ts`
- Create: `backend/src/modules/catalogue/seed/crops.seed.ts`, `methods.seed.ts`, `care-steps.seed.ts`, `index.ts`
- Create: `backend/src/modules/catalogue/index.ts`
- Test: `backend/src/modules/catalogue/domain/parity.spec.ts`, `backend/src/modules/catalogue/domain/catalogue.spec.ts`
- Modify: `backend/package.json` (add `zod@^4`)

**Interfaces:**
- Produces (`domain/types.ts`): `ClimateGroup`, `Journey = 'NURSERY' | 'DIRECT' | 'PLANT'`, `CatalogueStatus = 'DRAFT' | 'APPROVED' | 'RETIRED'`, `CareStep` (unchanged shape), `CropInfo` (today's shape, but `method: string`, `family: string`), `PlantingMethod { key; journey: Journey; material: string | null; label: string; short: string; material_title: string | null; material_body: string | null }`, `CareStepInfo { key; title: string /* "Stake the {name} plants" */; label_title: string; label_body: string }`, `CropSeed` = `CropInfo` minus derived `quick` tag plus `{ status: CatalogueStatus; notes: string | null }`, `MethodSeed = PlantingMethod & { status }`, `CareStepSeed = CareStepInfo & { status }`, `CatalogueSeed { crops: CropSeed[]; methods: MethodSeed[]; careSteps: CareStepSeed[] }`.
- Produces (`domain/schemas.ts`): `cropSeedSchema`, `methodSeedSchema`, `careStepSeedSchema` (zod, `.strict()`), `validateSeed(seed: unknown): CatalogueSeed` throwing `ValidationError('CATALOGUE_INVALID', …, { issues })`, which also checks that every crop's `method` and `care[].key` exist in the seed.
- Produces (`domain/catalogue.ts`): `class Catalogue` built by `Catalogue.from(seed: CatalogueSeed, version: number)`; `crop(id: string | null | undefined): CropInfo | null` (APPROVED or RETIRED), `listedCrops(): CropInfo[]` (APPROVED, seed order), `method(key: string): PlantingMethod` (throws a programmer error for an unknown key), `careStep(key: string): CareStepInfo | null`, `readonly version: number`. Adds the `quick` tag when `days_to_first_harvest[0] < 45` for `kind: 'CROP'` (today's rule).
- Produces (`seed/index.ts`): `CATALOGUE_SEED: CatalogueSeed`.

- [ ] **Step 1: Write the failing parity test** `parity.spec.ts`: `Catalogue.from(validateSeed(CATALOGUE_SEED), 1).listedCrops()` deep-equals today's `CROPS` (import from `plant-ledger/domain/crop-calendar`), in order, field by field; every method key used by a crop exists; `method('TUBER').material === 'seed potatoes'`, `method('CLOVE').material === 'garlic cloves'`, `method('RHIZOME').material === 'healthy rhizomes'`, `method('NURSERY_TRANSPLANT').journey === 'NURSERY'`, `method('DIRECT_SOW').journey === 'DIRECT'`, the other three `'PLANT'`; for every key in today's `CARE_TITLES`, `careStep(key).title.replace('{name}', 'tomato')` equals `CARE_TITLES[key]('tomato')`; each care step's `label_title`/`label_body` equal `web/src/locales/en.json` `crops.steps.<key>`; each method's `label`, `short`, `material_title`, `material_body` equal `crops.method.<key>`, `crops.methodShort.<key>`, `crops.steps.material.<key>`.
- [ ] **Step 2: Write `catalogue.spec.ts`**: a RETIRED crop is found by `crop(id)` but not in `listedCrops()`; a DRAFT crop is in neither; `validateSeed` rejects a crop whose method is missing, a crop with a care key missing, and an unknown field (each `CATALOGUE_INVALID`).
- [ ] **Step 3: Run** `cd backend && npx jest src/modules/catalogue` — Expected: FAIL (modules missing).
- [ ] **Step 4: Generate the seed files** from today's constants with a one-off script in the scratchpad (not committed): crops in `CROPS` order with `status: 'APPROVED'`, raw `tags` (without the derived `quick`), and `notes` = the `//` comments inside each crop's block in `crop-calendar.ts` / `flower-calendar.ts`, joined with `\n` (null if none). Methods and care steps from `MATERIAL`, `CARE_TITLES` and the `en.json` strings above. Format with prettier. Then write `types.ts`, `schemas.ts`, `catalogue.ts`, `seed/index.ts`, and `catalogue/index.ts` exporting the types, `Catalogue`, `validateSeed`, `CATALOGUE_SEED`.
- [ ] **Step 5: Run** `npx jest src/modules/catalogue` — Expected: PASS.
- [ ] **Step 6: Commit** `feat(catalogue): types, schemas and seed for crops, methods and care steps`.

### Task 2: Tables and the repository

**Files:**
- Modify: `backend/prisma/schema.prisma`; Create: `backend/prisma/migrations/20261114120000_catalogue_crops/migration.sql`
- Create: `backend/src/modules/catalogue/catalogue.repository.ts`
- Test: `backend/test/e2e/catalogue-repository.e2e-spec.ts`

**Interfaces:**
- Consumes: `CropSeed`, `MethodSeed`, `CareStepSeed`, `CatalogueSeed` (Task 1).
- Produces: Prisma enums `CatalogueStatus { DRAFT APPROVED RETIRED }`, `CropKind { CROP FLOWER }`, `Journey { NURSERY DIRECT PLANT }`; models `CatalogueCrop` (`catalogue_crops`: `id` text pk, `kind`, `name`, `family`, `method` text, `status` default `DRAFT`, `sort_order` int, `data` jsonb = every other `CropSeed` field, `notes` text?, `created_at`, `updated_at`; `@@index([status, kind])`), `CatalogueMethod` (`catalogue_methods`: `key` pk, `journey`, `status`, `data` jsonb = texts, timestamps), `CatalogueCareStep` (`catalogue_care_steps`: `key` pk, `status`, `data` jsonb, timestamps), `CatalogueMeta` (`catalogue_meta`: `id` int pk default 1, `version` int default 0; the migration inserts the row).
- Produces (`CatalogueRepository`, injects `PrismaService`): `version(): Promise<number>`; `loadSeed(statuses: CatalogueStatus[]): Promise<CatalogueSeed>` (rows → seed records, crops ordered by `sort_order`); `applyPush(changes: { crops: CropSeed[]; methods: MethodSeed[]; careSteps: CareStepSeed[] }): Promise<number>` — upserts the given records and increments the version in one transaction, returns the new version (writes `sort_order` from each crop's index in the full seed, passed on the record).

- [ ] **Step 1: Write the failing e2e test**: on an empty test database (truncate the four tables first), `version()` is 0; `applyPush` with two crops, one method, one care step returns 1; `loadSeed(['APPROVED','RETIRED'])` returns them deep-equal to what was written, crops in `sort_order`; a second `applyPush` with one changed crop returns 2 and only that crop changed; `loadSeed(['APPROVED'])` omits a RETIRED crop.
- [ ] **Step 2: Run** `npx jest -c test/jest-e2e.json catalogue-repository` — Expected: FAIL.
- [ ] **Step 3: Add the models and migration** (`npx prisma migrate dev --name catalogue_crops --create-only`, check the SQL, add `INSERT INTO catalogue_meta (id, version) VALUES (1, 0);`), then implement the repository.
- [ ] **Step 4: Run** the e2e test — Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): tables and repository`.

### Task 3: The store

**Files:**
- Create: `backend/src/modules/catalogue/catalogue.store.ts`, `backend/src/modules/catalogue/catalogue.module.ts`
- Modify: `backend/src/common/observability/metrics.ts` (add `catalogueLoaded(version: number, crops: number)` counter `bagicha.catalogue.loads`), `backend/src/app.module.ts`, `backend/src/modules/catalogue/index.ts`
- Test: `backend/src/modules/catalogue/catalogue.store.spec.ts`

**Interfaces:**
- Consumes: `CatalogueRepository.version()`, `.loadSeed()` (Task 2); `Catalogue.from` (Task 1); `Clock` (`common/time`); `Metrics`; `PinoLogger`.
- Produces: `CatalogueStore` (`@Injectable`, `OnApplicationBootstrap`): `snapshot(): Promise<Catalogue>` — loads on first call; afterwards, when 60 s have passed since the last check (by `Clock`), reads `version()` and reloads `loadSeed(['APPROVED','RETIRED'])` only if it changed. Throws `CatalogueUnavailableError` (new programmer-kind `AppError`, reason `CATALOGUE_EMPTY`) when no crop is APPROVED. `onApplicationBootstrap()` awaits `snapshot()` so a failure stops the app starting. Logs `{ version, crops }` on each load; calls `metrics.catalogueLoaded`. `CatalogueModule` provides and exports `CatalogueStore`, imports `PrismaModule`; `index.ts` exports `CatalogueModule`, `CatalogueStore`.

- [ ] **Step 1: Write the failing unit test** with a stub repository and a fake clock: first `snapshot()` loads once; a second call within 60 s doesn't call `version()`; after 61 s with the same version, no reload; after a version bump, the new crop appears; zero approved crops → rejects with reason `CATALOGUE_EMPTY`; a repository error rejects (no empty catalogue served).
- [ ] **Step 2: Run** `npx jest src/modules/catalogue/catalogue.store.spec.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** the store, module, error and metric; register `CatalogueModule` in `AppModule`.
- [ ] **Step 4: Run** it — Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): in-memory store with version check`.

### Task 4: The push (service, CLI, Docker target, e2e setup)

**Files:**
- Create: `backend/src/modules/catalogue/push/catalogue-push.service.ts`, `push/catalogue-push.module.ts`, `push/push.main.ts`
- Modify: `backend/Dockerfile` (target `catalogue-push`: `FROM build AS catalogue-push`, `CMD ["node", "dist/modules/catalogue/push/push.main.js"]`), `backend/test/e2e/global-setup.ts` (push `CATALOGUE_SEED` after migrating), `backend/package.json` (script `catalogue:push`: `ts-node src/modules/catalogue/push/push.main.ts`)
- Test: `backend/test/e2e/catalogue-push.e2e-spec.ts`

**Interfaces:**
- Consumes: `validateSeed`, `CATALOGUE_SEED` (Task 1), `CatalogueRepository` (Task 2).
- Produces: `CataloguePushService.push(seed: unknown): Promise<PushReport>` where `PushReport = { version: number; crops: ItemOutcome[]; methods: ItemOutcome[]; careSteps: ItemOutcome[] }`, `ItemOutcome = { key: string; outcome: 'added' | 'changed' | 'unchanged' }`. Validates first; loads every stored key (all statuses); if any stored key is missing from the seed, throws `ValidationError('CATALOGUE_MISSING_FROM_SEED', 'The seed is missing records the database has', { crops, methods, careSteps })` and writes nothing; calls `applyPush` only with added or changed records, and not at all when nothing changed (version unchanged). `push.main.ts` boots `CataloguePushModule` (Prisma + logging) with `NestFactory.createApplicationContext`, pushes `CATALOGUE_SEED`, logs the report counts and changed keys, exits 1 on error.

- [ ] **Step 1: Write the failing e2e test**: on emptied catalogue tables, first push reports every record `added` and version 1; a second push of the same seed reports all `unchanged` and version still 1; a seed with one crop's `harvest_span_days` changed reports that crop `changed` only, version 2; a seed missing one stored crop rejects with `CATALOGUE_MISSING_FROM_SEED` and `version()` is unchanged; a crop whose method isn't in the seed rejects with `CATALOGUE_INVALID` before writing; a crop set to `RETIRED` in the seed is stored RETIRED. Restore the real seed after (push `CATALOGUE_SEED`).
- [ ] **Step 2: Run** `npx jest -c test/jest-e2e.json catalogue-push` — Expected: FAIL.
- [ ] **Step 3: Implement** the service, module, CLI, Docker target, script, and the global-setup push (construct the service with a repository over a plain `PrismaService`-compatible client; the e2e app then boots with a filled catalogue).
- [ ] **Step 4: Run** the test, then the whole e2e suite — Expected: PASS, 207+ tests.
- [ ] **Step 5: Commit** `feat(catalogue): push from seed files`.

### Task 5: Backend reads from the store

**Files:**
- Modify: `backend/src/modules/plant-ledger/services/crop-plan.service.ts` (drop `MATERIAL`; `method.material`, `method.journey === 'NURSERY'`), `crop-journey.service.ts` (drop `CARE_TITLES`; `careStep(key)?.title.replace('{name}', titleName(crop)) ?? key`; nursery by journey), `plant-ledger/domain/crop-calendar.ts` (`sproutCheckTitle(crop, journey, nursery)`; window functions import types from `catalogue`), `plant-ledger/plant-ledger.module.ts`, `plant-ledger/index.ts` (stop exporting `CROPS`, `cropById`), `crops/crops.service.ts`, `crops/crops.module.ts`, `seasonal/seasonal.service.ts`, `seasonal/seasonal.module.ts`; their unit specs build a `Catalogue` from `CATALOGUE_SEED`.
- Test: `backend/test/e2e/crops.e2e-spec.ts` (new assertions), existing suites unchanged.

**Interfaces:**
- Consumes: `CatalogueStore.snapshot()` (Task 3); `Catalogue` methods (Task 1).
- Produces (API, field by field in `CropsService.item`/`detail`): calendar items add `journey`, `method_label`, `method_short`; detail adds `material: { title, body } | null` and each `care[]` entry gains `title`, `body` (the care step's `label_title`, `label_body`).

- [ ] **Step 1: Write the failing e2e assertions**: calendar item for `potato` has `journey: 'PLANT'`, `method_label: 'Plant seed potatoes'`, `method_short: 'tubers'`; detail for `tomato` has `care[0]` with `title`/`body` from the stake step and `material: null`; detail for `garlic` has `material.title === 'Cloves'`; after setting `carrot` RETIRED via the push service, it's absent from `/crops/calendar` but an existing carrot plant's journey still creates its sprout-check task on a SOWING log (push the real seed back after).
- [ ] **Step 2: Run** `npx jest -c test/jest-e2e.json crops` — Expected: FAIL on the new assertions.
- [ ] **Step 3: Switch** every consumer listed above to `await this.catalogue.snapshot()`; update their unit specs.
- [ ] **Step 4: Run** `npx jest` and `npx jest -c test/jest-e2e.json`, then `npm run lint` — Expected: all PASS; every task title unchanged (existing assertions).
- [ ] **Step 5: Commit** `feat(catalogue): crops, journeys and calendar read from the catalogue`.

### Task 6: Web reads method and step texts from the API

**Files:**
- Modify: `web/src/features/crops/schemas.ts` (`method: z.string()`, add `journey: z.enum(['NURSERY','DIRECT','PLANT'])`, `method_label`, `method_short`; detail `material`, care `title`/`body`), `names.ts` (`growingSteps` by `journey`; returns step descriptors with API texts for care and material), `CropDetailScreen.tsx`, `CropsScreen.tsx`, `useStartCrop.ts`, `useCropJourney.ts`, `test-fixtures.ts`, `web/src/locales/en.json` (remove `crops.method`, `crops.methodShort`, `crops.steps.material`, and the care-step keys `stake`, `trellis`, `support`, `earth_up`, `pinch`, `deadhead`).
- Test: `web/src/features/crops/*.test.tsx`

**Interfaces:**
- Consumes: the API fields from Task 5.

- [ ] **Step 1: Write the failing tests**: a calendar item with `method: 'CORM'`, `journey: 'PLANT'`, `method_short: 'corms'` renders in the list with "corms"; the detail page shows the care step title and body from the API (e.g. `{ key: 'lift', title: 'Lift', body: 'Dig the corms…' }`) and the material title from the API.
- [ ] **Step 2: Run** `cd web && npx vitest run src/features/crops` — Expected: FAIL.
- [ ] **Step 3: Implement**; update fixtures to carry the new fields.
- [ ] **Step 4: Run** `npx vitest run` and `npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(crops): method and step texts come from the catalogue`.

### Task 7: Docs and the playbook

**Files:**
- Modify: `docs/deploy.md` (catalogue push: build `--target catalogue-push`, run like the migration; order migration → push → deploy), `.claude/skills/add-plant/checklist-crop.md` and `checklist-seasonal-flower.md` (edit the seed file, then push; new method or care step = a row in `methods.seed.ts`/`care-steps.seed.ts`), `docs/data-polish-roadmap.md` (note the catalogue move).

- [ ] **Step 1: Write the docs.**
- [ ] **Step 2: Commit** `docs(catalogue): push step and playbook`.

### Task 8 (after stage 1 is live): remove the old constants

**Files:**
- Modify: `backend/src/modules/plant-ledger/domain/crop-calendar.ts` (delete `RAW`, `DETAILS`, `VEGETABLES`, `CROPS`, `cropById`, `GOURD_WINDOWS`, `GREENS_WINDOWS`; keep window logic, `climateGroupFor`, `inGroup`, `titleName`, `sproutCheckTitle`), delete `flower-calendar.ts`; move the value-pinning tests in `crop-calendar.spec.ts` to read `CATALOGUE_SEED`; delete `parity.spec.ts`.

- [ ] **Step 1: Move the pinning tests to the seed**, run them — Expected: PASS.
- [ ] **Step 2: Delete the constants and the parity test**; run `npx jest`, e2e, lint — Expected: PASS.
- [ ] **Step 3: Commit** `refactor(catalogue): drop the code copies of the crop calendar`.
