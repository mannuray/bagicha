# Tree care in the catalogue (stage 3) — design

Date: 2026-11-18. Roadmap: `docs/data-polish-roadmap.md`, "Catalogue in the database", stage 3.

## Why

Tree care (month-by-month reminders, doses, pests, the "Now / Next / avoid / watch" panel) is
the last part of the tree catalogue still written as code: one TypeScript file per fruit in
`backend/src/modules/plant-ledger/domain/care/` (mango, guava, litchi, sapota, jackfruit, amla).
Adding a fruit's care therefore means new code and a Render deploy. Everything else in the
catalogue (crops, flowers, fruit types, add-tree entries) is a seed edit plus a catalogue push.

The owner wants care to work the same way, because care is the long-term job: about 30 fruits
are waiting (`CARE_PENDING`), added one by one through the add-plant playbook.

**Success:** adding a fruit's care is draft → source check → owner's yes → seed edit → catalogue
push → live within a minute, with no code change and no deploy.

## Scope, in order (owner's decision)

1. **Stage 3 (this design):** move the six calendars into the catalogue, then add **citrus** as
   the first fruit through the new routine. Citrus needs care split by kind (lime, lemon,
   orange…), which this design adds.
2. **Next, separate design:** papaya: reminders timed from the planting date (`FROM_PLANTING`
   exists in the types but nothing evaluates it).
3. **Then, separate design:** pomegranate: the gardener's bahar choice and reminders timed from
   it (`FROM_CHOICE`, same state).

## Goals

- Care data lives in the database, loaded by `CatalogueStore` like the rest of the catalogue.
- The six existing calendars move **word for word**. No gardener sees a difference; existing
  reminders keep their task keys, so nothing is duplicated or lost.
- Citrus care, source-checked and owner-approved, live through the new routine. Each tree gets
  the care for its kind.

## Non-goals

- New care content beyond citrus.
- Planting-timed or choice-timed reminders (papaya, pomegranate: steps 2 and 3).
- Hindi for care reminders and advice (Hindi round 2, after stages 3–4). The record shape
  leaves room for optional `hi` fields later, as other catalogue records have.
- Season guidance in the database (stage 4).
- Editing care anywhere but the seed files (no admin screen).

## Anti-goals (a failure even if it works)

- The live API crashing or losing care because data and code disagree (the 2026-11-15 Hindi
  outage). See "Release order".
- Any change in wording, timing or dose for the six existing fruits.
- Duplicate reminders for trees that already have care tasks.
- A citrus tree getting another kind's care, or a dose with no source behind it.

## What stays in code

The engine and its helpers: `engine.ts` (`treeCareDue`, `carePhaseView`), `region-care.ts`
(`resolveRegionCare`, `NEAREST_REGIONS`, `stageOf`, `careApplies`), dose by tree age, young vs
bearing. Only the data moves. The care types (`FamilyCare`, `RegionCare`, `CareItem`,
`PhaseWindow`, `Dose`, `Anchor`) move to the catalogue module's domain types, since the
catalogue now owns the shape. The plant-ledger engine imports them from there.

## What moves

- **Data:** each family's `FamilyCare` becomes a catalogue record, one per family, keyed by
  family (`mango`, `citrus`…). New table `catalogue_tree_care` (key, status, data Json, notes,
  timestamps), same pattern as `catalogue_care_steps`. Needs a Prisma migration.
- **Seed files:** `backend/src/modules/catalogue/seed/tree-care/<family>.seed.ts`, one per
  family. They keep using the existing authoring helpers (`groupCare`, `ItemSpec`, `PhaseSpec` in
  `build.ts`, which move alongside the seeds), so the files stay readable as verified tables.
  The seed exports the expanded `FamilyCare`, so the database holds the same shape the engine
  reads today and the engine logic does not change. *(Builder's call: storing the expanded form
  rather than the authored group form.)*
- **`CARE_PENDING`** moves next to the tree-care seed. It still only shrinks. The completeness
  test (`care-completeness.spec.ts`) is **rewritten**, not just moved: every fruit type has care or
  is pending, never both. Today it compares a family's `grownIn` with its add-tree entries'
  regions. For a family with kinds, it uses the kind matcher to compare each add-tree entry with
  its kind's `grownIn`. `validateSeed` also rejects a care record whose key isn't a fruit type in
  the seed.
- **Per-fruit specs** (`mango.spec.ts` …) stay in plant-ledger and import the seed data. Moving
  them into catalogue would make catalogue depend on the plant-ledger engine, which is the wrong
  way round.
