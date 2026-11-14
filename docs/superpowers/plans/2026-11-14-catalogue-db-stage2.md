# Catalogue in the database — stage 2 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fruit types (with their name-matching aliases and life profiles), the add-tree search entries and the perennial flowers are read from Postgres instead of code. They are filled by the catalogue push, which replaces the boot-time fill of `plant_catalog_entries`, and users see no change.

**Architecture:** Stage 1's `catalogue` module gains three record kinds: `FruitType`, `FruitPlant` (one add-tree search entry) and `PerennialFlower`. Each has seed files, a table, push support and lookups on the `Catalogue` snapshot. Consumers get the snapshot from `CatalogueStore`:
- `SpeciesNormalizationService` hands out a sync `SpeciesResolver` bound to one snapshot.
- Life profiles, flower care and bloom status read the snapshot.
- Plant search ranks `catalogue.searchEntries()` in memory.

`PlantsService.bootstrapCatalog` and `CatalogRepository` go away. The `plant_catalog_entries` table stays, unused, until a later cleanup migration.

**Tech Stack:** NestJS 11, Prisma 6 (Neon Postgres), zod 4, nestjs-pino.

**Spec:** `docs/superpowers/specs/2026-11-14-catalogue-in-database-design.md` (stage 2 row; "The existing catalogue table")

## Global Constraints

- Code meets `docs/coding-principles.md`; review against its §8 checklist.
- No user-visible change:
  - the same search results in the same order;
  - the same family for every tree and flower;
  - the same life profiles, flower care tasks (titles, months, `sourceKey`s) and bloom labels.
- Status rules, as in stage 1: lists and search show `APPROVED` only. Lookups by key find `APPROVED` and `RETIRED`, and so does name matching, because a user's existing tree is re-matched on every read. `DRAFT` is found by nothing.
- The push never deletes or retires anything by itself. It stops with nothing written if the database holds a key the seed lacks, and bumps the version only when something changed.
- The API refuses to start with no approved fruit types or no approved perennial flowers. This is in addition to stage 1's crop check.
- Logic stays in code: `flowerCareDue`, `bloomStatus`, `FLOWER_CLEANUP_SQL`, the care engine, `species-config.ts` (cycle start months) and the search scoring.
- Old constants stay until stage 2 is live, then go in Task 7.
- Deploy order: migration → push → API deploy. No web change is needed: a search item's `id` becomes the entry key (`mango:malda`), and the web uses `id` only as a React key.
- The owner runs the migration and the push.
- Work on branch `catalogue-db-2`, merged to `main` after the final review.

## Review Focus

1. **Retired fruit type.** A tree whose fruit type is set `RETIRED` keeps its family, life profile and care, and the type disappears from search (Task 3 test).
2. **Search ties.** Entries with equal scores keep today's order: confidence descending, then display name. Postgres sorted that by collation; JS must give the same order for every query in the parity set (Task 5 parity e2e).
3. **Flower alias precedence.** "china rose" still resolves to hibiscus and "desert rose" to adenium, not rose: longest alias first, whatever the row order in the database (Task 3 test).
4. **Fruit alias precedence.** The first fruit type in seed order whose alias matches wins, as `Object.entries(familyAliases)` did. `sort_order` must keep that order (Task 1 parity test over every alias).
5. **Live pickup.** A new fruit entry pushed while the API runs is searchable within about a minute. The old 10-minute search cache must not hold it back (Task 5 e2e).

---

### Task 1: Types, schemas, seed files and the parity test

