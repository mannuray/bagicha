# Planting-timed Tree Care Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Care items timed from the planting date (`FROM_PLANTING`) become dated reminders, a tree without a usable planting month is asked for one, then papaya care is drafted and source-checked up to the owner's review.

**Architecture:** The plant-ledger care engine learns a second window kind beside `CALENDAR`, computed from the tree's planting date and its precision; everything after the window (lookahead, cap, priority, task keys, retire) is shared. The catalogue validator gains three rules. The seasonal service passes precision in and a boolean out; the web shows a prompt and refreshes reminders after a planting-date edit.

**Tech Stack:** NestJS 11, Prisma 6, zod 4, Jest (backend); React, TanStack Query, zod, Vitest + MSW (web).

**Spec:** `docs/superpowers/specs/2026-11-23-planting-timed-care-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md`; review against its §8 checklist.
- Month-only planting date counts from the **15th** (stored as the 1st: add 14 days).
- `YEAR` / `UNKNOWN` precision: **no planting-timed reminders, no guessing**.
- Task key format unchanged: `${family}:${key}:${YYYY-MM-DD of window start}` (IST).
- Lookahead stays 30 days; cap stays 3 reminders per tree, shared with calendar items.
- Phases stay calendar-only; `FROM_CHOICE` behaviour unchanged (on page, undated).
- No Prisma migration. No catalogue data change in release 1.
- Papaya care: **no seed file before the owner's explicit yes** (add-plant playbook).
- Commit only on branch `feat/planting-timed-care`; never push or deploy without the owner asking.

## Review Focus

1. A conditional ("if you see it") planting-timed item when the date is unknown — owner decision 3 says it must still show; the spec's engine line says planting items are left out. **Ruling in this plan:** conditional planting-timed items show on the page when the date is unusable; with a date they show only while their window is current, like calendar conditionals. Test in Task 2.
2. A planting date in the future (typo, or planted next week) — windows simply lie ahead; nothing crashes, nothing negative. Test in Task 2.
3. A tree whose stage has planting items only for the other stage — no flag, no reminders. Test in Task 2.
4. An older web build talking to the new API, and the new web talking to an old API — the field is optional on the web and defaults to `false`. Test in Task 4.
5. A plant edit that changes something other than the planting date — must not call materialize. Test in Task 4.

---

### Task 1: Catalogue rules for planting-timed care

**Files:**
- Modify: `backend/src/modules/catalogue/domain/tree-care.schema.ts`
- Modify: `backend/src/modules/catalogue/domain/tree-care.ts` (the `Anchor` doc comment: `FROM_PLANTING` is now evaluated; `FROM_CHOICE` still on page only)
- Test: `backend/src/modules/catalogue/domain/tree-care.schema.spec.ts`

**Interfaces:**
- Produces: `treeCareSeedSchema` rejects (a) a phase whose `when.kind !== 'CALENDAR'`, (b) a `FROM_PLANTING` anchor with `fromDays > toDays`, (c) an item with `when.kind === 'FROM_PLANTING'` and a `dose`. All existing seeds still pass.

- [ ] **Step 1: Write the failing tests** in the existing `describe('tree care records in the seed')`, built from the file's existing valid-family fixture:
  - `rejects a phase timed from planting` — phase `when: { kind: 'FROM_PLANTING', fromDays: 0, toDays: 30 }` → `safeParse(...).success === false`.
  - `rejects a planting window that ends before it starts` — item `when: { kind: 'FROM_PLANTING', fromDays: 90, toDays: 60 }` → false.
  - `rejects a dose on a planting-timed item` — item with `FROM_PLANTING` 90–120 and a valid `dose` → false.
  - `accepts a planting-timed item without a dose` — 90–120, no dose → true.
- [ ] **Step 2: Run** `cd backend && npx jest src/modules/catalogue/domain/tree-care.schema.spec.ts` — Expected: the three "rejects" tests FAIL, the "accepts" passes.
- [ ] **Step 3: Implement** with `.refine` on the `FROM_PLANTING` anchor object (from ≤ to), a `CALENDAR`-only anchor for `phaseWindow.when`, and a `.refine` on `careItem` (no `dose` when planting-timed). Messages in plain words, e.g. `'a dose scales by whole years; write the amount in the text'`.
- [ ] **Step 4: Run** the spec file and `npx jest src/modules/catalogue` — Expected: all PASS (the real seed still validates).
- [ ] **Step 5: Commit** `feat(catalogue): rules for planting-timed care items`.