- **Lookup:** `TREE_CARE`, `careFor` and the `TREE_CARE_REGISTRY` token are replaced by a
  catalogue snapshot method, e.g. `catalogue.treeCare(family): FamilyCare | null`. Used by
  `TaskProcessor` and `SeasonalService` (`getTreeIntelligence` and the other two call sites).
  Tests use `seededCatalogue` / `seededCatalogueStore` from `catalogue/testing.ts` instead of the
  registry token. Tests that used the token to supply a fixture family supply it through those
  helpers instead (for example, a seed override with the fixture care record).

## Validation (push and load)

A strict zod schema for the care record, like the other catalogue schemas, checked by
`validateSeed` on push and by the store on load:

- Months 1–12, days valid for the month; windows may cross New Year.
- Title at most 60 characters. Within a region, an item's key plus its window start is unique.
  One authored item with several windows expands into several items with the same key, which
  is how guava, litchi and jackfruit are written today. The task key already ends in the
  window's start date (`family:key:YYYY-MM-DD`).
- Doses: positive grams and `maxAgeYears`.
- `sameAs` points at a region that has its own care (no chains, one hop).
- Every region in `grownIn` has care or is in `pendingRegions`. For a family with kinds, this holds for each kind;
  the family's own `regions` is empty.
- Citrus kinds (below): kind keys unique; kind match words unique across kinds.
- **Status:** only APPROVED care records are loaded, as with the rest of the catalogue. A DRAFT
  record is not live. Retiring a family's care sends its trees back to the season pack.
- **Reload:** the store already validates every record when it reloads each minute. If a care
  record fails, the whole new snapshot is refused and the previous one stays live, as with the
  rest of the catalogue. At boot, a failing record stops the start.
- **Boot guard:** the store refuses to start when there are zero approved care records, the same
  rule as for crops and fruit types. It doesn't check which families are present.
  `CARE_PENDING` stays a constant in the seed folder, read only by the completeness test,
  which counts a family as having care when its seed record is APPROVED. *(My call: a stricter
  guard risks exactly the start-up crash the anti-goals forbid.)*

## Proving the move changed nothing

Before the old files are deleted, a test runs the new seed through `validateSeed` and a JSON
round trip (what the store actually serves), then compares it with the old `TREE_CARE` object,
family by family. They must be deep-equal. The existing per-fruit specs (`mango.spec.ts`
etc.) move with the data and keep passing. Task keys stay `family + item key`, as today.

## Citrus: care by kind

The catalogue has one `citrus` fruit type covering lime, lemon, orange (Nagpur, Darjeeling,
Kinnow…), sweet orange (mosambi, malta) and pomelo. Their care differs in timing, pruning and
feeding.

- A `FamilyCare` may carry optional **kinds**. Each kind has a key, a label, match words, and
  its own `regions` / `grownIn` / `pendingRegions`. A family with kinds has **no family-level
  care**: its `regions` is empty and the schema enforces that.
- **A kind's care replaces the family's care; it doesn't add to it.** A tree whose kind is
  known gets that kind's care alone, handed to the unchanged engine as its own `FamilyCare`
  with key prefix `citrus:<kind>`. Each kind's tables are complete on their own, so anything
  common is repeated in each kind, as the source tables give it. *(My call: it keeps the engine
  unchanged, as the goals require.)*
- A kind follows the same region rules as a family today. Outside its `grownIn`, the tree gets
  the nearest grown region's care with the "timings may differ" note. In a region in the kind's
  `pendingRegions`, the tree keeps the season pack.
- **Which kind a tree is:** check the tree's fields **one at a time**: variety first, then species,
  then name. The first field that contains any kind's words decides. Within that field, the word
  that appears earliest in the text wins. Matching is whole-word and NFC-normalised, like the
  species resolver. For example, species "Lemon" with variety "Kagzi" gives lime (from the
  variety), and "Kinnow" or "Nagpur" give mandarin/orange. This is deliberately not the
  resolver's join-then-first-type rule, which can hand a tree another kind's care. *(My call.)*
- **Ambiguous words pick no kind.** Words that mean more than one kind (nimbu, nimboo, limbu,
  neembu, citrus, orange, santra, narangi…) stay in the citrus fruit type's match words, so the
  tree is citrus, but they belong to no kind. Only specific words choose a kind (kagzi, kinnow,
  mosambi, Nagpur, galgal…). The word lists include Hindi-script words (कागज़ी, किन्नू, मौसमी…)
  and are part of the citrus content the owner reviews.
