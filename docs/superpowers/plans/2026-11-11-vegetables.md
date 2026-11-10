# Vegetables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crops go Want to grow → get seeds → sow (nursery or direct) → transplant or thin → care → harvest → season end, with region-aware reminders, discovery, succession, how-much-to-plant, and named places with rotation hints.

**Architecture:**
- **Backend domain and services** go in `plant-ledger`, because the journal must drive the journey:
  - `domain/crop-calendar.ts` holds the data and the window maths;
  - `services/crop-journey.service.ts` holds the stage, season and task logic;
  - `repositories/garden-place.repository.ts` handles places.
- **A thin `crops` module** (controller plus `crops.service.ts`) exposes the calendar, want-to-grow, sync and places.
- **Web:** a `features/crops` area (discovery page, start sheet, place picker), plus a branch on the tree page for CROP records.

**Tech Stack:** NestJS 11 + Prisma 6 (jest, supertest); React 19 + TanStack Query 5 + zod 4 + Tailwind 4 (Vitest + MSW, Playwright).

**Spec:** `docs/superpowers/specs/2026-11-11-vegetables-design.md`. **§6.1 overrides** the earlier sections.

## Global Constraints

- Calendar values are ranges, with the reference cited in the module header comment. A crop with no window for a climate group is "Not usually grown in your region".
- Climate groups: PLAINS (NORTH, EAST, CENTRAL, WEST), PENINSULAR (SOUTH_DECCAN, COASTAL_HUMID), HILLS (HILLS_COOL).
- No task is created with a due date in the past. CROP_PLAN dedupe checks any status.
- Tree logic (seasonal pack, lifecycle stage recalculation, lifecycle task queue) never runs for plants with `crop_id`.
- Seasons never move a stage backwards. Only a never-sown planned crop may be deleted.
- Migrations are additive, generated with `prisma migrate diff --from-schema-datasource … --script` and applied with `migrate deploy`. **Never reset or use a blocked command; stop and ask.**
- Copy goes in `en.json`. TDD. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A crop added in the middle of its window should get get-seeds and sow tasks due today, never overdue. (Task 3 test.)
2. A crop whose first log is HARVEST (already growing) opens a season, becomes HARVESTING, and totals its yield. (Task 4 test.)
3. A second SOWING in an open season (a succession row) must not move HARVESTING back to IN_GROUND, or re-create germination or harvest tasks. (Task 4 test.)
4. Two tomato seasons in one year (Sep and Jan) get `season_no` 1 and 2, list in order, and show as two rows on the web. (Tasks 2, 4, 7.)
5. Existing CROP records without `crop_id` still list under Growing, and get no sync tasks and no errors. (Task 3 test.)

---

### Task 1: Crop calendar and the GET /crops/calendar endpoint
**Files:**
- Create: `backend/src/modules/plant-ledger/domain/crop-calendar.ts` (+ `.spec.ts`)
- Create: `backend/src/modules/crops/{crops.module.ts, crops.controller.ts, crops.service.ts}`, registered in `app.module.ts`
- Modify: `backend/src/modules/seasonal/services/weather.service.ts` (`getSeasonalSuggestions` uses the region's open crops)
- Test: `backend/test/e2e/crops.e2e-spec.ts` (new)

**Produces:**
- **Types and functions:**
  - `type ClimateGroup = 'PLAINS' | 'PENINSULAR' | 'HILLS'`;
  - `climateGroupFor(region: RegionCluster): ClimateGroup`;
  - `interface CropInfo { id; name; aliases; family; method: 'NURSERY_TRANSPLANT' | 'DIRECT_SOW' | 'TUBER' | 'CLOVE' | 'RHIZOME'; windows: Record<ClimateGroup, Array<[startMonth, endMonth]>>; germination_days; transplant_after_days | null; days_to_first_harvest; harvest_span_days; thin_after_days | null; succession_every_days | null; care: Array<{ key: string; after: 'SOWING' | 'TRANSPLANTING'; days: number }>; tags: Array<'container' | 'beginner' | 'quick'>; guide: { plants_for_family_of_4: string; container: string; spacing_cm: [n, n] } }`;
  - `CROPS: readonly CropInfo[]`, the 25 crops of spec §2.1, with families per §6.1.5;
  - `cropById(id)`;
  - `windowStatus(crop, group, now): { status: 'open' | 'soon' | 'later' | 'none'; opens_in_days?: number; next_month?: number; window_index?: number }`, with months that may wrap and dates in IST;
  - `nextWindow(crop, group, now, usedWindowStarts: Date[]): { index: number; start: Date; end: Date } | null`: the earliest window (open or future) whose start isn't in `usedWindowStarts`.
- **Endpoint:** `GET /crops/calendar` returns the user's region list, as `[{ ...CropInfo minus internals, status, opens_in_days?, next_month?, window_label: '<Mon>–<Mon>' }]`.
- **`getSeasonalSuggestions(district, region?)`** returns `crops` = the names of the open crops for the user's region (the controller passes the user's `region_cluster`). The season and advice strings stay.