### Task 2: Engine evaluates planting-timed windows

**Files:**
- Modify: `backend/src/modules/plant-ledger/domain/care/engine.ts`
- Test: `backend/src/modules/plant-ledger/domain/care/engine.spec.ts`

**Interfaces:**
- Consumes: `CareItem['when']` incl. `{ kind: 'FROM_PLANTING'; fromDays; toDays }` (catalogue types, re-exported in `care/types.ts`).
- Produces:
  - `TreeCareInput.plantingPrecision: PlantingDatePrecision` (required; `@prisma/client` enum).
  - `export function plantingDay(plantedAt: Date | null, precision: PlantingDatePrecision): Date | null` — IST midnight of the planting day: `EXACT_DATE` → the stored calendar date (read as UTC Y-M-D); `MONTH_YEAR` → the 15th of the stored month; `YEAR`/`UNKNOWN`/null → `null`.
  - `windowOf(item, now, plantedOn: Date | null)` — third parameter added; `FROM_PLANTING` with `plantedOn` gives `start = plantedOn + fromDays`, `end = plantedOn + toDays` (whole days), then the same open-now / 30-day-lookahead / ended rule as calendar (`now < end + 1 day` still counts). `FROM_PLANTING` without `plantedOn`, and `FROM_CHOICE`, → `null`.
  - `treeCareDue(...)` return gains `needsPlantingMonth: boolean`.
  - `carePhaseView` signature becomes `Omit<TreeCareInput, 'plantedAt' | 'plantingPrecision'>`; behaviour unchanged.

Behaviour in `treeCareDue` (only the item loop and the flag change):
- Planting-timed item with a window → exactly like a calendar item (non-conditional → candidate with key `${family}:${key}:${ymd(start)}`; conditional → `onPage` and `thisMonth`).
- Planting-timed item with no planting day: non-conditional → left out (not in `onPage`, not in `thisMonth`); conditional → `onPage` and `thisMonth` (Review Focus 1).
- `FROM_CHOICE` → `onPage` as today.
- `needsPlantingMonth` = the stage has a non-conditional planting-timed item **and** `plantingDay(...)` is null **and** (precision is not `YEAR`, or at least one such item would still be current if counted from 31 Dec of the stored year). Put the year rule in a small named helper.

