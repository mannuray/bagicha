# Vegetables: Want to Grow → Seeds → Planting → Harvest — Design

**Date:** 2026-11-11
**Builds on:** branch `backend-cleanup`; tree page v2 and tree life and loss specs (2026-11-10).
**Standard:** `docs/coding-principles.md`.
**Product sources:**
- `docs/bagicha-prd.md` §3.2 (Seasonal Engine, crop rotation planner) and §3.3 (seed kits, later);
- `docs/record-model.md` (CROP: `growth_habit ANNUAL`, `record_pattern RECURRING_SEASONAL`, one record with many cycles, crop event vocabulary);
- `docs/season-journal-format.md`.

## 1. Why

Vegetables don't live like trees. A gardener's year with a crop runs like this:
1. "I'd like to grow tomatoes."
2. Get seeds or seedlings in time.
3. Sow at the right moment for their region, in a nursery tray or straight in the bed.
4. Transplant, care, and harvest many times.
5. End the season, and do it again next year, often in a different bed.

Today Bagicha's only vegetable help is one all-India "good to sow now" list (`weather.service.getSeasonalSuggestions`). It ignores the district and region, and nothing acts on it. Crop records exist (`record_kind CROP`, and the event types SOWING, GERMINATION, TRANSPLANTING, THINNING, BOLTING and SEASON_END), but they run on tree logic.

This slice is for everyone's garden, not one user's.

## 2. Goals

### 2.1 Crop calendar (curated data shipped in the backend)
- **Module:** a pure domain module `crop-calendar.ts`, keyed by crop id.
- **Fields for each crop:**
  - `names` (en) and `aliases`, including Hindi;
  - `family`, the rotation group: `SOLANACEAE`, `BRASSICA`, `LEGUME`, `CUCURBIT`, `ALLIUM`, `LEAFY`, `ROOT`, `UMBELLIFER` or `RHIZOME`;
  - `method`: `NURSERY_TRANSPLANT`, `DIRECT_SOW`, `TUBER`, `CLOVE`, `RHIZOME` or `SET`;
  - `windows`: sowing windows per **climate group**. These are month ranges that may wrap the year end, and a crop may have several per group;
  - `germination_days: [min,max]`;
  - `transplant_after_days: [min,max] | null` (nursery crops only);
  - `days_to_first_harvest: [min,max]`, counted from sowing (or planting the material);
  - `harvest_span_days`;
  - `thin_after_days | null`;
  - `succession_every_days | null`;
  - `care: CareStep[]`: crop-specific steps with a day offset and a copy key, e.g. tomato stake at transplant + 20 days, potato earth-up at plant + 30 days;
  - `tags`: `container`, `beginner`, `quick` (first harvest under 45 days);
  - `guide`: `plants_for_family_of_4` (a text range), `container` (e.g. "12–14 inch pot or grow-bag") and `spacing_cm`.
- **Climate groups:** region clusters map to three groups, which keeps the data honest and small.
  - **PLAINS:** NORTH_INDIA, EAST_INDIA, CENTRAL_INDIA, WEST_INDIA.
  - **PENINSULAR:** SOUTH_DECCAN, COASTAL_HUMID.
  - **HILLS:** HILLS_COOL.
- **Crops covered (25):**
  - Solanaceae: tomato, brinjal, chilli, capsicum.
  - Malvaceae: okra, grouped as `LEAFY`'s neighbour; family `OTHER` is acceptable.
  - Cucurbits: bottle gourd, bitter gourd, ridge gourd, cucumber, pumpkin.
  - Legumes: peas, french beans.
  - Brassicas: cauliflower, cabbage, mustard greens (sarson).
  - Roots: carrot, radish.
  - Leafy: spinach (palak), fenugreek (methi), coriander, lettuce.
  - Alliums: onion, garlic.
  - Potato.
  - Rhizomes: ginger, turmeric.
