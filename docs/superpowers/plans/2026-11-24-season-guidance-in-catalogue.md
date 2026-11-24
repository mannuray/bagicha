# Season Guidance in the Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home season tips move into the catalogue word for word (release A); trees without reviewed care get an honest "care is coming" instead of the generic season pack, while the premium personal adjustment keeps working on every tree (release B).

**Architecture:** A new catalogue kind `seasonGuide` follows the tree-care pattern (strict schema → seed → JSON row → snapshot). One shared care lookup (`careFor`) decides whether reviewed care applies to a tree; every reader (plant page, reminders, first-watering job, AI context, seasonal-state endpoint) uses it, and the hand-written season guidance is deleted. Pack rows stay only as the overlay's database anchor.

**Tech Stack:** NestJS 11, Prisma 6, zod 4, Jest (backend); React, TanStack Query, zod, Vitest + MSW (web).

**Spec:** `docs/superpowers/specs/2026-11-24-season-guidance-in-catalogue-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md` (§8 checklist).
- Home tips are transcribed **byte-for-byte**; no gardener sees a difference.
- Every `RegionCluster` has an approved 12-month guide, checked when a snapshot loads.
- `care_status: 'reviewed' | 'coming'`; for `'coming'` the API still sends `seasonal_pack` with phase values `care_coming` and empty lists.
- New pack anchor rows: empty lists, `care_coming` phases, empty `task_templates`, `basis: 'anchor_only'`, `pack_version: 2`.
- The tree view in the AI context and the seasonal-state endpoint applies to `record_kind === TREE && !crop_id` only.
- Two releases: A = migration → push → API deploy; B = API deploy → web. Branch `feat/season-guidance-catalogue`; never push or deploy without the owner.

## Review Focus

1. A version-1 filler pack row already in the database for a pending family — must never show or create tasks. Test in Task 5.
2. A reviewed family in a pending region (pomegranate, WEST_INDIA) — `'coming'`, and a new one still gets the first-watering check. Tests in Tasks 4 and 5.
3. A premium user with a "soil dry" log on a tree without care — still gets both overlay tasks, `adjusted_phase` `dryness_attention`, and retire does not cancel them. Test in Task 5.
4. A crop or seasonal flower diagnosed by the AI — no `seasonal_state`, never "care coming". Test in Task 6.
5. A snapshot missing one region's guide — refused at load, old snapshot served. Test in Task 2.

---

## Release A — home tips

### Task 1: `seasonGuide` catalogue kind and seed

**Files:**
- Create: `backend/src/modules/catalogue/domain/season-guide.ts` (types), `backend/src/modules/catalogue/domain/season-guide.schema.ts`, `backend/src/modules/catalogue/seed/season-guide.seed.ts`
- Modify: `catalogue/domain/types.ts` (`CatalogueSeed.seasonGuide`), `catalogue/domain/schemas.ts` (validateSeed), `catalogue/domain/catalogue.ts`, `catalogue/seed/index.ts`, `catalogue/index.ts` (exports)
- Test: `catalogue/domain/season-guide.schema.spec.ts`, `catalogue/seed/season-guide.seed.spec.ts`

**Interfaces:**
- Produces: `interface SeasonMonth { season: string; headline: string; points: string[] }`; `interface SeasonGuideSeed { region: RegionCluster; months: SeasonMonth[]; status: CatalogueStatus; notes: string | null }`; `CatalogueSeed.seasonGuide: SeasonGuideSeed[]`; `Catalogue.seasonGuide(region: RegionCluster): SeasonMonth[] | null` (APPROVED only); `Catalogue.approvedCounts().seasonGuideRegions: RegionCluster[]`.

