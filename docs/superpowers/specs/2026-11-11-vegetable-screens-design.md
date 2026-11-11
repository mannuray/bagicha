# Vegetable Screens (from Stitch) — Design

**Date:** 2026-11-11
**Builds on:** the vegetables slice (`2026-11-11-vegetables-design.md`), branch `backend-cleanup`.
**Design source:** the Stitch project "Bagicha Premium Login" (7116397477334778532), design system "Bagicha Heritage". New screens:
- "Add to your garden - Chooser";
- "Grow a Vegetable - Patna Winter Sowing";
- "Tomato - Crop Detail";
- "Spinach (Palak) - Crop Journey";
- "Start growing Tomato - Bottom Sheet".

**User rules for this work:**
- Rebuild the screens from Stitch, filling every slot with real data.
- Features the designs show but the app lacks are **planned, not dropped**, when they're good.
- Fake data is excluded.

## 1. Why

Starting a crop works, but it's hard to find (a text link on Home and a tab in My Plants) and the screens were never designed. There is also no crop detail page: the backend knows germination, transplant timing, harvest span and care steps per crop, but `GET /crops/calendar` doesn't send them.

## 2. Build now (data already exists; UI work plus small API additions)

1. **"Add to your garden" chooser:** a frosted bottom sheet opened by every "+" (the Home "Add a tree" tile becomes "Add to garden", plus the My Plants "+").
   - **Plant a tree:** goes to `/plants/new`.
   - **Grow a vegetable:** goes to `/crops`, with a "Sow now: <first 3 open crops>" pill from the calendar.
   - **Cancel.**
2. **"What can I sow now?" rebuilt** to the Stitch layout:
   - region and season header ("PATNA · WINTER SOWING"; district from the profile, season from the guide);
   - "N crops to sow now";
   - filter pills;
   - **Sow now** as a 2-column card grid, each card with photo (§3.1), name, Hindi name (the first Devanagari alias), "Sow Sep–Nov · direct", "First harvest 30–40 days", and a round "+" (or "On your list ✓");
   - **Coming up** as a horizontal row with "Opens in N days";
   - **Later** as one collapsed row of names, which expands.
   
   Tapping a card opens the crop detail page.
3. **Crop detail page, `/crops/:cropId` (new):**
   - **API:** `GET /crops/calendar/:id` returns everything in `CropInfo` plus the user-region status: `germination_days`, `transplant_after_days`, `harvest_span_days`, `thin_after_days`, `succession_every_days`, `care`, all `windows` for the user's climate group, `status` and `window_label`.
   - **Hero:** photo; family · method kicker; name and Hindi name.
   - **Status card:** "Sow now (Sep–Nov)", or "Opens in 12 days (Sep–Oct)". Never both (a Stitch inconsistency).
   - **Three facts:** Germinates 5–10 days; Transplant at 25–30 days (nursery crops only); First harvest 90–110 days.
   - **How it grows:** steps derived from `method` and `care`, e.g. Seeds → Nursery tray → Transplant → Stake → Harvest, or for direct crops Seeds → Sow → Thin → Harvest, or for tubers Seed potatoes → Plant → Earth up → Harvest. Each step has one short line of copy in `en.json`.
   - **How much to plant:** from `guide`.
   - **Good to know:** a rotation tip derived from `family` ("Don't follow tomato, brinjal, chilli or potato in the same bed"), and the succession note when set.
   - **Sticky buttons:** **Add to Want to grow** (or "On your list") and **Start now**. Start now adds the crop if needed, then opens the start sheet on its crop page.
