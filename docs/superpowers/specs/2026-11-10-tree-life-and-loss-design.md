# Tree Life Profiles and Loss — Design

**Date:** 2026-11-10
**Builds on:** branch `backend-cleanup`; tree page v2 (`2026-11-10-tree-page-v2-design.md`).
**Standard:** `docs/coding-principles.md`.
**Product sources:** `docs/bagicha-prd.md` §3.1 (health profiles, tree history), `docs/record-model.md` (growth habit vs record pattern), `docs/tree-domain-model.md` (lifetime milestones).

## 1. Why

Bagicha treats every tree as if it lives forever and ages on one clock. That's wrong in two ways that matter to every gardener, not just one:

1. **Species live differently.**
   - A papaya fruits in under a year and is past its best by year 3.
   - A banana stem fruits once and is replaced by its suckers.
   - A mango takes 3–5 years to fruit and bears for decades.

   Today stage is age-only for everyone (under 1 year: Sapling, under 3: Young, under 5: First flowering, then Mature, in `lifecycle.service.ts`). A 10-month papaya in fruit reads "Sapling", and a 4-year papaya at the end of its useful life reads "First flowering".
2. **Trees are lost.** People lose trees to disease, pests, weather, water problems and old age, or remove and replace them. There's no way to record that. The only option is deleting the tree, which destroys its history, or keeping a dead tree that still produces tasks.

## 2. Goals

### Part A: species life profiles (curated data, shipped with the app)
1. **One profile per species family**, in a new backend domain module `species-life-profiles.ts`. It holds ranges, never single numbers:
   - `first_fruit_years: [min, max]`: age at first fruit, from planting a typical nursery plant (grafted, layered or seedling as is usual for the species);
   - `productive_until_years: [min, max]`: the age when yields typically decline;
   - `lifespan_years: [min, max]`;
   - `note_key`: a species pattern note translated in the web app (e.g. banana "Each stem fruits once…", papaya "Replace every few years…").
2. **Families covered.** The values below are typical Indian home-garden ranges; variety, rootstock and care move them. The builder may correct a range from a standard horticulture reference (e.g. ICAR or state agricultural university package of practices), and must say so in the ledger.

   | family | first fruit | productive until | lifespan | note |
   |---|---|---|---|---|
   | mango | 3–5 | 40–60 | 60–100 | — |
   | citrus | 2–4 | 20–30 | 30–50 | — |
   | litchi | 4–6 | 40–60 | 60–100 | — |
   | guava | 2–3 | 15–25 | 30–40 | — |
   | pomegranate | 2–3 | 15–20 | 25–30 | — |
   | banana | 1–1 (9–15 months) | 3–5 (ratoon crops) | 5–8 (the clump) | stem fruits once; keep 1–2 suckers |
   | papaya | 1–1 (8–12 months) | 2–3 | 4–6 | replace every 2–3 years |
   | grape | 2–3 | 20–30 | 40–60 | yields depend on yearly pruning |
   | jackfruit | 4–8 | 50–70 | 60–100 | — |
   | coconut | 4–7 | 50–70 | 60–80 | dwarf types fruit sooner |
   | sapota (chikoo) | 3–5 | 40–60 | 60–80 | — |
   | amla | 3–5 | 40–50 | 50–60 | — |
   | custard apple | 3–4 | 15–20 | 20–30 | — |
   | moringa | 1–1 (6–8 months) | 4–6 | 10–20 | cut back yearly to keep pods in reach |

3. **Catalogue and aliases.** Add catalogue entries and species-normalisation aliases for the new families: papaya, grape, jackfruit, coconut, sapota, amla, custard apple and moringa, with Hindi aliases where the existing seeds have them, e.g. papaya "papita/पपीता", grape "angoor/अंगूर", jackfruit "kathal/कटहल", sapota "chikoo/चीकू", amla "आंवला", custard apple "sitaphal/शरीफा", moringa "drumstick/sahjan/सहजन".
   - Seeding must reach **existing** databases: upsert by `(species_family, species, variety)`, not "only when the table is empty".
4. **Stage per species.** `lifecycle.service.calculateStage(plantingDate, species)` uses the profile when the family has one:
   - SAPLING: age under half the minimum first-fruit age;
   - JUVENILE: until the minimum first-fruit age;
   - FIRST_FLOWERING: from the minimum to the maximum first-fruit age;
   - FIRST_HARVEST: up to 1 year after the maximum first-fruit age;
   - MATURE_BEARING: after that.

   With no profile, or no planting date, today's thresholds apply unchanged. Manual stages (`lifecycle_stage_manual`) are still respected.