- [ ] **Step 1: Failing tests.** schema spec: `accepts the seed`; `rejects 11 months`; `rejects an unknown field`; `rejects a region listed twice`; `reports a region with no approved guide` (validateSeed issue). seed spec: `the seed equals the old SEASON_GUIDE for every region and month` — `expect(Object.fromEntries(SEASON_GUIDE_SEED.map(g => [g.region, g.months]))).toEqual(SEASON_GUIDE)` importing the old constant from `seasonal/domain/season-guide`.
- [ ] **Step 2: Run** `cd backend && npx jest src/modules/catalogue` — Expected: new tests FAIL.
- [ ] **Step 3: Implement.** Strict zod (`.strict()`, `months` length exactly 12, `points` non-empty strings). Seed transcribed from `SEASON_GUIDE` (the `PLAINS(...)` helper may be copied into the seed file so the text stays identical). `Catalogue.from` builds a `Map<RegionCluster, SeasonMonth[]>`.
- [ ] **Step 4: Run** `npx jest src/modules/catalogue && npx tsc --noEmit -p tsconfig.json` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): season guide as catalogue data`.

### Task 2: Store, push and database table

**Files:**
- Modify: `backend/prisma/schema.prisma` (model `CatalogueSeasonGuide`: `region` PK text, `status`, `data` JSONB, `notes`, timestamps — as `CatalogueTreeCare`), `catalogue/catalogue.repository.ts`, `catalogue/push/catalogue-push.service.ts` (`seasonGuide: { keyOf: g => g.region, ordered: false }`), `catalogue/catalogue.store.ts`, `common/logging/log-fields.ts` (`seasonGuideCount`), `catalogue/testing.ts`
- Create: `backend/prisma/migrations/20261124120000_catalogue_season_guide/migration.sql`
- Test: `catalogue/catalogue.store.spec.ts`, `catalogue/catalogue.repository.spec.ts`, e2e `test/e2e/catalogue-push.e2e-spec.ts`, `test/e2e/catalogue-repository.e2e-spec.ts`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: repository `loadSeed` returns `seasonGuide`; push writes it; store refuses a snapshot unless `approvedCounts().seasonGuideRegions` covers every `RegionCluster`.

- [ ] **Step 1: Failing tests:** store `refuses to load a catalogue missing one region's season guide` (first load throws `CatalogueUnavailableError`; on reload the old snapshot is served); repository round-trip includes season guide; e2e push writes 7 season-guide rows and a second push changes nothing.
- [ ] **Step 2: Run** `npx prisma generate && npx jest src/modules/catalogue` — Expected: FAIL.
- [ ] **Step 3: Implement** mirroring tree care (commit `20f98bd` is the model). Migration SQL: one `CREATE TABLE "catalogue_season_guide"` like `catalogue_tree_care`.
- [ ] **Step 4: Run** `npx jest src/modules/catalogue` and `npx jest -c test/jest-e2e.json catalogue` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): store and push the season guide`.

### Task 3: Home tips read from the catalogue

**Files:**
- Modify: `backend/src/modules/seasonal/seasonal.service.ts` (`getSeasonalGuide`), `backend/src/modules/seasonal/domain/season-guide.ts` (delete `SEASON_GUIDE` and the helpers; `seasonGuide(months, now)` remains or is inlined), `seasonal/domain/season-guide.spec.ts`, `catalogue/seed/season-guide.seed.spec.ts` (drop the equality test once the constant is gone — replace it with three exact spot checks of region × month copied from the seed: headline and first point)
- Test: `seasonal/seasonal.service.spec.ts`

- [ ] **Step 1: Failing test:** `getSeasonalGuide reads the region's month from the catalogue` — a catalogue whose NORTH_INDIA January headline is `'Test headline'` returns it for a Patna-less North India user in January.
- [ ] **Step 2: Run** `npx jest src/modules/seasonal` — Expected: FAIL.
- [ ] **Step 3: Implement**; month stays `istMonth(now) - 1`. Then delete the constant and run the seed spec swap.
- [ ] **Step 4: Run** `npx jest && npx jest -c test/jest-e2e.json && npm run lint && npx tsc --noEmit -p tsconfig.json` — Expected: all PASS.
- [ ] **Step 5: Commit** `feat(seasonal): home tips from the catalogue`. **Release A ready** (migration → push → deploy; owner decides when).

## Release B — no fallback

### Task 4: One care lookup; first-watering check respects region

