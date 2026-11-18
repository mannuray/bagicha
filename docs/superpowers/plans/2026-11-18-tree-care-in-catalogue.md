# Tree care in the catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the six tree-care calendars from plant-ledger code into the catalogue (Neon, filled by the catalogue push). Then add citrus care split by kind, through the add-plant playbook.

**Architecture:** A new catalogue record type, `treeCare`, follows the pattern of stage 2 (fruit types, flowers). It is a strict zod schema, a `catalogue_tree_care` table, repository load and write, push kind, and `Catalogue.treeCare()`. The care engine (`plant-ledger/domain/care/engine.ts`, `region-care.ts`) does not change. Its two callers (`SeasonalService`, `TaskProcessor`) read care from the catalogue snapshot instead of the `TREE_CARE_REGISTRY` token. Release 2 adds optional `kinds` and a kind matcher. A citrus tree of a known kind gets that kind's care, passed to the engine as its own `FamilyCare`.

**Tech Stack:** NestJS 11, Prisma 6 (Postgres/Neon), zod 4, Jest (unit + e2e).

**Spec:** `docs/superpowers/specs/2026-11-18-tree-care-in-catalogue-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md`. Review against its §8 checklist.
- The six existing calendars move **word for word**. Task keys stay `${family}:${item.key}:${YYYY-MM-DD}`.
- Sibling modules import catalogue only from `backend/src/modules/catalogue/index.ts`.
- Catalogue schemas are `.strict()`. A push carrying a new field goes **after** the code that knows it.
- Release 1 order: migration → catalogue push → push `main` → Render deploy. Release 2: deploy code → push citrus.
- No citrus data file is written before the owner's explicit yes on the reviewed content (add-plant playbook, `.claude/skills/add-plant/SKILL.md`).
- Never echo the Neon connection string. Mask with `sed -E 's#://([^:]+):[^@]+@#://\1:***@#g'`. Commit, push, migrate and catalogue-push only when the user says so.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A tree whose care goes away (variety cleared, family retired, region moved to pending) has its pending care reminders cancelled, not left beside season-pack tasks. Covered by Task 5.
2. Pushing care rows while the old code is live must not change anything the old code serves. Covered by Task 6's order. The old code never reads the table.
3. A store boot with zero approved tree-care records refuses to start, like the other kinds. A reload with a bad care record keeps the previous snapshot. Covered by Task 3's store spec.
4. A citrus tree named in Hindi script (कागज़ी) or with words in two fields (species "Lemon", variety "Kagzi") gets the right kind or none. It never gets another kind's care. Covered by Task 7.
5. Changing a citrus tree's variety from one kind to another cancels the old kind's reminders, and no duplicates appear. Covered by Task 7's e2e.

---

## Release 1: the move

### Task 1: Tree-care types and schema in the catalogue

**Files:**
- Create: `backend/src/modules/catalogue/domain/tree-care.ts` (types)
- Create: `backend/src/modules/catalogue/domain/tree-care.schema.ts` (zod plus cross-record checks)
- Test: `backend/src/modules/catalogue/domain/tree-care.schema.spec.ts`
- Modify: `backend/src/modules/catalogue/domain/types.ts` (`CatalogueSeed.treeCare`), `domain/schemas.ts` (`seedSchema`, `validateSeed`), `seed/index.ts` (`treeCare: []` for now), `index.ts` (exports)
- Modify: `backend/src/modules/plant-ledger/domain/care/types.ts`. It becomes a re-export of the catalogue types under the engine's current names, so `engine.ts`, `region-care.ts` and `build.ts` compile unchanged.

**Interfaces:**
- Produces, in `catalogue/domain/tree-care.ts`, the current types moved verbatim: `CareStage`, `MonthDay`, `Anchor`, `Dose`, `DosePart`, `PhaseWindow`, `RegionCare`, `FamilyCare`. Renamed to avoid clashing with the flower `CareItem`/`CareCategory` already in the catalogue: `TreeCareItem` (was `CareItem`) and `TreeCareCategory` (was `CareCategory`).
- `TreeCareSeed = FamilyCare & { status: CatalogueStatus; notes: string | null }`, keyed by `family`.
- `CatalogueSeed.treeCare: TreeCareSeed[]`.
- `treeCareSeedSchema` (strict) and `treeCareIssues(seed: CatalogueSeed): string[]`, called from `validateSeed`.
- The catalogue index exports `TreeCareSeed`, `FamilyCare`, `RegionCare`, `TreeCareItem`, `TreeCareCategory`, `CareStage`, `Anchor`, `MonthDay`, `PhaseWindow`, `Dose`, `DosePart`.