- [ ] **Step 1: Failing tests:**
  - `climateGroupFor` for all 7 clusters;
  - `windowStatus`: tomato PLAINS on 2026-09-10 → open; on 2026-08-20 → soon, `opens_in_days` 12; on 2026-12-15 → soon (the Jan window), with the year wrap;
  - a crop with no HILLS window → `none`;
  - `nextWindow` skips a used window start;
  - every crop has a valid `family` and `method`, and nursery crops have `transplant_after_days`;
  - e2e: `GET /crops/calendar` for an EAST_INDIA user on a fixed clock lists palak as open in October;
  - e2e: the seasonal guide's `crops` for EAST_INDIA in October includes Spinach.
- [ ] **Step 2: Run** `npx jest crop-calendar && npx jest --config test/jest-e2e.json crops`. Expected: FAIL.
- [ ] **Step 3: Implement.** Fill the values from a cited reference. The e2e clock comes from the existing `FixedClock` override in the test app builder; if there's none, inject one via module overrides like `withFakeAi`.
- [ ] **Step 4: Run** all backend tests. Expected: pass.
- [ ] **Step 5: Commit** `feat(crops): a region-aware crop calendar`.

### Task 2: Schema — crop fields, seasons, places
**Files:**
- Modify: `prisma/schema.prisma`, plus a new migration
- Modify: `repositories/cycle.repository.ts` (upsert with `season_no 1`; ordering), `services/cycle.service.ts`
- Create: `repositories/garden-place.repository.ts`; places endpoints in the `crops` controller
- Test: unit and e2e (`crops.e2e-spec.ts`: places)

**Produces:**
- **`Plant` gains** `crop_id String?` and `crop_stage CropStage?`, with enum `CropStage` = `PLANNED`, `NURSERY`, `IN_GROUND`, `HARVESTING`, `RESTING`.
- **`PlantCycle` gains** `season_no Int @default(1)`, `started_at DateTime?`, `closed_at DateTime?` and `place_id String?` (FK to `GardenPlace`, SetNull). The unique key is `(plant_id, cycle_year, season_no)`.
- **`TaskSource` gains** `CROP_PLAN`.
- **Model `GardenPlace`:** `{ id, user_id, name, kind GardenPlaceKind (BED | GROW_BAG | POT | CONTAINER | GROUND), created_at, archived_at? }`.
- **Endpoints:**
  - `GET /garden/places`: active, by name;
  - `POST /garden/places` `{ name, kind }`;
  - `PUT /garden/places/:id` `{ name?, kind?, archived? }`, owner-scoped (404 otherwise).
- **The cycle API** returns `season_no`, `started_at`, `closed_at` and `place_id`.

- [ ] **Step 1: Failing tests:**
  - e2e places CRUD, including archive, and another user's place → 404;
  - the existing tree cycle e2e still passes (trees use `season_no 1`);
  - the cycle list includes `season_no`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement:**
  - write the schema;
  - write the migration with `migrate diff`, then review the SQL (the unique change is a DROP/CREATE INDEX, not data loss);
  - run `migrate deploy` and `generate`;
  - update the cycle repository: `upsertForYear` uses the compound unique with `season_no: 1`; `listForPlant` and `latestTwo` order by `[cycle_year desc, season_no desc]`.
- [ ] **Step 4: Run** all backend tests. Expected: pass.
- [ ] **Step 5: Commit** `feat(ledger): crop stages, crop seasons and garden places`.

### Task 3: Want to grow, list status, guards, sync
**Files:**
- Modify: `crops.service.ts`/`controller`, `plant.repository.ts` (status filter), `plant-record.service.ts` (no lifecycle work for crops), `seasonal.service.ts` (materialise is a no-op for crops), `task.repository.ts`/`task.service.ts` (any-status dedupe for CROP_PLAN), `dto/list-plants-query.dto.ts`
- Test: `crops.e2e-spec.ts`