5. **The tree page shows a life line** in At a glance, from the profile and the plant's age. It's shown only when both are known:
   - before first fruit: "First fruit usually at 3–5 years";
   - productive: "Year 11 · productive until about 40–60";
   - from `productive_until.min`: "Past the typical productive age (2–3 years) · plan a replacement". The replacement nudge is styled as a gentle callout.

   The species note shows under it when there is one.
6. **The API exposes the profile:** `GET /ledger/plants/:id` gains `life_profile: { first_fruit_years, productive_until_years, lifespan_years, note_key } | null`. It's `null` when the family has no profile.

### Part B: when a tree is lost
7. **Record the end (backend).**
   - **Schema** (an additive migration), on `Plant`:
     - `ended_at DateTime?`
     - `end_reason PlantEndReason?`
     - `end_note String?`
     - `end_entry_id String?`: the journal entry, typically a DIAGNOSIS or PEST_DIAGNOSIS, that explains the loss
     - `replaced_by_id String?`: a self-relation to the plant that replaced it, on delete SetNull
   - **Enum** `PlantEndReason`: `DISEASE_OR_PEST`, `WEATHER`, `WATER`, `OLD_AGE`, `UNKNOWN_CAUSE`, `REMOVED`, `REPLACED`.
   - **`POST /ledger/plants/:id/end`** `{ reason, ended_at?, note?, entry_id? }`:
     - `ended_at` defaults to now and can't be in the future or before the planting date;
     - `entry_id` must be one of this plant's journal entries;
     - it sets the fields, writes a journal entry of the new type `PLANT_ENDED` (metadata `{ reason }`, content = note), and moves every PENDING task of the plant to the new status `CANCELLED`;
     - ending an already-ended plant is 409 `PLANT_ENDED`.
   - **`POST /ledger/plants/:id/restore`**: clears the end fields and writes a NOTE entry "Restored". Cancelled tasks stay cancelled; the next season materialise creates fresh ones. Restoring a plant that hasn't ended is 409 `PLANT_NOT_ENDED`.
   - **Ended plants are read-only for writes that grow the record:** journal POST, task status updates, materialize-tasks and the plant PUT return 409 `PLANT_ENDED`. Reads still work.
   - **`GET /ledger/plants?status=active|ended`** defaults to `active`, so the dashboard, scan picker and season materialise exclude ended plants automatically. `ended` lists past trees, newest ended first. `GET /ledger/tasks` (mine) still returns cancelled tasks, and the Daily Path shows them in Closed history.
   - **Replacement:** `POST /ledger/plants` accepts an optional `replaces_id`, which must be an ended plant the user owns. After creating the new plant, it sets `replaced_by_id` on the old one. A REPLACED reason is not required.
8. **Record the end (web).**
   - **"Mark as ended"** is reachable from the tree page through a quiet button at the bottom. It opens a sheet with:
     - reason pills: Disease or pest, Weather, Water, Old age, Unknown, Removed, Replaced;
     - a date (default today);
     - an optional note;
     - when the plant has a DIAGNOSIS or PEST_DIAGNOSIS entry in the last 90 days, a choice to link the most recent one ("Linked: Mealybugs, 12 Oct").
   - **An ended tree's page** shows a calm banner, e.g. "Died · Mar 2026 · Disease or pest", with the note. The page becomes read-only: no Log-a-Moment button, no This season, Upcoming care or task actions. Year on year, Milestones and The Sanctuary Record stay, because the history is the point. The banner offers **Plant a replacement** and **Restore**.
   - **Plant a replacement** opens Add a tree prefilled with the same species and variety, carrying `?replaces=<id>`. After saving, the old tree shows "Replaced by <name>" linking to the new one, and the new tree shows "Replaces <name>".
   - **My Plants** gets two tabs: **Growing** and **Past trees**. Past trees show the end reason and date.
   - **The Daily Path closed history** labels cancelled tasks "Cancelled · tree ended".
9. **Cure is unchanged.** Scan → diagnosis → treatment tasks → rechecks already exists. The "Needs attention" health label already flags a recent medium or high diagnosis.