- **The values are ranges.** The builder fills them from a standard Indian horticulture reference (ICAR or state agricultural university package of practices, or similar) and records the source in a comment at the top of the module. Indicative PLAINS examples for review:
  - tomato: nursery Sep–Oct and Jan–Feb; transplant at 25–30 days; first harvest 90–110 days from sowing;
  - palak: direct Sep–Nov; succession every 15 days; first harvest 30–40 days;
  - potato: tubers Oct–Nov; earth-up at day 30; harvest 90–110 days;
  - okra: direct Feb–Mar and Jun–Jul.
- **Endpoint:** `GET /crops/calendar` returns every crop with its status for the user's region:
  - `open`: in a window now;
  - `soon`: a window opens within 30 days, with `opens_in_days`;
  - `later`: with the next window's month.

  It also returns the tags and the guide. Paging isn't needed: it's a fixed list of 25.
- **The dashboard's "Good to sow now" line** uses the crops that are `open` for the user's region, replacing the old three-season list.

### 2.2 Want to grow = a planned crop record
- **"Add to Want to grow"** creates a Plant with:
  - `record_kind CROP`, `growth_habit ANNUAL`, `record_pattern RECURRING_SEASONAL`;
  - `crop_id` (new);
  - `crop_stage PLANNED` (new);
  - no planting date.

  Tasks need a plant, and the record model wants one record per crop line, so the "interest" *is* the record. Its seasons accumulate on it.
- **New nullable `Plant` fields:**
  - `crop_id String?`: a key into the crop calendar;
  - `crop_stage CropStage?`, enum `PLANNED`, `NURSERY`, `IN_GROUND`, `HARVESTING`, `RESTING`. It is null for trees and flowers.
- **Lists:**
  - **Growing** (`status=active`) shows crops in NURSERY, IN_GROUND or HARVESTING, as well as trees;
  - **Want to grow** (`status=planned`) shows crops in PLANNED or RESTING;
  - **Past** is unchanged.
  
  Ended crops behave like ended trees (the tree life and loss spec).
- **Removing** a crop from Want to grow while it's PLANNED, with no seasons, actually deletes it. It has no history yet, so this is the one allowed delete. Otherwise "remove" means ending it as REMOVED.

### 2.3 The crop journey (tasks from the calendar)
- **Reminders** are created by an idempotent sync, `POST /crops/plan/sync`. The dashboard calls it once per session, as it does seasonal materialise.
- **For each PLANNED or RESTING crop,** the next sowing window for the user's region decides two tasks:
  - **Get seeds:** due 21 days before the window opens. Material crops read "Get seed potatoes / garlic cloves / ginger rhizomes / onion sets".
    `// TODO(seed-order)`: later this links to ordering seeds in the app, through the existing marketplace module. There's no shop UI in this slice.
  - **Sow:** due on the window's opening day, and no longer suggested after the window closes. The copy says nursery or direct as appropriate.
- **Deterministic `source_key`:** `crop:<plantId>:<year>:<windowIndex>:<step>`, with `TaskSource CROP_PLAN` (new). Re-running the sync creates nothing new.
- **Logging a journey step moves the stage and creates the next tasks.** These come from the calendar, synchronously in `journal.service.addEntry`, extending the existing follow-up mechanism.
  - **SOWING**, metadata `{ method: 'NURSERY' | 'DIRECT', place_id? }`:
    - stage becomes NURSERY (nursery) or IN_GROUND (direct);
    - tasks: "Check germination" at the germination max; "Transplant seedlings" at the transplant min (nursery only); "Thin seedlings" at `thin_after_days` (direct, if set); the care steps measured from sowing; "Harvest should start soon" at the first-harvest min.
  - **TRANSPLANTING**, metadata `{ place_id? }`: stage becomes IN_GROUND. Care steps measured from transplanting.
  - **HARVEST:** stage becomes HARVESTING.
  - **SEASON_END:** stage becomes RESTING; the season closes; pending CROP_PLAN tasks of that season are cancelled. The next sync plans the next year.
  - **Steps can be skipped.** Logging a later step (for example TRANSPLANTING bought nursery seedlings straight from PLANNED) marks that season's earlier pending CROP_PLAN tasks (get seeds, sow, germination, transplant) as **COMPLETED**. A skipped step is satisfied, not refused.