- [ ] **Step 1: Write the failing tests** in `tree-care.schema.spec.ts`. Start from a minimal valid family fixture (one region, one CALENDAR item, one phase) and test via `validateSeed({ ...CATALOGUE_SEED, treeCare: [fixture] })`:
  - `accepts a valid family`
  - `rejects an unknown field` (strict): `{ ...fixture, extra: 1 }` throws
  - `rejects month 13 and day 31 in April`
  - `rejects a title over 60 characters`
  - `rejects zero grams and zero maxAgeYears in a dose`
  - `rejects a sameAs chain` (A sameAs B, B sameAs C) and `a sameAs to a region with no care`
  - `rejects a grownIn region with neither care nor pendingRegions`
  - `rejects the same item key with the same window start in one region`, and `accepts the same key with different starts` (this is how `groupCare` expands several windows)
  - `rejects a care record whose family is not a fruit type in the seed`
  - `rejects two records for one family`
- [ ] **Step 2: Run them.** `cd backend && npx jest src/modules/catalogue/domain/tree-care.schema.spec.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the types, the schema and `treeCareIssues`. Add `treeCare: z.array(treeCareSeedSchema)` to `seedSchema`, call `treeCareIssues` in `validateSeed`, and set `CATALOGUE_SEED.treeCare = []`. `FROM_PLANTING` and `FROM_CHOICE` anchors stay in the schema, because the types allow them. Replace `plant-ledger/domain/care/types.ts` with `export type { TreeCareItem as CareItem, TreeCareCategory as CareCategory, … } from '../../../catalogue';`.
- [ ] **Step 4: Run** the spec plus `npx jest src/modules/catalogue src/modules/plant-ledger/domain/care` and `npx tsc --noEmit -p tsconfig.json`. Expected: all PASS, no type errors.
- [ ] **Step 5: Commit.** `feat(catalogue): tree-care record type and checks`

### Task 2: Store and push tree-care records

**Files:**
- Modify: `backend/prisma/schema.prisma`. Add model `CatalogueTreeCare` (`family String @id`, `status CatalogueStatus @default(DRAFT)`, `data Json`, `notes String?`, `created_at`, `updated_at`, `@@map("catalogue_tree_care")`), following `CatalogueCareStep`.
- Create: `backend/prisma/migrations/20261118120000_catalogue_tree_care/migration.sql` (via `npx prisma migrate dev --create-only --name catalogue_tree_care`, then rename the folder to this timestamp)
- Modify: `catalogue/catalogue.repository.ts` (`CatalogueWrite.treeCare`, `loadSeed`, `applyPush`), `catalogue/push/catalogue-push.service.ts` (`PushReport.treeCare`, `KINDS.treeCare = { keyOf: (c) => c.family, ordered: false }`), `push/push.main.ts` if it prints per kind
- Test: `backend/test/e2e/catalogue-repository.e2e-spec.ts`, `test/e2e/catalogue-push.e2e-spec.ts`

**Interfaces:**
- Consumes: `TreeCareSeed`, `CatalogueSeed.treeCare` (Task 1).
- Produces: `repo.loadSeed(statuses)` returns `treeCare: TreeCareSeed[]` ordered by family. `push()` reports `treeCare: ItemOutcome[]`.

- [ ] **Step 1: Write the failing e2e tests:**
  - repository: `round-trips a tree-care record` (write via `applyPush`, read via `loadSeed(['APPROVED'])`, deep-equal)
  - push: `adds, then leaves unchanged, a tree-care record`, and `refuses a seed missing a stored tree-care record` (`CATALOGUE_MISSING_FROM_SEED` with `treeCare: ['<family>']`)

  Use a fixture family whose key is a real fruit type (e.g. `mango`).
- [ ] **Step 2: Run them.** `cd backend && npm run test:e2e -- catalogue-repository catalogue-push`. Expected: FAIL (no table or property).
- [ ] **Step 3: Implement** the model, the migration, and the repository and push changes. `data` holds everything except `family`, `status` and `notes`, as with flowers.
- [ ] **Step 4: Run** the two e2e files, then the whole e2e suite. Expected: PASS. If you see 429s from back-to-back runs, wait 65 s and rerun.
- [ ] **Step 5: Commit.** `feat(catalogue): store and push tree care`

### Task 3: The six calendars as seed data, served by the catalogue

**Files:**
- Create: `backend/src/modules/catalogue/seed/tree-care/` containing `build.ts` (copy of `plant-ledger/domain/care/build.ts`), `mango.seed.ts`, `guava.seed.ts`, `litchi.seed.ts`, `sapota.seed.ts`, `jackfruit.seed.ts`, `amla.seed.ts` (copies of the data files with imports repointed to `../../domain/tree-care` and `./build`, each exporting a `TreeCareSeed` with `status: 'APPROVED'`, `notes: null`), and `index.ts` (`TREE_CARE_SEED: TreeCareSeed[]`, plus `CARE_PENDING` copied from `plant-ledger/domain/care/index.ts`)
- Modify: `catalogue/seed/index.ts` (`treeCare: TREE_CARE_SEED`), `catalogue/domain/catalogue.ts`, `catalogue/catalogue.store.ts`, `catalogue/index.ts` (export `CARE_PENDING`)
- Test: `catalogue/seed/tree-care/equivalence.spec.ts` (temporary: deleted in Task 4), `catalogue/domain/catalogue.spec.ts`, `catalogue/catalogue.store.spec.ts`

**Interfaces:**
- Consumes: Task 1 types and schema, and Task 2 persistence.
- Produces:
  - `Catalogue.treeCare(family: string | null | undefined): FamilyCare | null`. Serves APPROVED records only. A RETIRED record returns null.
  - `approvedCounts()` gains `treeCare: number`.
  - `CatalogueStore.load` throws `CatalogueUnavailableError` when `treeCare === 0`.
  - `CARE_PENDING: readonly string[]` exported from the catalogue index.

- [ ] **Step 1: Write the failing tests:**
  - `equivalence.spec.ts`: for each family in `TREE_CARE` (imported from the old plant-ledger code for now), `JSON.parse(JSON.stringify(seededCatalogue().treeCare(family)))` deep-equals `JSON.parse(JSON.stringify(TREE_CARE[family]))`, and the family sets are equal.
  - `catalogue.spec.ts`: `treeCare serves approved care`, `treeCare is null for a retired record and an unknown family`.
  - `catalogue.store.spec.ts`: `refuses to load with no approved tree care` (repo returns a seed with `treeCare: []`), and `keeps the previous snapshot when a reload has an invalid care record` (second load returns a record with month 13).
- [ ] **Step 2: Run them.** `npx jest src/modules/catalogue`. Expected: FAIL.
- [ ] **Step 3: Implement.** Copy the files (`cp`, then fix imports). Do not delete the plant-ledger originals yet. Add `treeCare` to `Catalogue.from` (a `Map<family, FamilyCare>` of APPROVED records with `status` and `notes` stripped), the store guard and the log field `treeCareCount`.
- [ ] **Step 4: Run** `npx jest` (the whole unit suite) and `npm run test:e2e`. Expected: PASS. The e2e global setup pushes `CATALOGUE_SEED`, which now includes care, so the store guard passes.
- [ ] **Step 5: Commit.** `feat(catalogue): tree care for six fruits as seed data, word for word`

### Task 4: Care read from the catalogue; old code removed

**Files:**
- Modify: `backend/src/modules/seasonal/seasonal.service.ts`. Drop `@Inject(TREE_CARE_REGISTRY) careRegistry`. `careOf(plant, species, catalogue)` uses `catalogue.treeCare(species.family(plant))`, with the catalogue taken from the `snapshot()` already loaded in `loadIntelligence` and the other paths.
- Modify: `backend/src/modules/plant-ledger/processors/task.processor.ts`. Replace the registry with `CatalogueStore` and use `(await this.catalogue.snapshot()).treeCare(family)`.
- Modify: `plant-ledger/plant-ledger.module.ts`, `plant-ledger/index.ts` (stop exporting `TREE_CARE`, `careFor`, `CARE_PENDING`, `TREE_CARE_REGISTRY`), `plant-ledger/domain/care/index.ts` (engine exports only)
- Delete: `plant-ledger/domain/care/{registry,build,mango,guava,litchi,sapota,jackfruit,amla}.ts`, `catalogue/seed/tree-care/equivalence.spec.ts`
- Modify (keep in plant-ledger): `plant-ledger/domain/care/{mango,guava,litchi,sapota,jackfruit,amla}.spec.ts`. Each reads its family as `seededCatalogue().treeCare('<family>')!` (from `catalogue/testing.ts`) instead of the deleted constant.
- Modify: `backend/src/modules/plants/domain/care-completeness.spec.ts`. Read `CATALOGUE_SEED.treeCare` (APPROVED) and `CARE_PENDING` from the catalogue. Same five assertions.
- Modify: `backend/test/e2e/tree-care.e2e-spec.ts`. Replace `overrideProvider(TREE_CARE_REGISTRY)` with `overrideProvider(CatalogueStore).useValue(seededCatalogueStore({ ...CATALOGUE_SEED, treeCare: [{ ...FIXTURE, status: 'APPROVED', notes: null }] }))`, plus any other spec or e2e that used the token (`grep -rn TREE_CARE_REGISTRY backend`).

**Interfaces:**
- Consumes: `Catalogue.treeCare`, `CARE_PENDING`, `seededCatalogue`, `seededCatalogueStore` (Task 3).
- Produces: no plant-ledger export of care data. Care comes only from the catalogue.

- [ ] **Step 1: Point the tests at the new source first** (per-fruit specs, completeness spec, tree-care e2e override). Run `npx jest src/modules/plant-ledger src/modules/plants`. Expected: PASS (both sources still exist). This proves the specs now test the catalogue data.
- [ ] **Step 2: Switch the services, delete the old files and the equivalence spec,** and update module wiring and exports.
- [ ] **Step 3: Run** `npx tsc --noEmit`, `npx jest`, `npm run test:e2e`, and `grep -rn "TREE_CARE\b\|careFor\|TREE_CARE_REGISTRY" backend/src backend/test`. Expected: all PASS. The grep finds only `TaskSource.TREE_CARE` uses.
- [ ] **Step 4: Commit.** `refactor(plant-ledger): tree care comes from the catalogue`

### Task 5: Cancel care reminders when a tree's care goes away

**Files:**
- Modify: `backend/src/modules/seasonal/seasonal.service.ts`. Where it now calls `retireCareTasksExcept` only `if (careDue)`, call `retireCareTasksExcept(userId, plantId, careDue?.current ?? [])` always.
- Test: `backend/test/e2e/tree-care.e2e-spec.ts`

- [ ] **Step 1: Write the failing e2e** `cancels a tree's care reminders when its care goes away`. A mango tree in the fixture region opens its intelligence, so care reminders exist. Then rebuild the app with a store whose seed has the fixture mango care RETIRED. Opening the tree again leaves zero pending `TREE_CARE` tasks and some season-pack tasks.
- [ ] **Step 2: Run it.** Expected: FAIL (care tasks still pending).
- [ ] **Step 3: Implement** the one-line change.
- [ ] **Step 4: Run** `npm run test:e2e -- tree-care` and the full suites. Expected: PASS.
- [ ] **Step 5: Commit.** `fix(seasonal): cancel care reminders when a tree's care goes away`