**Files:**
- Modify: `backend/src/modules/catalogue/domain/types.ts`, `domain/schemas.ts`, `seed/index.ts`, `index.ts`
- Create: `backend/src/modules/catalogue/seed/fruit-types.seed.ts`, `fruit-plants.seed.ts`, `perennial-flowers.seed.ts`
- Test: `backend/src/modules/catalogue/domain/parity-stage2.spec.ts`; extend `domain/catalogue.spec.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `LifeProfile` (move today's shape unchanged: `first_fruit_months`, `productive_until_months`, `lifespan_months` as `[number, number]` in months, `note_key: string | null`).
  - `FruitTypeInfo { key: string /* species_family, e.g. 'mango' */; match_aliases: string[]; life: LifeProfile }`.
  - `FruitPlantInfo { key: string /* family, or family:variety */; species_family: string; species: string; variety: string | null; display_name: string; plant_type: string; aliases: string[]; languages: Record<string, string[]> | null; regions: string[]; confidence_weight: number }`.
  - `PerennialFlower` (move today's shape and `CareItem`/`CareCategory`) plus `note_key: string | null`.
  - `SearchEntry = FruitPlantInfo` (flowers are mapped into the same shape).
  - Seeds: `FruitTypeSeed = FruitTypeInfo & { status; notes }`, `FruitPlantSeed = FruitPlantInfo & { status; notes }`, `PerennialFlowerSeed = PerennialFlower & { status; notes }`.
  - `CatalogueSeed` gains `fruitTypes`, `fruitPlants`, `perennialFlowers`.
- Produces (`schemas.ts`): strict zod schemas for the three seeds. `validateSeed` also checks:
  - unique keys per kind;
  - a fruit plant's key is `species_family` or `species_family:variety`;
  - a served fruit plant names a served fruit type;
  - no alias is shared by two perennial flowers;
  - care months are 1–12, bloom windows 1–12, and ranges have min ≤ max.

- [ ] **Step 1: Write the failing parity test** `parity-stage2.spec.ts`, against today's constants:
  - **Fruit plants:** `CATALOGUE_SEED.fruitPlants` minus `status`/`notes`/`key` deep-equals `FRUIT_CATALOGUE` mapped to `FruitPlantInfo` (`variety ?? null`, `languages ?? null`, `regions ?? []`, `confidence_weight ?? 0.5`), in order.
  - **Fruit types:**
    - `fruitTypes.map(t => t.key)` equals the keys of the old `familyAliases` in insertion order.
    - Each `match_aliases` equals its old alias list.
    - Each `life` equals `lifeProfileFor(key)`.
  - **Perennial flowers:**
    - The seed minus `status`/`notes`/`note_key` deep-equals `PERENNIAL_FLOWERS`.
    - `note_key` is `'periwinkle'` for periwinkle and `null` otherwise.
  - **Matching:** for every alias of every old family, `new SpeciesNormalizationService().resolveSpeciesFamily({ species: alias })` equals the first seed fruit type whose `match_aliases` contain that alias as whole words. This pins the order (Review Focus 4).
- [ ] **Step 2: Extend `catalogue.spec.ts`.** `validateSeed` rejects each of these with `CATALOGUE_INVALID`:
  - a fruit plant naming a missing fruit type;
  - a fruit plant with key `mango:dasheri` but `variety: 'langra'`;
  - two flowers sharing the alias `rose`;
  - a care month of 13.
- [ ] **Step 3: Run** `cd backend && npx jest src/modules/catalogue`. Expected: FAIL (seed fields missing).
- [ ] **Step 4: Generate the three seed files** with a one-off script in the scratchpad (not committed). Then extend `types.ts`, `schemas.ts`, `seed/index.ts` and the barrel. The script writes:
  - `FRUIT_CATALOGUE` order, with `key`;
  - fruit types in `familyAliases` order, with `life` from `lifeProfileFor`;
  - `PERENNIAL_FLOWERS` order, with `note_key`;
  - all with `status: 'APPROVED'`, and `notes` from the source comments (the life-profile header source line goes on every fruit type).

  Format with prettier.
- [ ] **Step 5: Run** `npx jest src/modules/catalogue`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(catalogue): seed for fruit types, add-tree entries and perennial flowers`.

### Task 2: Tables, repository and push

