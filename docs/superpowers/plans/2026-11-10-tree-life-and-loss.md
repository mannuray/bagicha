# Tree Life Profiles and Loss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each species a curated life profile that drives per-species stages and a life line on the tree page, and let gardeners record a tree's end (died / removed / replaced) without losing its history.

**Architecture:**
- **Backend:** profiles are a pure domain module (data in code, keyed by species family) used by `LifecycleService` and exposed on plant detail. Ending a plant is a set of additive Prisma fields plus two endpoints and a read-only guard on writes.
- **Web:** pure formatting functions (life line) plus focused UI pieces in `features/biography` and `features/plants`.

**Tech Stack:** NestJS 11 + Prisma 6 (jest, supertest e2e); React 19 + TanStack Query 5 + zod 4 + Tailwind 4 (Vitest + MSW, Playwright).

**Spec:** `docs/superpowers/specs/2026-11-10-tree-life-and-loss-design.md`. Read §5.1, which overrides the earlier sections where they differ.

## Global Constraints

- Profiles are stored in **months** (`[min, max]`). The web shows months under 24, years otherwise. A missing profile, date or context means no life line, never a guess.
- Automatic stages never go backwards (later of stored and computed). Recorded milestones beat age.
- POT and GROW_BAG plants show no productive or lifespan numbers and no replacement nudge.
- Nothing deletes a tree, entry or task. Ended plants never make tasks, appear on the dashboard, or show in the scan picker.
- Loss copy is calm: no red alarms.
- Migrations are additive. Generate the SQL with `prisma migrate diff` and apply with `prisma migrate deploy`. **Never run a reset or any command Prisma's AI-consent guard blocks; stop and ask instead.**
- All copy goes in `en.json`. TDD every task. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A plant whose species has no family match (e.g. "Rose") should get no `life_profile`, generic stages and no life line. (Task 1 test; Task 5 test.)
2. A 5-year mango already stored as MATURE_BEARING should stay MATURE_BEARING after deploy, with no task queued. (Task 1 test.)
3. Ending a plant twice, or with a future date, or with another user's entry id, should give a clean 409/422 and change nothing. (Task 3 e2e.)
4. A scan that saves a diagnosis to an ended tree is refused; a scan with no plant still works. (Task 3 e2e.)
5. Restoring a tree should bring it back to Growing, the dashboard and the scan picker, without reviving the old cancelled tasks. (Task 3 e2e; Task 6 test.)

---

### Task 1: Backend — life profiles and per-species stages

**Files:**
- Create: `backend/src/modules/plant-ledger/domain/species-life-profiles.ts` and its `.spec.ts`
- Modify: `services/lifecycle.service.ts`, `services/plant-record.service.ts` (`getDetail`, `create`, `update` call sites); the plant detail response type, to add `life_profile`
- Test: `services/lifecycle.service.spec.ts` (create if missing), `test/e2e/ledger.e2e-spec.ts` (`life_profile` present)

**Interfaces:**
- Produces:
  - `interface LifeProfile { first_fruit_months: [number, number]; productive_until_months: [number, number]; lifespan_months: [number, number]; note_key: string | null }`;
  - `lifeProfileFor(family: string | null): LifeProfile | null`, with the 14 families from spec §2.2 converted to months;
  - `LifecycleService.calculateStage(input: { planting_date: Date | null; species: string; species_family?: string | null; first_flowering_at?: Date | null; first_fruit_set_at?: Date | null; first_harvest_at?: Date | null }): LifecycleStage`;
  - `laterStage(a, b): LifecycleStage`;
  - `GET /ledger/plants/:id` returns `life_profile: LifeProfile | null`.
- The note keys are `banana`, `papaya`, `grape`, `coconut` and `moringa`; the others are `null`.

- [ ] **Step 1: Write the failing tests:**
  - **profiles:**
    - `lifeProfileFor('papaya')` → `first_fruit_months [8,12]`, `productive_until_months [24,36]`;
    - `('mango')` → `first_fruit [36,60]`;
    - `('rose')` → `null`;
    - all 14 families exist.
  - **stage** (with the clock fixed at 2026-11-10):
    - papaya planted 10 months ago → FIRST_FLOWERING;
    - papaya 4 years → MATURE_BEARING;
    - papaya 3 months → SAPLING;
    - mango 2 years → JUVENILE;
    - mango 2 years with `first_harvest_at` → FIRST_HARVEST;
    - mango 2 years with `first_flowering_at` → FIRST_FLOWERING;
    - unknown species at 4 years → FIRST_FLOWERING (the old thresholds);
    - no date → SAPLING.
  - **monotonic:** `getDetail` on a mango aged 5.5 years stored as MATURE_BEARING (not manual) keeps MATURE_BEARING, makes no update and queues no task. Use a unit test with a mocked repository and a fake queue, following the existing service spec style.
  - **e2e:** creating "Papaya" gives detail `life_profile.first_fruit_months` `[8,12]`.