- **Add-tree entries must agree with the kinds.** Today the plain "Lemon / नींबू" entry
  (`fruit-plants.seed.ts`, key `citrus`) saves species `lemon` and is what a search for nimbu,
  narangi, musambi or malta finds. The citrus content step therefore also decides:
  - whether `lemon` (what that entry saves) is a kind word. Gardeners who picked "Lemon" would
    get lemon care, but many "nimbu" trees are really Kagzi lime.
  - how the citrus entries' search words are cleaned up (malta and musambi don't belong on Lemon),
    and whether the plain entry is split into kind-specific entries (Lime, Lemon, Orange, Sweet
    orange).

  A test pins it: every citrus add-tree entry resolves to its intended kind, or to none.
- **No kind found** (a tree just called "citrus" or "my nimbu plant"): the tree **keeps the season
  pack**, exactly as today, and gets no care reminders. *(Owner's decision, 2026-11-18: vague or
  wrong-kind advice is worse than today's, and it keeps the review to the kinds.)* Asking the
  gardener which kind it is comes later, as its own change.
- **Where the kind is resolved:** `SeasonalService.careOf` is the one place care is looked up for a
  plant, so kind matching goes there. `TaskProcessor` only asks whether a family has care at all.
  For citrus that means "has at least one kind": a citrus tree with no kind found then gets
  neither care reminders nor the first watering check, the same as any care family today.
  See "First watering check" below.
- **Changing variety** changes the kind. Reminders for the old kind are cancelled by the existing
  stale-task clean-up (`TaskService.retireCareTasksExcept`), because their keys are no longer
  current.
- **When a tree's care goes away** (variety cleared so no kind matches, a family's care retired,
  a region moved to pending), its pending care reminders must be cancelled too. Today
  `SeasonalService` (around line 220) calls `retireCareTasksExcept` only when care exists, so
  those reminders would stay pending forever next to the season-pack tasks. Fix: when there is
  no care, call `retireCareTasksExcept(userId, plantId, [])`. Release 1 includes this (it already
  matters for retiring a family), with an e2e test: Kagzi → blank variety cancels the lime
  reminders.
- **Which kinds exist and what each says** is content. It is decided in the add-plant playbook:
  draft, source check with links (CIB&RC label claims for chemicals), then the owner's review in a
  Claude Doc. No citrus data file is written before the owner's explicit yes.
- Kind keys are part of the task key for kind items (`citrus:<kind>:<item>`), so changing a
  tree's variety never collides with another kind's task.

## Release order

The catalogue schemas are strict. A push carrying a field the live code doesn't know crashes the
API on its next restart. So:

**Release 1: the move**
1. Migration (new table) on Neon.
2. Catalogue push of the six families. This is safe before the code deploys: the live code
   doesn't read the new table at all.
3. Push `main` and deploy to Render. The new code reads care from the catalogue. It refuses to
   start without it, as with the rest of the catalogue, which is why step 2 comes first.

**Release 2: citrus**
1. Deploy the code that knows `kinds` (the schema field, kind matching, task keys).
2. Then push the citrus care record. This is a new field, so it goes code first (memory:
   deploy-facts).

The web does not change in either release.

**Rolling back after Release 2:** Release 1 code can't read a care record with `kinds`, and the
store loads APPROVED and RETIRED records through the strict schema. So a Render rollback alone
would crash on boot. Before rolling back, push citrus care as DRAFT (`loadSeed` skips DRAFT),
then roll back. This goes in `docs/deploy.md`. `catalogue.treeCare()` serves APPROVED records
only.

## First watering check (decided)

The add-tree job (`TaskProcessor`) carries only the species. It keeps today's rule: a family with
care gets no "water in 3 days" check. So a citrus tree with no kind, like a guava in a region still
pending today, gets neither care reminders nor that check. *(My call: making it "unless this
tree's care applies" means loading the plant and the user in the processor. Recorded as a known
gap for a later change.)*

## Size

Adding a catalogue record type touches the same places stage 2 did:
- schemas and `CatalogueSeed` types
- the repository's `loadSeed` / `applyPush`
- the push's `KINDS` / `PushReport`
- `Catalogue.from` and `testing.ts`
- the e2e test that overrides `TREE_CARE_REGISTRY` (`test/e2e/tree-care.e2e-spec.ts`)

It is more than a lookup swap. Release 1 is a stage-2-sized change, and release 2 adds kind
matching plus the citrus content.

## Left to the builder

File and function names beyond those named here; how the snapshot indexes care; the exact zod
layout; whether kind matching reuses the species resolver's matcher directly or a small shared
helper; how the e2e proves a citrus tree of each kind gets its own reminders.

Everything must meet `docs/coding-principles.md`.