### Task 6: Release 1 docs and ship (stops for the user)

**Files:** `docs/deploy.md` (care is now part of the catalogue push; a new table means migration first), `docs/data-polish-roadmap.md` (stage 3 release 1 status)

- [ ] **Step 1:** Update both docs and commit (`docs: tree care in the catalogue push`).
- [ ] **Step 2: STOP and ask the user** to run, in order: the migration (`docker build --no-cache --target migrate`, then run it with their `NEON_URL`), then the catalogue push (`docker build --target catalogue-push -t bagicha-catalogue-push .`, then run it). Expect the report to show `treeCare` with six `added`.
- [ ] **Step 3:** On the user's word: `git push origin main` and `render deploys create srv-dbq3qch5efls739jf6l0 --commit <sha> --confirm`. Verify with `curl https://bagicha-api.onrender.com/api/v1/health`. The Render log must show `treeCareCount: 6`.

---

## Release 2: citrus by kind

### Task 7: Kinds in the schema and the kind matcher

**Files:**
- Modify: `catalogue/domain/tree-care.ts`. Add `CareKind { key: string; label: string; words: string[]; grownIn: RegionCluster[]; regions: FamilyCare['regions']; pendingRegions?: RegionCluster[] }` and `FamilyCare.kinds?: CareKind[]`.
- Modify: `catalogue/domain/tree-care.schema.ts`. Add the kind rules.
- Create: `catalogue/domain/care-kind.ts` with `careForTree(care: FamilyCare, tree: TreeWords): FamilyCare | null`, where `TreeWords = { variety?: string | null; species?: string | null; name?: string | null }`
- Modify: `catalogue/domain/catalogue.ts` (`treeCareFor(family, tree): FamilyCare | null` = `treeCare(family)` passed through `careForTree`), `catalogue/index.ts`
- Modify: `seasonal/seasonal.service.ts`. `careOf` uses `catalogue.treeCareFor(species.family(plant), plant)`. `TaskProcessor` keeps `treeCare(family)` (existence only, as the spec decides).
- Modify: `docs/deploy.md`. Add the rollback rule from the spec: before a Render rollback past this release, push citrus care as DRAFT.
- Test: `catalogue/domain/care-kind.spec.ts`, `tree-care.schema.spec.ts`, `test/e2e/tree-care.e2e-spec.ts`