**Produces:**
- **`POST /crops/plan`** `{ crop_id }` creates a Plant (`record_kind CROP`, `growth_habit ANNUAL`, `record_pattern RECURRING_SEASONAL`, `name = crop.name`, `species = crop.name`, `crop_id`, `crop_stage PLANNED`) and returns 201. An unknown `crop_id` is 422. Adding a crop already on the list (not ended) returns the existing plant with 200.
- **`DELETE /crops/plan/:plantId`** deletes a never-sown crop (no cycles), with its tasks and entries, in one transaction, returning 204. Otherwise 409 `CROP_HAS_SEASONS`.
- **`GET /ledger/plants?status=active|planned|ended`** splits per §6.1.9.
- **`POST /crops/plan/sync`** returns `{ created_count }`. For each PLANNED or RESTING crop of the user, it uses `nextWindow` (used starts are the windows in which a season started) and creates the "Get seeds" task (`step: 'seeds'`) and the "Sow" task (`step: 'sow'`), with `source_key` `crop:<plantId>:<windowStartISODate>:<step>`, due per §6.1.4. Running it twice gives `created_count` 0. A completed seeds task isn't re-created.
- **Guards:** seasonal materialise returns `{results:[], created_count:0}` for `crop_id` plants. `getDetail` skips the stage recalculation and the queue for `crop_id` plants.

- [ ] **Step 1: Failing e2e tests:**
  - add palak (status planned, not in active);
  - re-adding returns the same id;
  - an unknown crop → 422;
  - sync on a fixed clock 2026-08-20 (EAST): get seeds due 2026-08-20 (Sep window minus 21 = Aug 11 is in the past, so today), sow due Sep 1; a second sync creates 0;
  - completing get seeds, then syncing → still 0;
  - delete a never-sown crop → 204, with no tasks left;
  - a legacy CROP plant (no `crop_id`) is listed active, sync makes nothing for it, and materialise works for it as before;
  - materialise on a `crop_id` plant → `created_count` 0.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** all backend tests. Expected: pass.
- [ ] **Step 5: Commit** `feat(crops): want to grow, seed and sow reminders`.

### Task 4: The journey in the journal
**Files:**
- Create: `services/crop-journey.service.ts` (+ `.spec.ts`)
- Modify: `journal.service.ts` (crop branch), `cycle.service.ts` (open, attach and close a crop season), `diagnosis-pipeline.service.ts` (crop attach), `RecordedJournalEntry.plantCycleId` → `string | null`
- Test: unit and `crops.e2e-spec.ts`