4. **Crop journey page,** the Stitch "Crop Journey" layout. It replaces today's journey card.
   - **Header:** "In the bed · day 12 · Terrace bag 3" (stage label from `crop_stage`, day from the open season's `started_at`, place from the season).
   - **Pebble stepper,** plus a next-step line taken from the earliest pending CROP_PLAN task ("Next: thin the seedlings in 3 days").
   - **Progress to first harvest:** "Day 12 of about 30–40", from `days_to_first_harvest`, shown before HARVESTING.
   - **Harvest count this season:** "3 harvests", from the season's HARVEST entries.
   - **Rotation note in both directions:** the warning when there's a conflict, and "Good choice: last season here was a different family" when not.
   - **Actions:** the same as today (Log a harvest, End season, Remove from Want to grow).
5. **Start sheet,** the Stitch stepped layout in the Log a Moment frosted style.
   - A 3-dot step indicator.
   - **Step 1:** Seeds / Bought seedlings / Remind me. A "Recommended" badge marks the crop's usual path: seeds for direct crops; either for nursery crops, with seedlings marked "quickest".
   - **Step 2** (seeds only): Nursery tray / Straight in the bed, with the hint "Tomatoes do best raised in a tray, then moved after 25–30 days" from `transplant_after_days`.
   - **Step 3:** where it grows (places, rotation advice) → **Start season →**.
6. **Place kind:** "Add a place" asks the kind (bed, grow-bag, pot, container, ground) instead of always making a grow-bag.

## 3. Plan with new data (in this slice)

1. **Crop photos.** One bundled image per crop (26), shrunk to JPEG like the other Stitch photos. They're generated in Stitch as images in the project and stored in `web/src/assets/crops/<id>.jpg`. A crop without a photo falls back to a pebble with a crop-family icon, so it's never a broken image.
2. **Short description and scientific name per crop** (curated, in `crop-calendar.ts`), e.g. tomato "*Solanum lycopersicum* — the kitchen garden staple; loves sun and support". They're shown on the detail page and searchable.
3. **Sun needs per crop, and sun hours per place.**
   - Each crop gets `sun: 'full' | 'partial'`: full is 6+ hours, partial is 3–5 hours (leafy greens, coriander, methi, ginger).
   - `GardenPlace` gains `sun_hours: 'full' | 'partial' | 'shade' | null`, asked when adding a place.
   - Discovery gets a **"Suits my sunlight"** filter, shown only when the user has places with sun set, matching crops to the sunniest place.
   - The start sheet gently notes "Terrace bag 3 gets partial sun; tomatoes prefer 6+ hours".
4. **Search on discovery:** a search field matching name and aliases, including Hindi. It filters the calendar on the client: the full calendar is a fixed list of 26, not paged data.

## 4. Parked (added to the vegetables spec §3 list; not built now)

- **Regional gardener's tips:** editorial content per region and month.
- **Yield targets** ("3 kg over 5 cuts"): would need yield expectations per crop and per container size; risky as false precision.
- **Card tags like "Fast grower", "Aromatic", "Deep pot":** marketing copy until there's a curated tag set.
- **Already parked there:** companion hints, seed stock and shopping list, weather-aware sowing, push "remind me" per task, ordering seeds in the app.

## 5. Excluded (fake or contradictory in the Stitch drafts)

- Weather and temperature, soil pH, "irrigation in…", moon phase, "8 trees thriving" (none of it is backed by data).
- "96% Vital", "Exceptional yield", "90% emergence", nitrogen claims, "OPTIMAL" badges (no health score or rule behind them).
- Exact day windows like "Oct 10 – Nov 15": the calendar is month-level.
- **The favourite heart on crop detail:** it duplicates Want to grow.
- Invented kicker copy ("Sweet Roots", "Crunchy", "Monsoon cycle" in a winter flow), different bottom-nav tabs, and the phone status bar.

## 6. Decisions

- **User:** rebuild these screens from Stitch; plan good missing features instead of dropping them.
- **My calls:**
  - which features go in §3 versus §4;
  - client-side search over the fixed calendar;
  - sun as two levels per crop and three per place;
  - photos generated in Stitch and bundled;
  - the "Recommended" path rule;
  - Start now = add if needed, then the start sheet.

### 6.1 Settled after the builder check (my calls; these override the sections above)
1. **The crop journey page is a rebuild of the crop branch of `PlantDetailScreen`,** on the same `/plants/:id` route.
   - **New:** a crop header replaces the tree Hero for crops: photo or gradient, name, and the stage line. There is no health badge and no age line.
   - **Kept:** Seasons (YearOnYear), The Sanctuary Record and the Log a Moment button.
   - **Renamed for crops:** the bottom "Mark as ended" reads **"Stop growing this crop"**, so it's distinct from End season.
2. **Nursery sowing asks no place.**
   - The seeds → nursery path has two steps (path, method).
   - The transplant sheet (the `transplant` path) uses the same stepped style, and its step is where it grows.
   - The header reads "In the nursery · day N" for NURSERY, "In the bed · day N · <place>" for IN_GROUND, "Harvesting · day N · <place>" for HARVESTING, and "Want to grow" or "Resting until next season" otherwise.
3. **Photos are best-effort.**
   - Try generating a crop photo in Stitch.
   - Bundle whatever succeeds in `web/src/assets/crops/<id>.jpg` (≤ 60 KB each). Every crop without one shows the family-icon pebble.
   - No test depends on a photo being present (tests check the fallback).
   - If Stitch can't make standalone photos, ship the fallbacks and park "crop photos" in §4.
4. **Start now is allowed outside the sowing window,** with a gentle note in the start sheet: "Outside the usual sowing time in your region; it may struggle".
5. **The discovery header** is "<DISTRICT> · <MONTH> SOWING" (e.g. "PATNA · OCTOBER SOWING"). The guide's region-blind season name isn't used.

## 7. Done means

- **Tests (written first)** for:
  - the chooser (both paths, the Sow-now pill);
  - discovery (grid, Hindi name, collapsed Later, search, sunlight filter);
  - the detail endpoint and page (facts, steps per method, status wording, Start now);
  - journey header, next step, progress, harvest count, both rotation notes;
  - start sheet steps and the recommended badge;
  - place kind and sun.
- **e2e:** the loop goes Home "+" → Grow a vegetable → open palak → Start now → seeds → place → journey shows "day 0".
- **Suites:** all of them pass.