**Interfaces:**
- `careForTree` returns `care` unchanged when it has no `kinds`. Otherwise it returns the matched kind as `{ family: \`${care.family}:${kind.key}\`, sources: care.sources, grownIn: kind.grownIn, regions: kind.regions, pendingRegions: kind.pendingRegions }`, or `null` when no kind matches. Kind task keys therefore read `citrus:lime:<item>:<date>`.
- Matching checks `variety`, then `species`, then `name`. The first field containing any kind word decides. Within it, the word starting earliest wins. Words are whole-word and NFC, with Latin and Devanagari handled as `Catalogue` does (reuse its `latinWords`/`hindiWords`/`hasWords`, moved to a small shared file if needed).

- [ ] **Step 1: Write the failing tests.** Use a fixture citrus family with kinds `lime` (words `kagzi`, `कागज़ी`), `lemon` (`lemon`, `galgal`) and `mandarin` (`kinnow`, `nagpur`):
  - schema: `rejects a family with kinds and its own regions`, `rejects a word on two kinds`, `rejects duplicate kind keys`, `rejects a kind grownIn region with no care`
  - `care-kind.spec.ts`:
    - `variety beats species`: species `Lemon`, variety `Kagzi` gives lime
    - `Hindi script`: name `कागज़ी नींबू` gives lime
    - `earliest word in a field`: species `kinnow lemon` gives mandarin
    - `ambiguous only`: name `my nimbu plant` gives null
    - `no kinds`: mango care returned unchanged
    - `kind family key`: the returned care has family `citrus:lime`
  - e2e (fixture citrus via `seededCatalogueStore`):
    - `a Kagzi tree gets lime reminders`
    - `changing the variety to Kinnow cancels lime reminders and creates mandarin ones, no duplicates`
    - `clearing the variety cancels them and the tree gets season-pack tasks`
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx tsc --noEmit`, `npx jest`, `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit.** `feat(catalogue): care by kind within a fruit family`