- [ ] **Step 1: Write the failing tests** in a new `describe('planting-timed care')`, using a helper `planted(key, fromDays, toDays, over?)` that builds a `CareItem` with `when: { kind: 'FROM_PLANTING', fromDays, toDays }` and stages `['YOUNG','BEARING']`, and `due(...)` with `plantingPrecision` added (existing tests pass `plantingPrecision: 'UNKNOWN'` via the helper default):
  - `exact date: a window open now is a reminder keyed by its start` — planted `2026-06-01` EXACT_DATE, item 90–120, now `2026-09-05` → one reminder, `sourceKey === 'fixture:feed:2026-08-30'`, `windowEnd` = IST midnight `2026-09-29`.
  - `month only: counts from the 15th` — planted `2026-06-01` MONTH_YEAR, item 90–120, now `2026-09-14` → reminder key `fixture:feed:2026-09-13`.
  - `a window 20 days ahead is a reminder due at its start` — EXACT `2026-06-01`, item 90–120, now `2026-08-10` → `due` = IST midnight `2026-08-30`.
  - `a window already over is skipped` — EXACT `2024-01-10`, item 0–30, now `2026-09-05` → no reminder, not in `thisMonth`.
  - `year or unknown date: no planting reminders, flag set` — precision `UNKNOWN` → `reminders` empty, `thisMonth` empty, `needsPlantingMonth === true`; same with `YEAR` planted `2026-01-01` and now `2026-03-01`.
  - `year-only tree whose steps are all over: no flag` — `YEAR` planted `2020-01-01`, item 0–540, now `2026-09-05` → `needsPlantingMonth === false`.
  - `exact date: no flag` — `needsPlantingMonth === false`.
  - `conditional planting item shows on the page without a date` — conditional item, `UNKNOWN` → in `thisMonth` with `if_you_see` set, and `needsPlantingMonth === false` when it is the only item.
  - `planting and calendar items share the cap of 3` — two calendar + two planting items all open, distinct categories → `reminders.length === 3`, the 4th in `onPage`.
  - `a changed planting date changes the key` — same item, planted `2026-06-01` vs `2026-06-10` → different `sourceKey`.
  - `a planting date in the future gives windows ahead, no crash` — EXACT `2026-10-01`, item 0–30, now `2026-09-20` → reminder due `2026-10-01` (within lookahead).
  - `items for the other stage: no flag, no reminder` — item stages `['BEARING']`, tree YOUNG (`LifecycleStage.SAPLING` or the file's young stage), `UNKNOWN` → `needsPlantingMonth === false`.
  - `plantingDay` unit tests: EXACT `2026-06-01T00:00:00Z` → IST midnight 2026-06-01; MONTH_YEAR → IST midnight 2026-06-15; YEAR → null; null date → null.
- [ ] **Step 2: Run** `cd backend && npx jest src/modules/plant-ledger/domain/care/engine.spec.ts` — Expected: new tests FAIL (TypeScript error on `plantingPrecision` / `needsPlantingMonth` counts as the failure); existing tests unchanged.
- [ ] **Step 3: Implement** in `engine.ts` per the Interfaces block. Reuse `istMidnight` / `DAY_MS`; no new module.
- [ ] **Step 4: Run** `npx jest src/modules/plant-ledger src/modules/catalogue` — Expected: all PASS, including the per-family spot-check specs (mango, guava… and citrus) with no edits to their expectations.
- [ ] **Step 5: Commit** `feat(care): reminders timed from the planting date`.

### Task 3: Seasonal service passes precision and reports the flag

**Files:**
- Modify: `backend/src/modules/seasonal/seasonal.service.ts` (both `treeCareDue` calls, ~lines 130 and 185; `carePhaseView` callers if the type change requires)
- Modify: the intelligence response type/view if one is declared (`backend/src/modules/seasonal/intelligence-view.ts`)
- Test: `backend/src/modules/seasonal/seasonal.service.spec.ts`; e2e `backend/test/tree-care-kinds.e2e-spec.ts` only if it asserts the full response shape

**Interfaces:**
- Consumes: Task 2's `plantingPrecision` input and `needsPlantingMonth` output.
- Produces: `getTreeIntelligence` returns `care_needs_planting_month: boolean` (`false` when the family has no reviewed care).

- [ ] **Step 1: Write the failing tests** in `seasonal.service.spec.ts`, following its existing care fixtures:
  - `reports that a planting month is needed` — a family whose care has a non-conditional `FROM_PLANTING` item, plant with `planting_date: null`, `planting_date_precision: 'UNKNOWN'` → `care_needs_planting_month === true`.
  - `passes the planting precision to the engine` — same family, plant `planting_date` 2026-06-01, precision `MONTH_YEAR`, clock 2026-09-14 → `materializeTasksForTree` creates a task with `sourceKey` ending `:2026-09-13`.
  - `no reviewed care: flag false`.
- [ ] **Step 2: Run** `cd backend && npx jest src/modules/seasonal` — Expected: FAIL.
- [ ] **Step 3: Implement**: pass `plantingPrecision: plant.planting_date_precision` (and `growing.planting_date_precision`); add the field to the returned object.
- [ ] **Step 4: Run** `npx jest src/modules/plant-ledger src/modules/plants src/modules/seasonal src/modules/catalogue`, then `npx jest -c test/jest-e2e.json tree-care catalogue`, `npm run lint`, `node scripts/check-module-imports.js`, `npx tsc --noEmit -p tsconfig.json` — Expected: all PASS / clean.
- [ ] **Step 5: Commit** `feat(seasonal): tell the plant page when a planting month is needed`.

### Task 4: Web prompt and refresh after a planting-date edit

**Files:**
- Modify: `web/src/features/seasonal/api.ts` (intelligence schema)
- Modify: `web/src/features/biography/sections/ThisSeason.tsx`
- Modify: `web/src/features/plants/api.ts` (`useUpdatePlant`)
- Modify: `web/src/locales/en.json`, `web/src/locales/hi.json` (under `biography`)
- Test: `web/src/features/biography/plant-detail.test.tsx`; `web/src/features/plants/plant-end-api.test.tsx` (or a new `plant-update-api.test.tsx` in the same style)

**Interfaces:**
- Consumes: API field `care_needs_planting_month`.
- Produces: `PlantIntelligence['care_needs_planting_month']: boolean`.

Copy (exact):
- `biography.plantingMonthAsk` en: `"When did you plant it? Add the month to get care reminders for this tree."` hi: `"आपने इसे कब लगाया था? इस पेड़ की देखभाल के रिमाइंडर पाने के लिए महीना जोड़ें।"`
- `biography.addPlantingMonth` en: `"Add planting month"` hi: `"लगाने का महीना जोड़ें"`

- [ ] **Step 1: Write the failing tests**
  - plant-detail: `asks for the planting month when the server says so` — intelligence response with `care_needs_planting_month: true` → text `When did you plant it?…` visible and a link named `Add planting month` with `href` `/plants/<id>/edit`. Must render even when `avoid_now`, `watch_for`, `care_this_month` are empty and `care_note` is null.
  - plant-detail: `no prompt when the field is missing` — response without the field (older server) → prompt absent.
  - plants api: `refreshes reminders after the planting date changes` — `useUpdatePlant('p1').mutate({ planting_date: '2026-06', planting_date_precision: 'MONTH_YEAR' })` → MSW sees `POST /seasonal/plant/p1/materialize-tasks` once.
  - plants api: `does not refresh reminders for other edits` — `mutate({ name: 'Papita' })` → no materialize request.
- [ ] **Step 2: Run** `cd web && npx vitest run src/features/biography/plant-detail.test.tsx src/features/plants` — Expected: new tests FAIL.
- [ ] **Step 3: Implement**:
  - schema: `care_needs_planting_month: z.boolean().nullish().transform((v) => v ?? false)`.
  - `ThisSeason`: include the flag in the early `return null` condition; render the prompt (body text + `Link` styled like the Milestones edit link) above `ThisMonth`.
  - `useUpdatePlant`: after the PUT, when `'planting_date' in changes || 'planting_date_precision' in changes`, `await materializeTasks(api, id).catch(() => undefined)` (best effort, same comment as `useCreatePlant`); keep the existing invalidation.
- [ ] **Step 4: Run** `cd web && npm test && npm run lint && npx tsc -b` — Expected: all PASS / clean.
- [ ] **Step 5: Commit** `feat(web): ask for the planting month; refresh care after a date edit`.

### Task 5: Playbook docs know planting-timed care

**Files:**
- Modify: `.claude/skills/add-plant/checklist-tree.md` (step 5: care now lives in `backend/src/modules/catalogue/seed/tree-care/<family>.seed.ts` + `index.ts`; planting-timed items are supported — amounts in the text, no `dose`; bahar/pruning (`FROM_CHOICE`) still on page only)
- Modify: `docs/deploy.md` only if its stage-3 notes say planting timing is unsupported

- [ ] **Step 1:** Edit the checklist lines; `grep -n "per-tree timing" .claude/skills/add-plant/*.md docs/*.md` — Expected: no stale "needs the per-tree timing work first" for planting.
- [ ] **Step 2: Commit** `docs(add-plant): planting-timed care is supported`.

### Task 6: Papaya care — draft, source check, owner review (STOPS at the gate)

Follow `.claude/skills/add-plant/SKILL.md` steps 1–4 exactly. No seed or code file is written in this task.

**Files:**
- Create: `docs/plant-care/papaya.md` (draft + verified table, marked "awaiting owner review")

- [ ] **Step 1: Draft** to `content-standard.md` from `sources.md` (TNAU, NHB, ICAR/KVK, PAU), per region: planting-timed items (basal + microbe booster at planting, first feed ~day 90, feeds every ~60 days as separate items with their own keys, booster ~day 180), calendar items (cold protection north/central, monsoon waterlogging, aphid/PRSV watch, mite/mealybug), conditional "once flowers appear: keep ~1 male per 10–20 females", phases by season. Amounts per plant per feed in the text. Mark doubts "(check)".
- [ ] **Step 2: Source check** — research agent with web search, line by line: OK / corrected / removed with a link; chemicals against CIB&RC label claims for papaya (dose, waiting days). Apply corrections.
- [ ] **Step 3: Region question** — include the proposal to add `north_india` to papaya's catalogue regions (PAU source), as a separate yes/no.
- [ ] **Step 4: Owner review** — review table per `review-templates.md`, as a Claude Doc (one family, many rows). **Stop here and wait for an explicit yes.** Commit the draft doc: `docs(plant-care): papaya draft for owner review`.

After the yes (a later session, not this plan): `papaya.seed.ts`, add to `TREE_CARE_SEED`, drop `papaya` from `CARE_PENDING`, spot-check spec, completeness test, catalogue push after release 1 is deployed.

## Finish

Final whole-branch review (most capable model), then `superpowers:finishing-a-development-branch`. Deploy of release 1 per `docs/deploy.md` (no migration; Render manual deploy, Vercel auto) only when the owner asks.
