# Flowers — Design

**Date:** 2026-11-11
**Builds on:**
- vegetables (`2026-11-11-vegetables-design.md`);
- vegetable screens (`2026-11-11-vegetable-screens-design.md`);
- tree life and loss (`2026-11-10-tree-life-and-loss-design.md`);
- the Home garden tile (commit 8487f06).

All on branch `backend-cleanup`.

**User rules:**
- Think general, not my garden: every gardener's flowers, by region.
- Fake data is excluded.
- Features the design shows but the app lacks are planned, not dropped, when they're good.

## 1. Why

The add form already offers a "Flower" kind, but a flower is treated exactly like a fruit tree:
- **Wrong stages:** a rose gets fruit lifecycle stages ("First harvest", "Mature bearing").
- **Wrong tasks:** it runs the fruit-tree season pack (`inferTreeSeasonalState`: flowering → fruit set → harvest).
- **Wrong photo:** it shows the Stitch mango in its header.
- **No sowing guidance:** there is nothing for flowers grown from seed each season.

The backend already has flower log types (`FLOWERING`, `PINCHING`, `DEADHEADING`, `BLOOM_PEAK`) that no screen uses.

## 2. The model (agreed with the user)

Flowers come in three kinds, and each reuses a model we already have.

### 2.1 Seasonal flowers: like vegetables
Seasonal flowers are annuals grown from seed each season. They join the **crop calendar** and the **planting journey** unchanged in mechanism:
- regional sowing windows per climate group (PLAINS, PENINSULAR, HILLS);
- Want to grow;
- seed and sow reminders;
- nursery tray or direct sowing;
- transplant;
- care steps;
- season end and rotation-free (flowers skip the rotation note; see §6).

**Differences from vegetables:**
- **Stage name:** the `HARVESTING` stage is shown as **"Blooming"** for flowers. The stored enum is unchanged.
- **Logging:** "Log a harvest" becomes **"Log a bloom"**, which records `FLOWERING` or `BLOOM_PEAK`. The first bloom log moves the crop to the blooming stage, the way a first harvest log does today.
- **Facts:** facts read "First bloom in 60–70 days" and "Blooms for about 2 months" (`days_to_first_harvest` and `harvest_span_days`, relabelled for flowers).
- **Care keys:**
  - `pinch`: pinch the tips for a bushier plant (marigold, zinnia, cosmos, petunia);
  - `deadhead`: remove faded flowers to keep blooms coming;
  - `stake` (sunflower), reused.
- **Starter list (about 15):**
  - genda/marigold (African and French), zinnia, cosmos, petunia and calendula;
  - dianthus, sunflower, balsam (gulmehendi), portulaca, aster and salvia;
  - celosia (murga), gomphrena, sweet pea, pansy and larkspur.

  Winter flowers are sown Sep–Nov in the plains; summer and monsoon flowers Feb–Jul. Each gets the same fields as a crop: name, aliases with Devanagari, method, windows, germination, transplant, days to first bloom, bloom span, care, guide (how many and what container), scientific name, description and sun.
- **Data:** the data lives in a flower section of the calendar (`kind: 'FLOWER'` on each entry). Plan-add creates the record with `record_kind: FLOWER`.

### 2.2 Perennial flowers: like trees
Perennial flowers are added once and stay for years: rose, gudhal/hibiscus, mogra/jasmine, bougainvillea, ixora, kaner/oleander, harsingar/parijat, champa/plumeria, adenium and sadabahar/periwinkle.
- **How they're added:** through the add form ("Flower" kind) with a **flower species search**. They have perennial flower catalogue entries.
- **Lifecycle:** flower stages replace fruit stages: **Young → Blooming**. Stored as the existing enum, with `SAPLING`/`JUVENILE` shown as "Young" and the later stages shown as "Blooming". The age threshold is a `first_bloom_months` range in the flower's life profile; a first `FLOWERING` log also moves it to Blooming.
- **Page:** a perennial flower keeps the tree page (moments, Sanctuary Record, health, end and restore), with flower wording:
  - no fruit or yield sections;
  - YearOnYear compares **when it first bloomed and how heavily** (the count of `FLOWERING`/`BLOOM_PEAK` logs per year), not yield;
  - the header uses the flower's own latest photo, or a flower-family pebble, never the mango.
- **Flower care calendar (new, replaces the fruit pack for flowers):** curated per species and region group, a list of month-anchored care tasks:
  - rose: hard prune in Oct (plains), feed after pruning, deadhead through the bloom;
  - hibiscus: prune Feb–Mar, feed monthly in the growing season;
  - mogra: prune after flowering in Nov–Dec, feed in Feb before the summer bloom;
  - bougainvillea: prune after a bloom flush, water sparingly to encourage flowering.

  These become tasks in the **per-plant path** the Dashboard already calls once per session for every non-crop plant (`POST /seasonal/plant/:id/materialize-tasks`). For a FLOWER record it builds tasks from the flower care calendar instead of the fruit pack, with a **new `TaskSource.FLOWER_CARE`** (Prisma migration, plus a reason text in `task-view.ts`). The dedup key includes the year (e.g. `rose:prune:2026`), so a yearly task comes back next year. The tree season pack and overlay never run on a flower.