- **Succession sowing:** for crops with `succession_every_days`, while the crop is IN_GROUND or HARVESTING and a window is open, a "Sow another row" task is created every N days. Its key includes the date bucket. It stops when the window closes or the season ends.
- **The web app gets a "Start" sheet on a planned crop** with three paths: *I have seeds → sow now* (logs SOWING with the method, or the default from the calendar); *Bought seedlings → transplant now* (logs TRANSPLANTING); *Get seeds first* (does nothing; the reminders do the rest).

### 2.4 Seasons for crops
- **The `PlantCycle` table gains `season_no Int @default(1)`,** and the unique key becomes `(plant_id, cycle_year, season_no)`. Trees are unaffected: they always use 1.
- **For CROP records**, a season (cycle) opens at the first SOWING or TRANSPLANTING when no season is open, and closes at SEASON_END.
  - It isn't tied to the calendar year: `cycle_year` is the IST year the season opened, and `season_no` increments within that year.
  - Other entries attach to the open season, or to none.
- **`PlantCycle` gains `place_id String?`:** where this season grew, set by the SOWING or TRANSPLANTING entry that opened it.
- **Year on year, on a crop page,** compares seasons. The label is the season start, e.g. "Sep 2026", and the existing season-total yield and comparison rules apply (only *finished* seasons are compared, i.e. closed ones).

### 2.5 "What can I sow now?" (discovery)
- **A new web page,** `/crops`, reached from the dashboard's "Good to sow now" line and from My Plants.
- **Sections:** **Sow now** (open), **Coming up** (soon) and **Later**.
- **Filters:** Container-friendly, Easy for beginners, Quick harvest.
- **Each crop card shows:** its name, the window ("Sow Sep–Oct"), the method, a quick guide line and **Add to Want to grow** (or "On your list").

### 2.6 How much to plant
- **On a crop's page and in discovery:**
  - "4–6 plants feed a family of 4";
  - "12–14 inch pot or grow-bag per plant";
  - "Space 45–60 cm in a bed".

  The values come from the calendar `guide`.

### 2.7 Beds and containers, with gentle rotation
- **New model `GardenPlace`:** `id`, `user_id`, `name`, `kind` (`BED`, `GROW_BAG`, `POT`, `CONTAINER` or `GROUND`), `created_at`, `archived_at?`.
- **Endpoints:** `GET`, `POST` and `PUT /garden/places`, owner-scoped; archiving instead of deleting.
- **When sowing or transplanting,** the web asks "Where?", with a picker of places and "Add a place". The chosen `place_id` goes in the entry metadata and onto the season.
- **Rotation hint:**
  - `GET /garden/places/:id/rotation?crop_id=` returns `{ conflict: boolean, last: { crop_id, family, season_label } | null }`.
  - It's a conflict when the place held the same `family` in a season that ended within the last 12 months.
  - The web shows a gentle note under the picker, e.g. "Tomatoes (same family as brinjal) grew here last winter, so try beans or greens here". It doesn't block.