**Files:**
- Create: `backend/src/modules/plant-ledger/domain/care/care-for.ts`
- Modify: `plant-ledger/processors/task.processor.ts` (load the user's `region_cluster`/`district` by `user_id`), `plant-ledger/index.ts` (export), `seasonal/seasonal.service.ts` (`loadIntelligence` uses it)
- Test: `plant-ledger/domain/care/care-for.spec.ts`, `plant-ledger/processors/task.processor.spec.ts`

**Interfaces:**
- Produces: `careFor(catalogue: Catalogue, family: string, tree: TreeWords, region: RegionCluster): FamilyCare | null` — `catalogue.treeCareFor(family, tree)` then `careApplies(care, region)`.

- [ ] **Step 1: Failing tests:** `careFor` returns null for pomegranate in WEST_INDIA and the care for NORTH_INDIA; processor `a new pomegranate in West India still gets its watering check` (user region WEST_INDIA → one WATER task) and `a new mango in North India gets none` (unchanged).
- [ ] **Step 2: Run** `npx jest src/modules/plant-ledger` — Expected: FAIL.
- [ ] **Step 3: Implement**; processor reads the user via the existing user/plant repository (no new module import that breaks `check-module-imports`).
- [ ] **Step 4: Run** `npx jest src/modules/plant-ledger src/modules/seasonal && node scripts/check-module-imports.js` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(care): one care lookup; watering check where care doesn't apply`.

### Task 5: Plant page and reminders without the fallback; overlay on every tree

**Files:**
- Modify: `backend/src/modules/seasonal/seasonal.service.ts` (`getTreeIntelligence`, `materializeTasksForTree`, `loadIntelligence`, `getOrCreatePack`, `getOrRefreshOverlay`), `seasonal/domain/overlay-rules.ts` (`buildPersonalizedOverlay(plant, entries, phase: string | null, now)`; delete `buildTaskTemplates`), `seasonal/intelligence-view.ts`, `PACK_VERSION` → 2
- Test: `seasonal/seasonal.service.spec.ts`, `seasonal/domain/overlay-rules.spec.ts`

**Interfaces:**
- Consumes: `careFor` (Task 4).
- Produces: intelligence response field `care_status: 'reviewed' | 'coming'`.

- [ ] **Step 1: Failing tests:**
  - `a tree without reviewed care is 'coming' with an empty pack` — `care_status 'coming'`, `seasonal_pack.current_phase 'care_coming'`, lists `[]`.
  - `an old filler pack row is never shown or turned into tasks` — `packs.findCohort` returns a version-1 row with filler lists and `task_templates`; intelligence lists empty; materialize creates no SEASONAL_PACK draft.
  - `new anchor rows are version 2 with no content` — `packs.create` called with `pack_version: 2`, `basis: 'anchor_only'`, empty lists and templates.
  - `pomegranate in West India is 'coming'`.
  - `a premium tree without care still gets the dryness tasks` — two overlay drafts; `retireSeasonTasksExcept` called with their keys; overlay `adjusted_phase 'dryness_attention'`.
  - overlay-rules: `adjusted_phase uses the care phase when there is one` (`flowering_with_dryness_attention`), else `dryness_attention`.
  - reviewed-care trees: existing tests pass with `care_status: 'reviewed'`.
- [ ] **Step 2: Run** `npx jest src/modules/seasonal` — Expected: FAIL.
- [ ] **Step 3: Implement** per the spec's Part B. The pack view is built from care (`carePhaseView`) or the `'coming'` constant — never from the row.
- [ ] **Step 4: Run** `npx jest src/modules/seasonal src/modules/plant-ledger` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(seasonal): care is coming instead of the season pack; overlay on every tree`.

### Task 6: AI context and seasonal-state endpoint; delete the hand-written guidance

**Files:**
- Modify: `plant-ledger/services/plant-record.service.ts` (`getSeasonalState`, `getContextForAi`), `plant-ledger/services/seasonal-intelligence.service.ts` (delete the guidance; keep only what the new view needs, or delete the service and its provider), `plant-ledger/plant-ledger.module.ts`, any vision prompt test that asserts `seasonal_state`
- Test: `plant-ledger/services/plant-record.service.spec.ts`, vision tests touched

**Interfaces:**
- Consumes: `careFor`, `carePhaseView`, `treeCareDue(...).thisMonth`.
- Produces: `type TreeSeasonView = { care_status: 'reviewed'; current_phase: string; upcoming_phase: string; avoid_now: string[]; watch_for: string[]; this_month: string[] } | { care_status: 'coming' }`.

- [ ] **Step 1: Failing tests:** AI context `a North India mango gets its care phase` (`care_status 'reviewed'`, phase from mango care); `a jamun gets 'coming' with no advice`; `a crop has no seasonal_state`; `a perennial flower keeps its bloom season` (unchanged); endpoint returns the same view for a tree.
- [ ] **Step 2: Run** `npx jest src/modules/plant-ledger src/modules/vision` — Expected: FAIL.
- [ ] **Step 3: Implement**; delete the generic/guava/citrus guidance and `inferTreeSeasonalState`.
- [ ] **Step 4: Run** `npx jest && npx jest -c test/jest-e2e.json && npm run lint && node scripts/check-module-imports.js && npx tsc --noEmit -p tsconfig.json` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(care): honest season view for the AI and seasonal-state; hand-written guidance removed`.

### Task 7: Web — "care is coming"

**Files:**
- Modify: `web/src/features/seasonal/api.ts` (`care_status: z.enum(['reviewed','coming']).nullish().transform(v => v ?? 'reviewed')`), `web/src/features/biography/sections/ThisSeason.tsx`, `web/src/features/biography/sections/AtAGlance.tsx`, `web/src/locales/en.json`, `web/src/locales/hi.json`
- Test: `web/src/features/biography/plant-detail.test.tsx`

Copy (exact):
- `biography.careComing` en: `"Care for {{name}} is coming. Until then, log what you see — it helps."` hi: `"{{name}} की देखभाल जल्द आ रही है। तब तक जो दिखे, वह लिखते रहें — इससे मदद मिलती है।"`

- [ ] **Step 1: Failing tests:** `shows care coming for a tree without reviewed care` (card with the plant's name and the log link, no avoid/watch lists); `hides the season line in At a glance for care coming`; `with a personal adjustment it shows only Now` (no "Next"); `missing care_status behaves as today`.
- [ ] **Step 2: Run** `cd web && npx vitest run src/features/biography` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `cd web && npm test && npm run lint && npx tsc -b` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): care is coming card; no season line without reviewed care`.

### Task 8: Docs

**Files:** `docs/deploy.md` (stage 4: release A and B order, new-field rule), `docs/data-polish-roadmap.md` (stage 4 status), `.claude/skills/add-plant/checklist-tree.md` (fallback is now "care coming", no season pack).

- [ ] **Step 1:** Edit; `grep -rn "season pack" .claude/skills/add-plant docs/deploy.md` — Expected: only historical mentions.
- [ ] **Step 2: Commit** `docs: stage 4 release order and fallback`.

## Finish

Final whole-branch review (most capable model), fix pass, then release A and B as the owner says.