- [ ] **Step 2: Run** `cd backend && npx jest lifecycle species-life && npx jest --config test/jest-e2e.json ledger`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Stage thresholds come from spec §2.4, in months: SAPLING under `min/2`; JUVENILE under `min`; FIRST_FLOWERING up to `max`; FIRST_HARVEST up to `max + 12`; then MATURE_BEARING.
  - Milestones raise the floor.
  - Resolve the family with `SpeciesNormalizationService.resolveSpeciesFamily` when `species_family` is null.
  - `getDetail` applies `laterStage(stored, computed)`, and skips both when `ended_at` is set (Task 3 adds the field; guard it with optional chaining until then).
  - `create` and `update` compute fresh: the user is entering data.
- [ ] **Step 4: Run** all backend unit tests and the ledger e2e. Expected: pass. Fix any existing test that encoded the old thresholds for a now-profiled species, and ledger it.
- [ ] **Step 5: Commit** `feat(ledger): species life profiles drive lifecycle stages`.

### Task 2: Backend — catalogue and aliases for new families

**Files:**
- Modify: `backend/src/modules/plants/plants.service.ts` (seed list and seeding), `catalog.repository.ts`, `backend/src/modules/plant-ledger/services/species-normalization.service.ts` (`familyAliases`)
- Test: `backend/test/e2e/catalogue.e2e-spec.ts`, the species-normalization spec

**Interfaces:**
- Produces: catalogue entries for papaya, grape, jackfruit, coconut, sapota, amla, custard_apple and moringa, using the family ids `papaya`, `grape`, `jackfruit`, `coconut`, `sapota`, `amla`, `custard_apple` and `moringa`, with the Hindi aliases from spec §2.3. Seeding finds then updates by `(species_family, species, variety)`, so it also works on a non-empty table.

- [ ] **Step 1: Write the failing tests:**
  - e2e: with the table pre-seeded with only the old mango rows, run seeding, then `GET /plants/search?q=papita` returns Papaya and `?q=chikoo` returns Sapota. Running seeding twice creates no duplicates (count is unchanged).
  - unit: `resolveSpeciesFamily({species:'Drumstick'})` → `'moringa'`; `('Sitaphal')` → `'custard_apple'`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the seeds, aliases and find-then-update seeding.
- [ ] **Step 4: Run** backend unit tests and e2e. Expected: pass.
- [ ] **Step 5: Commit** `feat(catalogue): papaya, grape and six more fruit families`.

### Task 3: Backend — end, restore, replace

**Files:**
- Modify: `backend/prisma/schema.prisma`, plus a new migration in `prisma/migrations/<timestamp>_plant_end_of_life/`
- Create: `dto/end-plant.dto.ts`; the controller methods in `plant-ledger.controller.ts`
- Modify: `plant-record.service.ts`, `plant.repository.ts`, `task.repository.ts`/`task.service.ts` (cancel pending), `journal.service.ts`, `create-plant.dto.ts` (`replaces_id`), `seasonal.service.ts` and `vision.service.ts` (guards), `docs/api-changes-slice0.md`
- Test: `backend/test/e2e/plant-end.e2e-spec.ts` (new)