### 2.8 The crop page
- **The tree page (`/plants/:id`) branches on `record_kind CROP`:**
  - **Hero:** the crop's photo (the user's latest photo, or the gradient); name; current stage, e.g. "In the nursery · day 12".
  - **Journey card**, replacing At a glance and the life line:
    - a stepper (Planned → Seeds → Sown → Transplanted [nursery crops] → Harvesting → Season ended) marking the current step;
    - the next action as a button (Start, Log transplant, Log harvest, End season);
    - the how-much-to-plant guide;
    - the current place with its rotation note.
  - **Upcoming care** (unchanged).
  - **Seasons**, the Year on year section in season labels.
  - **The Sanctuary Record** with crop filters: the Bloom & fruit filter also covers GERMINATION, THINNING and BOLTING, and Notes & photos also covers SOWING, TRANSPLANTING and SEASON_END. Alternatively, a builder's choice of a "Journey" filter.
  - **Removed for crops:** Milestones, This season (the tree pack), and the tree life line.

## 3. Parked: later slices (kept so we don't forget)
1. **Pest watch per crop stage**, e.g. fruit borer on brinjal at flowering, aphids on mustard: stage-timed scouting tasks.
2. **Companion hints**, e.g. marigold near tomatoes, basil with tomato.
3. **Seed stock:** "I have seeds", tracked per crop with the packet date and viability years; it skips the buy step automatically.
4. **Weather-aware sowing:** delay or advance sowing on heat, frost or heavy rain. This needs real weather first; the weather card is hidden and the backend weather is a mock.
5. **Order seeds in the app:** `TODO(seed-order)` on the Get seeds task, via the marketplace module and the PRD §3.3 contextual kits.
6. **Flowers:** the next slice after vegetables, with PINCHING, DEADHEADING and BLOOM_PEAK and seasonal beds.
7. **Push notifications** for every reminder (also parked in the tree specs).
8. **Full district and pincode climate mapping:** finer than the three climate groups.
9. **Regional gardener's tips:** editorial content per region and month (from the Stitch screens; see `2026-11-11-vegetable-screens-design.md` §4).
10. **Yield targets per crop and container size**, e.g. "3 kg over 5 cuts".
11. **A curated card tag set**, e.g. "Fast grower", "Aromatic", "Deep pot".

## 4. Non-goals
- Everything in §3.
- Fruit trees are unchanged, apart from the shared plant list status.
- Editing the calendar in the app.

## 5. Anti-goals
- **False precision:** windows and days are ranges from a cited reference. A crop without data for a group says "Not usually grown in your region", never a made-up month.
- **Nagging:** the sync creates at most one get-seeds task and one sow task per crop per window, and succession tasks only while the crop is actually growing.
- **Losing history:** seasons accumulate on one record, and only a never-sown planned crop may be deleted.
- **Blocking skips:** any step can be started from, especially "bought seedlings".

## 6. Decisions
- **User:**
  - want-to-grow interest;
  - a seed-buying reminder before the window, which later becomes ordering;
  - planting steps by crop (nursery, then transplant, or direct), and skipping is fine;
  - add discovery, succession, how-much-to-plant and places with rotation;
  - park the rest in this doc.
- **My calls:**
  - **Interest = a PLANNED crop record**, because tasks need a plant;
  - **three climate groups**, not seven clusters;
  - **25 crops**;
  - **21-day seed lead**;
  - **30-day "soon" horizon**;
  - **skipped steps are auto-COMPLETED;**
  - **seasons via `season_no`;**
  - **rotation looks back 12 months by family;**
  - **the only delete** is for never-sown planned crops;
  - **the crop page is a branch of the tree page.**

### 6.1 Settled after the builder check (my calls; these override the sections above)
1. **What opens a crop season.**
   - **Openers:** for a CROP record with `crop_id`, a season opens on SOWING, TRANSPLANTING or HARVEST (a crop already growing when added) when none is open. HARVEST as the opener sets the stage to HARVESTING.
   - **Other entries** (notes, photos, diagnoses) join the open season, or **no season** (`plant_cycle_id` null). They never create one.
   - **Diagnoses** on crops follow the same rule.
   - **Delete:** "never sown" means no season has ever opened. Deleting a planned crop removes its tasks and journal entries in one transaction, because the foreign keys don't cascade.