**Files:**
- Modify: `backend/prisma/schema.prisma`; create migration `backend/prisma/migrations/20261115120000_catalogue_fruit_flowers/migration.sql` (generate it with `prisma migrate diff` from the current schema, as in stage 1; never reset the dev database)
- Modify: `backend/src/modules/catalogue/catalogue.repository.ts`, `push/catalogue-push.service.ts`
- Modify: `backend/test/e2e/fixtures.ts` only if a new table name escapes the `catalogue\_%` exclusion (it shouldn't)
- Test: extend `test/e2e/catalogue-repository.e2e-spec.ts`, `catalogue-push.e2e-spec.ts`; extend `catalogue.repository.spec.ts`

**Interfaces:**
- Consumes: Task 1 seed types.
- Produces (new tables, all with `status CatalogueStatus default DRAFT`, `sort_order int`, `data jsonb`, `notes text?` and timestamps, plus an index on `(status, sort_order)`):
  - `catalogue_fruit_types` (`key` PK);
  - `catalogue_fruit_plants` (`key` PK, `species_family` text);
  - `catalogue_perennial_flowers` (`family` PK).
- Produces (repository):
  - `loadSeed(statuses)` also returns `fruitTypes`, `fruitPlants` and `perennialFlowers`, ordered by `sort_order`.
  - `applyPush` takes the three new ordered lists and upserts them in the same transaction.
- Produces (push): `PushReport` gains `fruitTypes`, `fruitPlants` and `perennialFlowers` as `ItemOutcome[]`. Missing-from-seed checking and change detection (including `sort_order`) cover the new kinds.

- [ ] **Step 1: Write failing e2e tests.**
  - Pushing `CATALOGUE_SEED` reports each new kind `added`, then `unchanged` on a second run, with the version unchanged.
  - A database fruit plant absent from the seed gives `CATALOGUE_MISSING_FROM_SEED` and leaves every table unchanged.
  - Editing one flower's care reports only it as `changed`.
  - `loadSeed(['APPROVED'])` round-trips a DRAFT flower as absent.
- [ ] **Step 2: Run** `cd backend && npm run test:e2e -- catalogue`. Expected: FAIL.
- [ ] **Step 3: Implement.** Write the schema models and migration (it only creates the three tables), then extend the repository and push service.
- [ ] **Step 4: Run** `npm run test:e2e -- catalogue` and `npx jest src/modules/catalogue`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): tables and push for fruit types, add-tree entries and perennial flowers`.

### Task 3: Snapshot lookups and the store

**Files:**
- Modify: `backend/src/modules/catalogue/domain/catalogue.ts`, `catalogue.store.ts`, `testing.ts`
- Test: extend `domain/catalogue.spec.ts`, `catalogue.store.spec.ts`

**Interfaces:**
- Produces (`Catalogue`):
  - `fruitType(key: string | null | undefined): FruitTypeInfo | null` finds APPROVED and RETIRED.
  - `fruitFamilyIn(haystack: string): { family: string; alias: string } | null` returns the first type in seed order (APPROVED and RETIRED) with an alias present as whole words, using today's `hasWords` rule.
  - `perennialFlower(family: string | null | undefined): PerennialFlower | null` finds APPROVED and RETIRED.
  - `flowerFamilyIn(text: string): string | null`: longest alias first, over APPROVED and RETIRED, with today's normalisation.
  - `lifeProfile(family: string | null | undefined): LifeProfile | null`: a fruit type's `life`, or for a perennial flower `{ first_fruit_months: first_bloom_months, productive_until_months: lifespan_months, lifespan_months, note_key }`.
  - `searchEntries(): SearchEntry[]`: APPROVED fruit plants, plus APPROVED flowers mapped as `bootstrapCatalog` maps them today:
    - `plant_type: 'perennial_flower'`;
    - display name capitalised;
    - Latin aliases go to `aliases`, Devanagari to `languages.hi`;
    - `confidence_weight: 0.85`;
    - key = family.

    The result is sorted by `confidence_weight` descending, then `display_name` by `localeCompare(…, 'en')`, and computed once per snapshot.
- Produces (store): startup fails with `CatalogueUnavailableError` when no fruit type or no perennial flower is approved. The load log also carries `fruitTypeCount` and `flowerCount`; add both to the log-field allowlist with a test.

- [ ] **Step 1: Write failing unit tests.**
  - A RETIRED fruit type: `fruitType` and `lifeProfile` find it, `fruitFamilyIn('my mango tree')` still returns it, and `searchEntries()` lacks its plants.
  - A DRAFT flower is found by nothing.
  - `flowerFamilyIn('china rose')` returns `'hibiscus'` and `flowerFamilyIn('desert rose')` returns `'adenium'`, even when the seed lists rose first.
  - `lifeProfile('periwinkle').note_key === 'periwinkle'`.
  - The store refuses to start with no approved perennial flowers.
- [ ] **Step 2: Run** `npx jest src/modules/catalogue`. Expected: FAIL.
- [ ] **Step 3: Implement** the lookups and the store checks.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(catalogue): fruit, flower and life-profile lookups`.

### Task 4: Plant ledger and seasonal read from the snapshot

**Files:**
- Modify: `plant-ledger/services/species-normalization.service.ts`, `lifecycle.service.ts`, `plant-record.service.ts`, `cycle.service.ts`, `seasonal-intelligence.service.ts`, `processors/task.processor.ts`, `seasonal/seasonal.service.ts`, `plant-ledger/domain/flower-care.ts` (logic only: types now come from the catalogue), the modules that import `CatalogueModule`
- Test: the existing specs of these services, updated to use `seededCatalogueStore()`

**Interfaces:**
- Consumes: Task 3 `Catalogue` lookups and `CatalogueStore.snapshot()`.
- Produces: `SpeciesNormalizationService.resolver(): Promise<SpeciesResolver>`. `SpeciesResolver` has `family(input: TreeIdentityInput): string` and `classificationBasis(input): string`, with today's rules: FLOWER records use `flowerFamilyIn`, falling back to `'generic_flower'`; otherwise `fruitFamilyIn`, falling back to `'generic_perennial'`.
- A caller takes one resolver or snapshot per request or job and passes it down; never one per plant in a loop.
- `lifeProfileFor`, `perennialFlower` and `flowerFamilyIn` imports become snapshot calls.