- **Bloom months per species and climate group:** e.g. "Mogra usually blooms Mar–Jun". Shown on the page. A status line reads "In its bloom season" or "Next bloom: Mar–Jun".
- **Life profile per species** (like trees): e.g. rose 10–15 years, hibiscus 10–20, adenium 15–25 in pots, sadabahar 2–3 (short-lived: flagged like papaya).

### 2.3 Bulbs: parked
Dahlia, gladiolus, rajnigandha/tuberose, lilies and amaryllis are planted from a bulb, bloom, then are lifted and stored. They're **not built now**; added to §5.

## 3. How it shows up

- **Chooser:** gets a third path, **"Grow flowers"**. It opens the discovery page on Flowers, with a line "Perennials like rose or mogra? Add one" linking to the add form with the Flower kind chosen.
- **"What can I sow now?":** gets a **Vegetables | Flowers** toggle.
  - The header, search, filters, grid, Coming up and Later all work the same.
  - The flower filters are Container-friendly, Easy for beginners, and Suits my sunlight. There's no "Quick harvest"; it becomes **"Long blooming"** for flowers with a bloom span of 60 days or more.
- **Crop detail page:** serves flowers with flower wording: "How it grows" ends in Bloom, and pinch and deadhead steps appear.
- **Journey page:** serves seasonal flowers. The stage line reads "Blooming · day 70 · Balcony pot", and the button is "Log a bloom".
- **Home garden tile:** gets a **Flowers** pebble with "3 seasonal · 2 perennial" underneath. It links to `/plants?group=flowers`.
- **Data shape:** a seasonal flower is a FLOWER record **with** a `crop_id` (so it rides every existing crop-journey branch); a perennial is a FLOWER record **without** one. The `crop` filter and the Home crops count exclude flowers.
- **Plants tab:** gets a **Flowers** group. The backend `kind` filter gains `flower` (`record_kind = FLOWER`). `tree` becomes `record_kind = TREE` with no crop.
- **Rows:**
  - seasonal flowers read "Blooming · day 40";
  - perennials read "Blooming · planted 2022" (or "Young").
- **Add form:** with the Flower kind, the species search lists perennial flowers. Seasonal flowers aren't offered there: they come through Want to grow, like crops.

## 3.1 Existing flower records (user-approved)

Flower records made through the add form before this work were treated as fruit trees. A one-time, idempotent cleanup (a migration script run with the deploy):
- **cancels** their pending `SEASONAL_PACK` and `PERSONALIZED_OVERLAY` tasks, keeping completed and skipped history;
- leaves their stored lifecycle stage as-is; the flower wording (Young/Blooming) is applied on read;
- keeps every record. A species that matches a curated perennial gets its care calendar on the next session's materialize; a species that matches nothing stays a perennial-style flower with no care calendar.

Records whose species is a seasonal flower (e.g. marigold) stay perennial-style records; they aren't moved into the journey.

## 4. Done means

- **Tests (written first)** for:
  - the flower calendar entries (every flower complete, with valid windows and Devanagari alias);
  - plan-add making a FLOWER record;
  - the blooming stage from a bloom log;
  - discovery toggle and flower filters;
  - flower wording on detail and journey;
  - perennial stages (Young/Blooming);
  - the flower care calendar creating tasks once and never the fruit pack;
  - bloom-month status;
  - YearOnYear by blooms;
  - the Home Flowers pebble and Plants Flowers group;
  - add form flower species.
- **e2e:** the loop adds marigold from Flowers → Start now → seeds → blooming after a bloom log. It also adds a rose through the form and sees its care task.
- **Suites:** all of them pass.

## 5. Parked

- **Bulbs and corms:** lift-and-store steps.
- **Cut-flower counts:** a "blooms picked" yield.
- **Fragrance and pollinator tags.**
- **Companion planting:** marigold with tomato.
- **Photos for flowers:** best-effort like crops; family pebble fallback.

## 6. Decisions

- **User:**
  - three kinds, split as above;
  - seasonal flowers like vegetables;
  - perennials like trees;
  - bulbs parked.
- **My calls:**
  - the starter lists of 15 seasonal and 10 perennial flowers;
  - "Blooming" as the label for the HARVESTING stage, rather than a new enum value;
  - Young/Blooming over the existing lifecycle enum;
  - flowers skip the rotation note (no family-pest logic for flowers);
  - "Long blooming" replaces "Quick harvest" for flowers;
  - the perennial care calendar is curated code data like the crop calendar, not the AI or rules pack;
  - discovery is one page with a toggle, not a second page;
  - seasonal flowers aren't offered in the add form;
  - perennial care runs in the per-plant materialize path with a new `FLOWER_CARE` task source and year-keyed tasks;
  - bloom months are per climate group;
  - the existing-records cleanup in §3.1 (approved by the user);
  - the species matcher stops filing "rose" under litchi (its "rose scented" alias).