2. **Existing CROP records** (null `crop_id` and `crop_stage`):
   - keep today's behaviour, show under Growing, and are excluded from the sync and the journey;
   - there is no backfill;
   - the generic Add form drops the CROP kind (Tree and Flower stay), so new crops come through Want to grow.
3. **SOWING while a season is open** (a succession row) changes no stage and re-creates no germination or harvest tasks. It completes the pending "Sow another row" task. **Within a season, the stage never moves backwards.**
4. **The next window to plan** after SEASON_END, or for a newly added crop, is the earliest window (open now, or future) **in which no season of this crop has started.**
   - Due dates are never in the past: get seeds is due at the later of today and (window start − 21 days), and sow at the later of today and the window start.
   - A sow task isn't created once that window has closed.
5. **Rotation uses botanical families:**
   - `SOLANACEAE`: tomato, brinjal, chilli, capsicum, potato
   - `BRASSICACEAE`: cauliflower, cabbage, mustard greens, radish
   - `FABACEAE`: peas, french beans, methi
   - `CUCURBITACEAE`: the gourds, cucumber, pumpkin
   - `APIACEAE`: carrot, coriander
   - `AMARANTHACEAE`: palak
   - `AMARYLLIDACEAE`: onion, garlic
   - `ASTERACEAE`: lettuce
   - `MALVACEAE`: okra
   - `ZINGIBERACEAE`: ginger, turmeric
   
   Onion's default is `NURSERY_TRANSPLANT` from seed; the `SET` method is dropped.
6. **CROP_PLAN dedupe** checks the `(source, source_key)` in **any** status, so completed, skipped or cancelled reminders are never re-created. Other sources keep pending-only dedupe.
7. **Tree logic is off for crop records with `crop_id`:**
   - seasonal materialise returns `{ results: [], created_count: 0 }` for them, and is never an error;
   - `getDetail` skips the lifecycle recalculation and the lifecycle task queue;
   - the web skips the tree pack for them.
8. **Cycle storage:**
   - `PlantCycle` gains `season_no Int @default(1)`, `started_at DateTime?`, `closed_at DateTime?` and `place_id String?`;
   - the unique key becomes `(plant_id, cycle_year, season_no)`; tree upserts use `season_no 1`;
   - lists order by `cycle_year desc, season_no desc`;
   - the cycle API returns the new fields.
   - **On the web,** a crop season is *finished* when `closed_at` is set. Rows are keyed by cycle id and labelled by `started_at` ("Sep 2026"). Trees keep the year rule.
9. **Plant list `status`** gains `planned`:
   - `active` = not ended AND (no `crop_id` OR `crop_stage` in NURSERY, IN_GROUND or HARVESTING);
   - `planned` = not ended AND `crop_stage` in PLANNED or RESTING.

## 7. Left to the builder
- Exact calendar values (from the cited reference), copy, component split.
- The internal shape of the sync and follow-up code.
- Whether the record filters get a dedicated Journey chip.

## 8. Done means
- **Backend tests:**
  - calendar lookup, climate-group mapping, window status with year wrap, and `opens_in_days`;
  - sync idempotency and the get-seeds and sow due dates;
  - journey transitions and the tasks for nursery and direct crops;
  - skipped steps auto-complete;
  - season open and close with `season_no`;
  - succession cadence and its stop;
  - places CRUD ownership;
  - rotation conflict;
  - planned-crop delete versus REMOVED;
  - additive migrations applied with `migrate deploy`.
- **Web tests:**
  - discovery sections and filters, and Add to Want to grow;
  - the Want to grow tab;
  - Start sheet paths;
  - the place picker with its rotation note;
  - the journey card per stage;
  - how-much-to-plant;
  - season labels;
  - the dashboard's region-aware sow line.
- **e2e:** add palak to Want to grow, start with "I have seeds", sow directly in a new place, see the germination task, log a harvest, end the season, and see palak back under Want to grow.
- **Suites:** all of them pass.