**Interfaces:**
- Produces:
  - **Prisma:** `PlantEndReason` with `DISEASE_OR_PEST`, `WEATHER`, `WATER`, `OLD_AGE`, `UNKNOWN_CAUSE`, `REMOVED`, `REPLACED`; `TaskStatus` gains `CANCELLED`; `LogType` gains `PLANT_ENDED`.
  - **`Plant` fields:** `ended_at DateTime?`, `end_reason PlantEndReason?`, `end_note String?`, `end_entry_id String?`, and `replaced_by_id String?` (a self-relation, `onDelete: SetNull`).
  - **`POST /ledger/plants/:id/end`** `{ reason, ended_at?, note?, entry_id? }` returns 201 with the plant.
  - **`POST /ledger/plants/:id/restore`** returns 201 with the plant.
  - **`GET /ledger/plants?status=active|ended`** defaults to `active`. `ended` is sorted by `ended_at` desc.
  - **`POST /ledger/plants`** accepts `replaces_id`.
  - **Errors:**
    - `PLANT_ENDED` (409) on any growing write to an ended plant: journal POST, task PUT, materialize-tasks, plant PUT, a vision diagnose with that `plant_id`, and end;
    - `PLANT_NOT_ENDED` (409) on restoring a plant that hasn't ended;
    - `VALIDATION_ERROR` (422) for a future `ended_at`, one before the planting date, or an unknown reason;
    - `NOT_FOUND`-style for an `entry_id` that isn't this plant's, or a `replaces_id` that isn't the user's ended plant, using the existing error classes and codes.

- [ ] **Step 1: Write the failing e2e tests** in `plant-end.e2e-spec.ts`:
  - `ends a plant: fields set, PLANT_ENDED entry, pending tasks cancelled`;
  - `ended plants leave the default list and appear under status=ended`;
  - `refuses growing writes to an ended plant with 409 PLANT_ENDED` (journal, task PUT, materialize, plant PUT);
  - `refuses a diagnosis saved to an ended plant` (vision diagnose with `plant_id`, using the fake AI);
  - `still diagnoses without a plant`;
  - `ending twice is 409; future date and pre-planting date are 422; another plant's entry_id is rejected`;
  - `restore brings it back to active without reviving cancelled tasks, and materialize makes fresh ones`;
  - `restoring an active plant is 409 PLANT_NOT_ENDED`;
  - `creating with replaces_id links the old plant's replaced_by_id; a non-ended or foreign replaces_id is rejected`.