**Produces:** `CropJourneyService.onEntry(tx, userId, plant, entry, eventAt): Promise<{ cycleId: string | null }>`, which applies §2.3 and §6.1.1–3:
- **season open, attach and close:**
  - SOWING, TRANSPLANTING or HARVEST opens a season when none is open, with `cycle_year` = the IST year, `season_no` = max+1 in that year, `started_at` = eventAt, and `place_id` from `metadata.place_id` (validated as the user's place, otherwise 404);
  - SEASON_END sets `closed_at`;
  - other entry types join the open season or none;
- **stage transitions** that never go backwards within a season (SEASON_END → RESTING);
- **follow-up tasks** (`source CROP_PLAN`) built from the calendar, with keys `crop:<plantId>:s<cycleId>:<step>`;
- **auto-completion** of earlier pending CROP_PLAN tasks for that window, or the open season, when a later step is logged;
- **cancellation** of the season's pending CROP_PLAN tasks at SEASON_END;
- **succession:** "Sow another row" every N days while growing and the window is open, created when SOWING or HARVEST is logged and by the sync (key `crop:<plantId>:s<cycleId>:row:<yyyy-mm-dd bucket>`).

- [ ] **Step 1: Failing tests:**
  - tomato (nursery) SOWING → stage NURSERY; a season opens with `season_no 1`; tasks: germination (+max), transplant (+min), care measured from sowing, first harvest (+min);
  - TRANSPLANTING → IN_GROUND, with the care steps measured from transplanting;
  - palak DIRECT SOWING → IN_GROUND, thin (if set), no transplant task;
  - TRANSPLANTING from PLANNED (bought seedlings) → IN_GROUND, and the pending seeds and sow tasks become COMPLETED;
  - HARVEST as the first log → a season opens, stage HARVESTING, and yield is totalled;
  - a second SOWING while HARVESTING → stage stays HARVESTING, no duplicate germination task, and a pending row task is completed;
  - SEASON_END → RESTING, `closed_at` set, pending CROP_PLAN tasks cancelled;
  - a second season in the same year → `season_no 2`;
  - a NOTE on a PLANNED crop → no cycle, and the crop is still deletable;
  - a foreign `place_id` → 404.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** all backend unit and e2e tests. Expected: pass.
- [ ] **Step 5: Commit** `feat(crops): the planting journey drives stages, seasons and tasks`.

### Task 5: Rotation endpoint
**Files:** `crops.service.ts`/`controller`; test in `crops.e2e-spec.ts`.

**Produces:** `GET /garden/places/:id/rotation?crop_id=` returns `{ conflict, last: { crop_id, crop_name, family, season_label } | null }`. It's a conflict when the place's most recent season that ended (`closed_at` within 12 months) was the same family.

- [ ] **Step 1: Failing tests:** potato season closed in March in place A, then tomato in A → conflict, with `last.crop_id` potato; beans in A → no conflict; another user's place → 404.
- [ ] **Steps 2–5:** run (FAIL), implement, run all, commit `feat(crops): rotation hint per place`.

### Task 6: Web data layer and the discovery page
**Files:**
- Create: `web/src/features/crops/{api.ts, schemas.ts, index.ts, CropsScreen.tsx, crops.test.tsx}`
- Modify: `web/src/app/routes.tsx` (`/crops`), `plants/schemas.ts` (`crop_id`, `crop_stage`; cycle `season_no`/`started_at`/`closed_at`/`place_id`), `plants/api.ts` (`usePlants` status `'planned'`), `dashboard/DashboardScreen.tsx` (sow line links to `/crops`; calls sync once per session through the session store, like materialise), `dashboard/use-session-materialize.ts` (skip `crop_id` plants), `plants/PlantFormScreen.tsx` (drop CROP), `plants/PlantListScreen.tsx` (a **Want to grow** tab, plus a "Find crops to grow" link to `/crops`), `en.json`

**Produces:**
- **Hooks:** `useCropCalendar()`, `useAddToPlan()`, `useRemoveFromPlan()`, `useCropSync()`, `usePlaces()`, `useCreatePlace()`, `useRotation(placeId, cropId)`.
- **`CropsScreen`:**
  - sections Sow now, Coming up and Later (`none` is hidden, or shown as "Not usually grown in your region");
  - filter chips Container-friendly, Easy for beginners and Quick harvest;
  - cards with the window label, method and guide line, plus "Add to Want to grow" or "On your list".

- [ ] **Step 1: Failing tests:**
  - sections by status;
  - each filter narrows the list;
  - add posts `{crop_id}` and the card shows "On your list";
  - the Want to grow tab lists planned crops (`status=planned`);
  - the dashboard calls sync once per session and links "Good to sow now" to `/crops`;
  - the add form has no Crop pill;
  - materialise is skipped for `crop_id` plants.
- [ ] **Steps 2–5:** run (FAIL), implement, run `npx vitest run && npx tsc -b && npm run lint && npm run check:boundaries && npm run check:cycles`, commit `feat(web): what can I sow now, and want to grow`.

### Task 7: Web crop page — journey card, start sheet, places, seasons
**Files:**
- Create: `web/src/features/crops/{JourneyCard.tsx, StartSheet.tsx, PlacePicker.tsx}` (exported via `index.ts`)
- Modify: `biography/PlantDetailScreen.tsx` (branch on `crop_id`), `biography/year-on-year.ts` (crop seasons keyed by cycle id, labelled by `started_at`, finished when `closed_at` is set), `biography/record-timeline.ts` (crop types in filters), `en.json`, `web/README.md`, `web/e2e/loop.spec.ts`
- Test: `web/src/features/crops/journey.test.tsx`, `biography/year-on-year.test.ts`

**Produces:**
- **On a crop page,** `JourneyCard` replaces MemoryCard, At a glance, This season and Milestones. It shows:
  - a stepper (Planned → Seeds → Sown → Transplanted [nursery only] → Harvesting → Season ended);
  - the next-action button;
  - the guide;
  - the place with its rotation note.
- **`StartSheet`:** *I have seeds* (method default from the calendar, with nursery/direct pills for crops that allow both; logs SOWING with `{method, place_id}`), *Bought seedlings* (logs TRANSPLANTING with `{place_id}`), *Get seeds first* (closes).
- **`PlacePicker`:** lists places, can add a place inline, and shows the rotation note.
- **Year on year** shows crop seasons as rows labelled "Sep 2026".

- [ ] **Step 1: Failing tests:**
  - a planned crop shows Start; *I have seeds* → direct for palak posts SOWING `{method:'DIRECT', place_id}`;
  - a nursery crop shows "Log transplant" when in NURSERY;
  - a rotation conflict shows the gentle note;
  - *Bought seedlings* posts TRANSPLANTING;
  - the stepper's current step per stage;
  - the guide renders;
  - two seasons in one year make two rows, "Sep 2026" and "Jan 2026";
  - a closed season counts as finished.
  - **e2e:** add palak, sync, Start → I have seeds → new place "Terrace bag" → sow; see "Check germination" under Upcoming care; log a harvest; end the season; palak is back under Want to grow. Screenshot `13-crop-journey`.
- [ ] **Steps 2–5:** run (FAIL), implement, run the full web checks plus e2e, commit `feat(web): the crop journey page`.

### Task 8: Verification and final review
- [ ] Backend: build, lint, jest, e2e. Web: all checks plus e2e. Then the final review per executing-plans.