- [ ] **Step 1: Update the specs first.** Make the service specs build with `seededCatalogueStore()` and call the new async APIs. Add one test that a FLOWER record named "my desert rose" resolves to `adenium` through `resolver()`.
- [ ] **Step 2: Run** `npx jest src/modules/plant-ledger src/modules/seasonal`. Expected: FAIL (APIs missing).
- [ ] **Step 3: Implement** the switch. `familyAliases` and the module-level `ALIASES` are no longer read but stay until Task 7.
- [ ] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: all pass, and the e2e results for flowers, lifecycle and trees are unchanged.
- [ ] **Step 5: Commit** `feat(plant-ledger): families, life profiles and flower care come from the catalogue`.

### Task 5: Plant search reads the catalogue; the boot-time fill goes

**Files:**
- Modify: `plants/plants.service.ts`, `plants/plants.module.ts`
- Delete: `plants/catalog.repository.ts`, `plants/catalog.repository.spec.ts`
- Test: `test/e2e/catalogue.e2e-spec.ts` (rewrite), new `test/e2e/plant-search-parity.e2e-spec.ts`

**Interfaces:**
- Consumes: `Catalogue.searchEntries()`.
- `rankEntries` takes `SearchEntry[]`. `toSearchItem` returns `id: entry.key`. `onModuleInit`, `bootstrapCatalog`, `CATALOGUE_CACHE_MS` and the `cached` field are removed.

- [ ] **Step 1: Write the parity e2e first, while the old path still exists.**
  - `plant_catalog_entries` is filled by the app's boot fill, which is still present at this point.
  - For each query, assert that the old `search` and `resolve` results equal the new results computed from `Catalogue.searchEntries()` with the same scoring, ignoring `id`.
  - Queries: `aam`, `mango`, `dasheri`, `आम`, `nimbu`, `lemon`, `rose`, `gulab`, `china rose`, `mogra`, `ber`, `mulberry`, `kela`, `g9`, `jamun`, `xyz`.

  Keep the test as a one-commit checkpoint, then turn it into fixed expectations in Step 4.
- [ ] **Step 2: Rewrite `catalogue.e2e-spec.ts`.**
  - Search reads the pushed catalogue.
  - A fruit plant pushed while the app runs is found within the store's check interval: advance the injected clock by 61 s.
  - Restarting the app writes nothing to `plant_catalog_entries`.
- [ ] **Step 3: Run** `npm run test:e2e -- catalogue plant-search`. Expected: FAIL.
- [ ] **Step 4: Implement**, then replace the parity test's old-path half with the recorded results: the `display_name` order per query, written into the spec.
- [ ] **Step 5: Run** `npm test` and `npm run test:e2e`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(plants): add-tree search reads the catalogue; no boot-time fill`.

### Task 6: Docs and the playbook

**Files:** `docs/deploy.md` (stage 2 order: migration → push → API deploy; search ids change, no web change), `.claude/skills/add-plant/checklist-tree.md` (items 1–3 become seed edits + push; species-config and care files unchanged), `checklist-perennial-flower.md`, `docs/data-polish-roadmap.md` (catalogue note: stage 2 done).

- [ ] **Step 1:** Edit the files.
- [ ] **Step 2:** Commit `docs(catalogue): stage 2 push and playbook`.

### Task 7 (after stage 2 is live): remove the old constants

**Files:**
- Delete: `plants/domain/fruit-catalogue.ts`, `plant-ledger/domain/species-life-profiles.ts`
- Modify: `flower-care.ts` (drop the `PERENNIAL_FLOWERS` data, `perennialFlower` and `flowerFamilyIn`), `species-normalization.service.ts` (drop `familyAliases`), `plant-ledger/index.ts` exports
- Tests: `fruit-catalogue.spec.ts`, `species-life-profiles.spec.ts`, `flower-care.spec.ts`, `care-completeness.spec.ts` and `bearing.spec.ts` read the seed through `Catalogue.from(validateSeed(CATALOGUE_SEED), 1)`; delete `parity-stage2.spec.ts`.

- [ ] **Step 1:** Repoint the specs to the seed. Run `npm test`. Expected: PASS while the constants still exist.
- [ ] **Step 2:** Delete the constants. Run `npm test`, `npm run test:e2e` and `npm run lint`. Expected: PASS and clean.
- [ ] **Step 3:** Commit `refactor(catalogue): drop the code copies of fruit, life-profile and flower data`.