- [ ] **Step 2: Run** `npx jest --config test/jest-e2e.json plant-end`. Expected: FAIL (the routes don't exist).
- [ ] **Step 3: Implement.**
  - **Migration SQL:** `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_URL" --script` (or `--from-schema-datasource`, if no shadow DB is configured). Write it to the new migration folder, then run `npx prisma migrate deploy && npx prisma generate`.
  - **Ending:** use one transaction to set the fields, write the journal entry and cancel the pending tasks.
  - **Guards:** a single `assertGrowing(plant)` helper in `plant-record.service.ts`, used by every growing write.
  - **API changes doc:** add sections for the new routes, errors and enum values.
- [ ] **Step 4: Run** all backend unit tests and e2e. Expected: pass.
- [ ] **Step 5: Commit** `feat(ledger): record when a tree ends, restore it, and link replacements`.

### Task 4: Web — data layer

**Files:**
- Modify: `web/src/features/plants/schemas.ts`, `plants/api.ts`, `plants/index.ts`, `web/src/features/tasks/schemas.ts`, `web/src/lib/query-keys.ts`, `web/src/locales/en.json` (`journal.types.PLANT_ENDED`)
- Test: `web/src/features/plants/plant-end-api.test.tsx` (new)

**Interfaces:**
- Produces:
  - **`plantSchema` gains** `planted_context: z.string()`, `ended_at`, `end_reason`, `end_note`, `end_entry_id` and `replaced_by_id`. All are nullable optional, normalised to `null`.
  - **`plantDetailSchema` gains** `life_profile: { first_fruit_months: [n,n]; productive_until_months: [n,n]; lifespan_months: [n,n]; note_key: string | null } | null`, which is also optional and normalised to `null`.
  - **The task status enum** adds `'CANCELLED'`.
  - **Hooks:**
    - `usePlants(page, status: 'active' | 'ended' = 'active')`, with key `['plants', 'list', status, page]`;
    - `useAllPlants()` stays active-only;
    - `useEndPlant(id)`, mutation `{ reason, ended_at?, note?, entry_id? }`;
    - `useRestorePlant(id)`;
    - `useCreatePlant()` accepts `replaces_id`.
  - **Invalidation:** end and restore invalidate `queryKeys.plants.all` (which covers detail, lists, cycles and timeline) and `queryKeys.tasks.mineAll`.
- [ ] **Step 1: Write the failing tests:**
  - `usePlants(1,'ended')` sends `status=ended`;
  - `useEndPlant` posts the body, then refetches the detail;
  - `useCreatePlant` sends `replaces_id`;
  - the task schema parses `CANCELLED`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b`. Expected: pass.
- [ ] **Step 5: Commit** `feat(web): plant end-of-life and life profile data`.

### Task 5: Web — life line

**Files:**
- Create: `web/src/features/biography/life-line.ts` and its `.test.ts`
- Modify: `sections/AtAGlance.tsx`, `en.json`
- Test: `plant-detail.test.tsx`

**Interfaces:**
- Produces: `lifeLine(plant: PlantDetail, now: Date): { phase: 'beforeFruit' | 'productive' | 'past'; values: Record<string, string | number>; container: boolean; noteKey: string | null } | null`.
  - It's `null` when there's no `life_profile`, no planting date, or precision is UNKNOWN.
  - `container` is true for POT or GROW_BAG. In that case it never returns `'past'`, and `productive` carries no `until` value.
  - The phase is `productive` once a first-fruit milestone is recorded, even when the tree is young.
  - It uses `plantAge` (from tree page v2) for the age.
- [ ] **Step 1: Write the failing tests:**
  - papaya at 4 months → `beforeFruit`, with `range` "8–12 months";
  - mango at 11 years → `productive`, with `year` 11 and `until` "40–60 years";
  - papaya at 4 years → `past`;
  - a potted mango at 11 years → `productive` with no `until`, and `container` true;
  - a mango at 2 years with `first_harvest_at` → `productive`;
  - no profile → `null`;
  - render: the tree page shows "Past the typical productive age" and "plan a replacement" for an old papaya, and shows no life line for "Rose".
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `lifeLine` and render it in At a glance, with the species note and the container note. The callout uses `bg-secondary-container/25`, not red.
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b`. Expected: pass.
- [ ] **Step 5: Commit** `feat(web): a life line for each tree`.

### Task 6: Web — loss UI

**Files:**
- Create: `web/src/features/biography/sections/EndSheet.tsx`, `sections/EndedBanner.tsx`
- Modify: `PlantDetailScreen.tsx` (read-only mode, "Mark as ended" button), `web/src/features/plants/PlantListScreen.tsx` (Growing / Past trees tabs), `PlantFormScreen.tsx` (`?replaces=`, prefill from the old plant, pass `replaces_id`), `web/src/features/tasks/TaskCard.tsx` and `this-week.ts` (`closedLabel` → `'cancelled'`), `en.json`, `web/README.md`, `web/e2e/loop.spec.ts`
- Test: `plant-detail.test.tsx`, `web/src/features/plants/plants.test.tsx`, `web/src/features/tasks/tasks.test.tsx`

**Interfaces:**
- Consumes: Task 4 hooks, the Pill, TextField and Button components, and the frosted sheet style from `LogMomentScreen`.
- [ ] **Step 1: Write the failing tests:**
  - `marks a tree as died with a cause and links the recent diagnosis`: open the sheet, pick "Disease or pest", see "Linked: …" for the latest DIAGNOSIS within 90 days, save, and check the POST body `{reason:'DISEASE_OR_PEST', entry_id:'d1'}`;
  - `an ended tree is read-only with a calm banner`: "Died · Mar 2026 · Disease or pest"; no "Log a Moment", "This season" or "Upcoming care"; "The Sanctuary Record" still present;
  - `restores an ended tree`: POST restore;
  - `plants a replacement with the same species and links it`: navigate to `/plants/new?replaces=p1`; the species is prefilled; the create body has `replaces_id:'p1'`;
  - `shows "Replaced by" and "Replaces" links`;
  - `lists past trees under their own tab with reason and date`;
  - `labels cancelled tasks in closed history`: "Cancelled · tree ended".
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **README:** add a note under the tree page section.
  - **e2e:** after the season review step, mark Aam as died (Disease or pest), see it under Past trees, restore it, and check it's back under Growing. Add the screenshot `11b-ended-tree`.
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b && npm run lint && npm run check:boundaries && npm run check:cycles && npm run e2e`. Expected: all pass, lint at the 15-warning baseline.
- [ ] **Step 5: Commit** `feat(web): record a lost tree, past trees, restore and replace`.

### Task 7: Whole-branch verification

- [ ] **Backend:** `npm run build && npm run lint && npx jest && npx jest --config test/jest-e2e.json`. Expected: all pass.
- [ ] **Web:** the Task 6 Step 4 command. Expected: all pass. Look at `07-tree-biography.png` and `11b-ended-tree.png`.
- [ ] **Final review** per `superpowers:executing-plans`.
