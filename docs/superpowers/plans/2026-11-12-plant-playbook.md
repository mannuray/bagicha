# Plant Playbook and Tree Care (Steps 1–2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the add-plant playbook skill, the region-aware tree-care format
and engine, and mango as the first family. Mango's care drives its dated
reminders, its Now/Next phase, its This-season lists and the paid overlay,
and new-tree tasks stop being a mango check.

**Architecture:** Care data is plain TypeScript per family under
`plant-ledger/domain/care/`. Pure functions there (`treeCareDue`,
`carePhaseView`) turn it into reminders and a phase view. `SeasonalService`
(the seasonal module, which already knows the user's region) uses them for
families that have care data. All other families keep today's season-pack
path unchanged until their batch ships. The pack row stays only as the paid
overlay's database anchor.

**Tech Stack:** NestJS 11, Prisma 6 (Postgres), Jest (unit and e2e), React
with React Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-12-plant-playbook-design.md`.
This plan covers rollout steps 1–2 only (spec §8). Per-tree timing (bahar,
planting, pruning anchors) and later content batches are separate plans.

## Global Constraints

- Gardener-practical copy, no filler. Every line is a concrete action for
  this tree, this region, this month (spec §2).
- Organic option first, chemical second. Chemical lines carry the dose,
  "wear gloves" and the waiting days before harvest; only products approved
  for that crop in India, never banned ones (spec §6).
- Reminder title is at most 60 characters.
- At most 3 care reminders per tree per month. Priority order: PROTECTION,
  FEEDING, PRUNING, WATERING, GENERAL. `conditional` items are never
  reminders (spec §5.4).
- Sharing between regions only through `sameAs`. Care is required for every
  region in `grownIn`; other regions use the nearest listed region plus the
  note "Not usually grown in your region; timings may differ." (spec §2, §5.1).
- Stage mapping: YOUNG = SAPLING, JUVENILE; BEARING = FIRST_FLOWERING,
  FIRST_HARVEST, MATURE_BEARING.
- Dose band with no planting date: `y4to7` for BEARING, `upTo3y` for YOUNG.
- Phase strings are snake_case (the web's `humanize` and the overlay's
  `_with_dryness_attention` suffix depend on it).
- Nothing in the content ships without the owner's yes on the review table.
- Deploy order: migrate Neon first, then push (Render deploys `main`).
- The project standard `docs/coding-principles.md` applies. Review against
  its §8 checklist.

## Review Focus

1. A care window crossing New Year (e.g. Dec 15 – Jan 20): exactly one
   occurrence, keyed to the start date, due on Dec 15, still due on Jan 5 →
   Task 3 test `crosses New Year as one occurrence`.
2. A gardener whose region isn't in `grownIn` (mango in HILLS_COOL): they get
   the nearest region's reminders and the note, not nothing → Task 3 test
   `uses the nearest grown region with a note`.
3. A family still pending (e.g. guava): its tasks, phase and overlay behave
   exactly as before this plan → Task 5 e2e `pending family keeps season
   pack behaviour`.
4. More than 3 items due, including a conditional spray: 3 reminders by
   priority, the conditional only on the page → Task 3 test `caps at 3 by
   priority and never reminds conditional items`.
5. A mango that already has pending SEASONAL_PACK tasks from before the
   deploy: those are cancelled and TREE_CARE tasks replace them, with no
   duplicates on refresh → Task 5 e2e `mango moves from pack tasks to care
   tasks once`.

---

## File Structure

- Create `backend/src/modules/plant-ledger/domain/care/types.ts`: `Anchor`,
  `CareItem`, `PhaseWindow`, `RegionCare`, `FamilyCare`, `CareStage`.
- Create `backend/src/modules/plant-ledger/domain/care/region-care.ts`:
  `stageOf`, `resolveRegionCare`, `NEAREST_REGIONS`.
- Create `backend/src/modules/plant-ledger/domain/care/engine.ts`:
  `treeCareDue`, `carePhaseView`.
- Create `backend/src/modules/plant-ledger/domain/care/index.ts`:
  `TREE_CARE` registry (`Record<string, FamilyCare>`), `careFor(family)`,
  `CARE_PENDING`.
- Create `backend/src/modules/plant-ledger/domain/care/mango.ts`: mango data
  (after owner review).
- Create `backend/src/modules/plant-ledger/domain/care/*.spec.ts`.
- Create `backend/src/modules/plants/domain/care-completeness.spec.ts`: the
  completeness test (needs the catalogue and care data).
- Modify `backend/prisma/schema.prisma` and add a migration: `TaskSource`
  gets `TREE_CARE`.
- Modify `backend/src/modules/plant-ledger/services/task.service.ts`:
  `TREE_CARE` is one-off.
- Modify `backend/src/modules/plant-ledger/domain/task-view.ts`: expose
  `care_how`.
- Modify `backend/src/modules/seasonal/seasonal.service.ts`: the care path
  in `materializeTasksForTree` and `getTreeIntelligence`.
- Modify `backend/src/modules/seasonal/intelligence-view.ts`: add
  `care_note`.
- Modify `backend/src/modules/plant-ledger/processors/task.processor.ts`:
  drop the mango check.
- Modify `backend/src/modules/plant-ledger/services/seasonal-intelligence.service.ts`:
  delete `mangoGuidance` once mango ships.
- Web: `features/tasks/schemas.ts`, `TaskCard.tsx`, `features/seasonal/api.ts`,
  `features/biography/sections/ThisSeason.tsx` (care note), `locales/en.json`.
- Create `.claude/skills/add-plant/` (`SKILL.md`, `checklist-tree.md`,
  `checklist-crop.md`, `checklist-seasonal-flower.md`,
  `checklist-perennial-flower.md`, `content-standard.md`,
  `review-templates.md`, `sources.md`).

---

### Task 1: Draft mango's care table for owner review (gate)

This is content, not code. It runs first so the owner reviews while Tasks
2–4 proceed.

**Files:**
- Create: Claude Doc "Mango care: review" (the docs connector), or a chat
  table if the owner prefers.

**Interfaces:**
- Produces: an approved table of mango `CareItem`s and `PhaseWindow`s per
  region in `grownIn`, which Task 6 transcribes.

- [ ] **Step 1: Work out `grownIn` for mango**: the union of `regions` on the
  mango entries in `plants/domain/fruit-catalogue.ts`, normalised to
  `RegionCluster`.
- [ ] **Step 2: Draft per region.** One table per region, using the spec §6
  columns (Region | When | Stage | Reminder | Organic | Chemical | Why), plus
  a phase table (When | Stage | Phase | Avoid | Watch). Sources: CISH
  Lucknow, then the state agricultural university package of practices for
  that region. Mark each line you're unsure of with "(check)". Regions that
  really match get `sameAs` with one line saying why.
- [ ] **Step 3: Owner review.** Present the tables, apply corrections, and
  get an explicit yes.
  Expected: the owner says yes to the final tables. **Do not start Task 6
  before this.**

### Task 2: Care types, region resolution and the completeness test

**Files:**
- Create: `plant-ledger/domain/care/types.ts`, `region-care.ts`, `index.ts`
- Test: `plant-ledger/domain/care/region-care.spec.ts`,
  `plants/domain/care-completeness.spec.ts`

**Interfaces:**
- Produces:
  - `type CareStage = 'YOUNG' | 'BEARING'`
  - `stageOf(stage: LifecycleStage): CareStage`
  - types exactly as spec §5.1 (`Anchor`, `CareItem`, `PhaseWindow`,
    `RegionCare`, `FamilyCare`)
  - `NEAREST_REGIONS: Record<RegionCluster, RegionCluster[]>`: the nearest
    first. Exact table:
    - NORTH_INDIA → [CENTRAL_INDIA, EAST_INDIA, WEST_INDIA, HILLS_COOL, SOUTH_DECCAN, COASTAL_HUMID]
    - EAST_INDIA → [NORTH_INDIA, CENTRAL_INDIA, COASTAL_HUMID, SOUTH_DECCAN, WEST_INDIA, HILLS_COOL]
    - WEST_INDIA → [CENTRAL_INDIA, SOUTH_DECCAN, COASTAL_HUMID, NORTH_INDIA, EAST_INDIA, HILLS_COOL]
    - CENTRAL_INDIA → [NORTH_INDIA, WEST_INDIA, EAST_INDIA, SOUTH_DECCAN, COASTAL_HUMID, HILLS_COOL]
    - SOUTH_DECCAN → [COASTAL_HUMID, WEST_INDIA, CENTRAL_INDIA, EAST_INDIA, NORTH_INDIA, HILLS_COOL]
    - COASTAL_HUMID → [SOUTH_DECCAN, WEST_INDIA, EAST_INDIA, CENTRAL_INDIA, NORTH_INDIA, HILLS_COOL]
    - HILLS_COOL → [NORTH_INDIA, EAST_INDIA, CENTRAL_INDIA, WEST_INDIA, SOUTH_DECCAN, COASTAL_HUMID]
  - `resolveRegionCare(care: FamilyCare, region: RegionCluster): { care: RegionCare; from: RegionCluster; grownHere: boolean }`.
    It follows `sameAs` (one hop; a chain or cycle throws at test time).
    Outside `grownIn`, it takes the first `NEAREST_REGIONS[region]` entry in
    `grownIn`.
  - `TREE_CARE: Record<string, FamilyCare>` (empty for now),
    `careFor(family: string): FamilyCare | null`, and
    `CARE_PENDING: readonly string[]` (all 26 tree families for now).

- [ ] **Step 1: Write the failing tests.**
  - `region-care.spec.ts`:
    - `stageOf maps SAPLING and JUVENILE to YOUNG, the rest to BEARING`
      (all 5 values)
    - `follows sameAs to the shared region`
    - `uses the nearest grown region with grownHere false` (a fixture
      family grown in NORTH_INDIA only: HILLS_COOL resolves `from:
      'NORTH_INDIA', grownHere: false`)
    - `throws on a sameAs chain`
  - `care-completeness.spec.ts`:
    - `every catalogue tree family has care data or is pending`
    - `care exists for every region the catalogue grows the family in`
      (the union of the catalogue's `regions`, upper-cased, ⊆ the keys of
      `regions` that aren't `sameAs`-to-missing)
    - `no family is both pending and done`
    - `titles are at most 60 characters and every chemical line mentions
      gloves and days`
- [ ] **Step 2: Run them and confirm they fail.**
  Run: `cd backend && npx jest src/modules/plant-ledger/domain/care src/modules/plants/domain/care-completeness.spec.ts`
  Expected: FAIL (modules not found).
- [ ] **Step 3: Implement the types, `region-care.ts` and `index.ts`** to the
  interfaces above.
- [ ] **Step 4: Run the tests again.** Expected: PASS. With an empty
  registry and all 26 pending, the completeness tests pass trivially.
- [ ] **Step 5: Commit** `feat(care): tree care format, region resolution, completeness test`.

### Task 3: The reminder engine

**Files:**
- Create: `plant-ledger/domain/care/engine.ts`
- Test: `plant-ledger/domain/care/engine.spec.ts`

**Interfaces:**
- Consumes: Task 2 types, `resolveRegionCare`, `stageOf`.
- Produces:
  ```ts
  interface CareReminder {
    key: string; title: string; category: CareItem['category'];
    due: Date; windowEnd: Date; sourceKey: string; // `${family}:${key}:${YYYY-MM-DD of window start}`
    organic: string; chemical: string | null; why: string; amount: string | null;
  }
  treeCareDue(care: FamilyCare, input: {
    region: RegionCluster; stage: LifecycleStage; plantedAt: Date | null; now: Date;
  }): { reminders: CareReminder[]; onPage: CareItem[]; note: string | null }
  ```
  Only `CALENDAR` anchors are evaluated in this plan. Other anchor kinds go
  to `onPage`, never reminders.

- [ ] **Step 1: Write the failing tests.** Use a fixture family, not mango.
  `now` is an IST date via `new Date('2026-02-10T06:00:00+05:30')`.
  - `reminds items whose window is open now, due today`
  - `reminds items opening within 30 days, due at the window start (midnight IST)`
  - `ignores items for the other stage`
  - `crosses New Year as one occurrence` (window Dec 15–Jan 20: on
    2026-12-20 and 2027-01-05 the `sourceKey` is the same and ends in
    `2026-12-15`)
  - `caps at 3 by priority and never reminds conditional items` (5 items
    due: PROTECTION, FEEDING, PRUNING, GENERAL and a conditional
    PROTECTION. Reminders = first three by order; `onPage` holds the rest,
    including the conditional)
  - `picks the dose band by age, and by stage without a planting date`
    (planted 2020 → `y4to7` in 2026; null planting + BEARING → `y4to7`;
    null + YOUNG → `upTo3y`)
  - `uses the nearest grown region with a note` (`note` equals the exact
    Global Constraints copy)
- [ ] **Step 2: Run them and confirm they fail.**
  Run: `cd backend && npx jest src/modules/plant-ledger/domain/care/engine.spec.ts`
  Expected: FAIL.
- [ ] **Step 3: Implement `treeCareDue`.** Dates go through the existing IST
  helpers in `common/time` (`istMonth`, `istYear`) and midnight-IST
  construction as in `flower-care.ts` `firstOfMonthIst`.
- [ ] **Step 4: Run them again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(care): dated reminders from care data`.

### Task 4: The phase view

**Files:**
- Modify: `plant-ledger/domain/care/engine.ts`
- Test: `plant-ledger/domain/care/engine.spec.ts`

**Interfaces:**
- Produces:
  `carePhaseView(care: FamilyCare, input: { region: RegionCluster; stage: LifecycleStage; now: Date }): { current_phase: string; upcoming_phase: string; do_now: string[]; avoid_now: string[]; watch_for: string[]; note: string | null }`.
  - `current_phase` is the phase window containing `now` for that stage.
  - `upcoming_phase` is the next window's phase.
  - `do_now` is the titles of items open now (conditional ones included,
    prefixed "If you see it: ").

- [ ] **Step 1: Write the failing tests**:
  - `current and upcoming phase for the stage`
  - `avoid and watch come from the current phase`
  - `conditional items appear in do_now with the prefix`
  - `a gap between windows reads as the next window's phase in upcoming and
    'growing' in current`
- [ ] **Step 2: Run and confirm they fail.** Expected: FAIL.
- [ ] **Step 3: Implement `carePhaseView`.**
- [ ] **Step 4: Run again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(care): phase view from care data`.

### Task 5: Wire care families into tasks, intelligence and the overlay

**Files:**
- Modify: `backend/prisma/schema.prisma` (`TaskSource` + `TREE_CARE`).
  Create migration `20261113090000_tree_care_source` with
  `ALTER TYPE "TaskSource" ADD VALUE 'TREE_CARE';`.
- Modify: `plant-ledger/services/task.service.ts` (`ONE_OFF_SOURCES` adds
  `TREE_CARE`; `retireSeasonTasksExcept` unchanged).
- Modify: `plant-ledger/domain/task-view.ts`: `care_how: { organic: string; chemical: string | null; why: string; amount: string | null; window_end: string } | null`,
  read from task metadata when `source === 'TREE_CARE'`.
- Modify: `seasonal/seasonal.service.ts`, `seasonal/intelligence-view.ts`.
- Test: `backend/test/e2e/tree-care.e2e-spec.ts`; extend
  `seasonal/seasonal.service.spec.ts`.

**Interfaces:**
- Consumes: `careFor`, `treeCareDue`, `carePhaseView`.
- Behaviour, for a tree whose family has care data (`careFor` non-null):
  - `materializeTasksForTree`:
    - drafts = `treeCareDue(...).reminders` → source `TREE_CARE`, type from
      category (FEEDING→FEED, PRUNING→PRUNE, PROTECTION→TREAT,
      WATERING→WATER, GENERAL→OBSERVE), metadata `{ organic, chemical,
      why, amount, window_end }`;
    - then cancel this plant's pending `SEASONAL_PACK` tasks (all of them),
      and run the existing overlay retire step for overlay tasks only.
  - `getTreeIntelligence` returns `seasonal_pack` built from
    `carePhaseView` (same field names, `confidence: 'high'`, `id` = the pack
    row's id from `getOrCreatePack`, kept as the overlay anchor), plus
    `care_note: string | null`.
  - The overlay is unchanged except `pack.current_phase` comes from
    `carePhaseView`.
  - Families without care data take today's path, byte for byte.

- [ ] **Step 1: Write the failing e2e tests** (register a fixture family in
  `TREE_CARE` through a test-only override, or use mango once Task 6 lands.
  Prefer the override, so this task doesn't wait on content):
  - `a care family gets TREE_CARE reminders with how-to on the task`
    (`GET tasks` → `source: 'TREE_CARE'`, `care_how.organic` present)
  - `mango moves from pack tasks to care tasks once` (seed a pending
    SEASONAL_PACK task, materialize twice → that task CANCELLED, TREE_CARE
    count stable)
  - `intelligence for a care family reads the phase from care data`
  - `a gardener outside grownIn gets care with the note`
  - `pending family keeps season pack behaviour` (guava: SEASONAL_PACK
    tasks, pack phase, as before)
  - `paid overlay still adjusts a care family's phase on dryness`
- [ ] **Step 2: Run and confirm they fail.**
  Run: `cd backend && npx jest -c test/jest-e2e.json tree-care`
  Expected: FAIL.
- [ ] **Step 3: Implement**: schema plus migration, one-off source, task view,
  the service branch. The test-only override is a provider token
  `TREE_CARE_REGISTRY` (default `TREE_CARE`), injected into
  `SeasonalService`, so e2e can supply a fixture family.
- [ ] **Step 4: Run all backend suites.**
  Run: `cd backend && npx jest && npx jest -c test/jest-e2e.json && npm run lint && node scripts/check-module-imports.js`
  Expected: all pass, and `response-allow-list` still passes (add
  `care_how` and `care_note` to the views' allow-lists).
- [ ] **Step 5: Commit** `feat(care): care families drive reminders, phase and overlay`.

### Task 6: Mango care data (after the Task 1 yes)

**Files:**
- Create: `plant-ledger/domain/care/mango.ts`
- Modify: `care/index.ts` (register mango, remove it from `CARE_PENDING`),
  `seasonal-intelligence.service.ts` (delete `mangoGuidance` and its switch
  case)
- Test: `care-completeness.spec.ts` (now exercises mango), plus a
  `mango.spec.ts` with 3 spot checks copied from the approved table (one
  reminder per region group, with its exact title and window).

- [ ] **Step 1: Write `mango.spec.ts`** from the approved table. Run it and
  confirm it FAILS (no data yet).
- [ ] **Step 2: Transcribe the approved table into `mango.ts`.** Nothing
  beyond what the owner approved.
- [ ] **Step 3: Run** `cd backend && npx jest src/modules/plant-ledger src/modules/plants src/modules/seasonal`.
  Expected: PASS, completeness included.
- [ ] **Step 4: Commit** `feat(care): mango care (reviewed)`.

### Task 7: New-tree tasks follow care (item 5)

**Files:**
- Modify: `plant-ledger/processors/task.processor.ts` and its spec.

**Interfaces:**
- Consumes: `careFor`.
- Behaviour:
  - A family with care data → the processor creates nothing (the web
    already calls `materialize-tasks` after creating a plant, and that now
    yields TREE_CARE reminders).
  - Pending families → `WATER` at +3 days, as today.
  - The mango check is deleted.

- [ ] **Step 1: Update `task.processor.spec.ts`**:
  - `creates nothing for a family with care data`
  - `waters a pending family in 3 days`
  - delete the mango feed/prune expectation

  Run it and confirm the first test FAILS.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** `npx jest src/modules/plant-ledger/processors` and the
  e2e `ledger plant-end`. Expected: PASS.
- [ ] **Step 4: Commit** `feat(care): new-tree tasks come from care data`.

### Task 8: Web shows how-to on care tasks, and the region note

**Files:**
- Modify: `web/src/features/tasks/schemas.ts` (`care_how` nullable object),
  `TaskCard.tsx`, `web/src/features/seasonal/api.ts` (`care_note`
  nullable), `features/biography/sections/ThisSeason.tsx`, `locales/en.json`.
- Test: `web/src/features/tasks/tasks.test.tsx`,
  `web/src/features/biography/*.test.tsx`.

- [ ] **Step 1: Write the failing tests**:
  - `a care task shows the organic way first, then the alternative, and why`
    (the card text order: organic before chemical; the label keys
    `tasks.care.organic` "Organic way" and `tasks.care.alternative` "Or")
  - `a task without care_how renders as before`
  - `This season shows the region note when present`
- [ ] **Step 2: Run** `cd web && npx vitest run src/features/tasks src/features/biography`.
  Expected: FAIL.
- [ ] **Step 3: Implement**, in the existing card style (compact, no new
  colours).
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b && npm run lint`.
  Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): care tasks show how to do them`.

### Task 9: The add-plant playbook skill

**Files:**
- Create: `.claude/skills/add-plant/SKILL.md` and the reference files listed
  in File Structure.

**Interfaces:**
- Consumes: the real paths and tests from Tasks 2–8, and the inventory in
  spec §7.

- [ ] **Step 1: Write `SKILL.md`.** Frontmatter `name: add-plant`, plus a
  description that triggers on adding or improving a tree, vegetable or
  flower, or on a care batch. The body is the five-step flow from spec §4.
- [ ] **Step 2: Write the checklists.** Each one lists, in order, every file
  and test for its kind, with the commands that prove it. The tree checklist
  includes: catalogue entry (key stable), aliases, life profile, optional
  `cycleStartMonth`, care file plus registry plus removal from
  `CARE_PENDING`, spot-check spec, completeness test, deploy note.
- [ ] **Step 3: Write `content-standard.md`** (spec §2–3 rules, with 3 good
  and 3 bad example lines), `review-templates.md` (the spec §6 tables) and
  `sources.md` (spec §6 list).
- [ ] **Step 4: Verify.** Follow `checklist-tree.md` against mango and
  confirm every step points at a real file:
  `grep -o 'backend/[^ )`]*' .claude/skills/add-plant/*.md | cut -d: -f2 | sort -u | xargs ls`
  Expected: every path exists.
- [ ] **Step 5: Commit** `docs(skill): add-plant playbook`.

### Task 10: Deploy

- [ ] **Step 1:** Full checks: backend `npx jest`, e2e twice, lint, module
  imports; web `npx vitest run`, `tsc -b`, lint.
- [ ] **Step 2:** The owner runs the Neon migration (rebuild the migrate
  image with `--no-cache`). Expected: `20261113090000_tree_care_source`
  applied.
- [ ] **Step 3:** The owner pushes `main`. Render deploy (trigger if auto-deploy
  is off); Vercel deploys the web automatically.
- [ ] **Step 4:** Live check:
  - a test mango in a test account gets TREE_CARE reminders with how-to;
  - guava is unchanged.