## 3. Non-goals
- Vegetables and flowers (record patterns, SOWING and other new event types). These are the next slice.
- Loss analytics across gardens ("citrus lost to canker in East India").
- Editing profiles in the app, and per-variety profiles.
- Plan limits: the free-plan tree limit isn't enforced anywhere today; this design doesn't add it.
- Push notifications for the replacement nudge.

## 4. Anti-goals
- **False precision.** Profiles are ranges, labelled "usually" or "about". A species without a profile shows no life line rather than a guess.
- **Losing history.** Nothing in this design deletes a tree, an entry or a task.
- **Ghost work.** An ended tree must never produce tasks, appear on the dashboard, or be offered in the scan picker.
- **Guilt.** Copy around loss is matter-of-fact and kind: no red alarms, no "you killed it".

## 5. Decisions
- **User:** Part A and Part B as described in chat. Think about everyone's garden, not one user's.
- **My calls:**
  - profiles live in code, not the database, so they are versioned and reviewed with the code;
  - the profile is keyed by species family;
  - `CANCELLED` is a new task status rather than reusing `SKIPPED`, because skipped tasks feed the mitigation plan as "the gardener chose not to";
  - the stage mapping in §2.4;
  - the 90-day window for linking a diagnosis;
  - `PLANT_ENDED` is a new journal type, so the end shows in The Sanctuary Record, under the Notes & photos filter.

### 5.1 Settled after the builder check (my calls)
1. **Profiles are stored in months**, not years:
   - `first_fruit_months`, `productive_until_months` and `lifespan_months`, each `[min, max]`;
   - the table above converts directly (papaya first fruit `[8, 12]`, banana `[9, 15]`, moringa `[6, 8]`; years × 12 elsewhere);
   - the web formats values under 24 months as months ("usually at 8–12 months") and as years otherwise;
   - the §2.4 stage thresholds work in months.
2. **Automatic stage changes never move a tree backwards.** `calculateStage` returns the later of the stored stage and the computed one.
   - Existing trees therefore keep MATURE_BEARING (and its mature-only advice).
   - Forward changes queue lifecycle tasks as they do today.
   - There is no backfill migration.
3. **Recorded milestones beat age:**
   - `first_harvest_at` set means at least FIRST_HARVEST;
   - `first_fruit_set_at` or `first_flowering_at` set means at least FIRST_FLOWERING.
   
   `calculateStage` takes the plant (planting date, species and milestones) instead of `(date, species)`. When first fruit is recorded, the life line skips "First fruit usually at…" and starts at the productive phase.
4. **Containers** (`planted_context` POT or GROW_BAG):
   - **Shown:** the first-fruit line and the species note.
   - **Hidden:** the productive-until line, the lifespan and the replacement nudge.
   - **Added:** a note, "In a container, productive life is usually shorter; refresh the soil every 2–3 years".
   
   The web plant schema gains `planted_context`.
5. **Read-only for ended plants also covers:** `getDetail`'s stage recalculation and lifecycle task queueing (skipped for ended plants), and scans that pass a `plant_id`. A diagnosis can't be saved to an ended tree; that returns 409 `PLANT_ENDED`.
6. **Catalogue seeding finds then updates** by `(species_family, species, variety)`, because the table has no unique key on those columns and `variety` can be null.

## 6. Left to the builder
- The internal shape of the profile module and its unit tests.
- Exact copy beyond what's quoted (all copy goes in `en.json`).
- Sheet layout. Use the existing Stitch components (Pill, TextField, Button, the frosted sheet style from Log a Moment).

## 7. Done means
- **Backend tests:**
  - profile lookup;
  - stage per species, including papaya at 10 months and 4 years, banana, unknown species, and manual stage;
  - catalogue upsert on a non-empty table;
  - end, restore and replace endpoints, including the 409s, date validation, and `entry_id` ownership;
  - task cancellation;
  - the `status` filter;
  - read-only enforcement;
  - an additive migration that applies with `prisma migrate deploy`.
- **Web tests:**
  - the life line in all three phases, and its absence without a profile or a date;
  - the end sheet, including the diagnosis link;
  - the ended tree page is read-only, with its banner;
  - Restore;
  - Plant a replacement round trip;
  - the Growing / Past trees tabs;
  - cancelled task labels.
- **e2e:** the loop extends to marking a tree as died with a cause, checking that it moves to Past trees, and restoring it.
- **Suites:** all of them pass.