### Task 8: Release 2 code ship (stops for the user)

- [ ] **Step 1: STOP and ask the user** to push `main` and deploy Task 7, then deploy. No catalogue push yet. Verify health. This must be live **before** any record with `kinds` is pushed.

### Task 9: Citrus care content (owner gate)

Follow `.claude/skills/add-plant/SKILL.md` with `checklist-tree.md`, `content-standard.md` and `sources.md`.

- [ ] **Step 1: Draft** citrus care per kind and per region. The draft covers:
  - which kinds exist and each kind's words (English and Devanagari), with ambiguous words (nimbu, nimboo, limbu, neembu, citrus, orange, santra, narangi) on no kind
  - whether `lemon` (what the plain add-tree entry saves) picks the lemon kind
  - the add-tree entry clean-up (malta and musambi off Lemon; split the plain entry into kind entries or not)

  Mark anything uncertain "(check)".
- [ ] **Step 2: Source check** with a research agent. Each row gets OK / corrected / removed with a link. Check chemicals against CIB&RC label claims for citrus (dose, waiting days). Apply the corrections.
- [ ] **Step 3: Owner review** in a Claude Doc (`review-templates.md`). **STOP until the owner says yes.** Nothing in Task 10 starts before that.

### Task 10: Citrus care data (after the yes)

**Files:**
- Create: `catalogue/seed/tree-care/citrus.seed.ts` (`kinds`, empty family `regions`, approved content only)
- Modify: `catalogue/seed/tree-care/index.ts` (add citrus; remove `'citrus'` from `CARE_PENDING`), `catalogue/seed/fruit-plants.seed.ts` (the approved entry clean-up)
- Modify: `plants/domain/care-completeness.spec.ts`. For a family with kinds, each add-tree entry's kind (via `careForTree` on its `species`/`variety`) must cover the entry's regions, or the entry resolves to no kind on purpose.
- Test: `catalogue/seed/tree-care/citrus.seed.spec.ts`. Every citrus add-tree entry resolves to the kind the review approved, or to null, as a table test.

- [ ] **Step 1: Write the failing tests** (the entry → kind table from the approved review, and per-kind completeness).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Transcribe** the approved content only.
- [ ] **Step 4: Run** `npx jest`, `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): citrus care by kind (owner-approved)` and update the roadmap.
- [ ] **Step 6: STOP and ask the user** to push `main` and run the catalogue push (Task 8 must be live). The report shows `treeCare` citrus `added`, plus the changed fruit-plant entries.
