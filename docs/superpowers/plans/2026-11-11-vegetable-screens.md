# Vegetable Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the vegetable flow from the five Stitch screens: the chooser, discovery, crop detail, crop journey and stepped start sheet. Add the planned data: crop description, scientific name and sun needs, sun hours per place, search, and best-effort crop photos.

**Architecture:**
- **Backend:** the calendar gains `description`, `scientific_name` and `sun`. A `GET /crops/calendar/:id` detail endpoint exposes the full `CropInfo` for the user's climate group. `GardenPlace` gains `sun_hours`.
- **Web:** `features/crops` gains `AddToGardenSheet`, `CropDetailScreen`, `CropHero` and `JourneyHeader`; `CropsScreen` and `StartSheet` are rebuilt. `PlantDetailScreen`'s crop branch uses the new crop header and journey.

**Tech Stack:** NestJS 11 + Prisma 6; React 19 + TanStack Query 5 + zod 4 + Tailwind 4 (Vitest + MSW, Playwright).

**Spec:** `docs/superpowers/specs/2026-11-11-vegetable-screens-design.md`. **§6.1 overrides** the earlier sections.

## Global Constraints

- No fake data (spec §5). A missing photo falls back to the family-icon pebble.
- Month-level windows only. The discovery header is "<DISTRICT> · <MONTH> SOWING".
- Migrations are additive (`migrate diff` + `migrate deploy`), with no reset.
- Copy goes in `en.json`. TDD. Lint stays at the 15-warning baseline. Features import each other only through `index.ts`. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A crop with no photo shows the pebble fallback, never a broken image. (Task 3 test.)
2. A NURSERY crop's header has no place and reads "In the nursery · day N". (Task 5 test.)
3. Start now on an out-of-season crop shows the gentle note and still works. (Task 6 test.)
4. The "Suits my sunlight" filter is hidden when no place has sun set. (Task 3 test.)
5. Searching in Hindi (पालक) finds palak. (Task 3 test.)

---

### Task 1: Backend — crop detail endpoint, description and sun, place sun hours
**Files:**
- Modify: `backend/src/modules/plant-ledger/domain/crop-calendar.ts` (+ spec)
- Modify: `backend/src/modules/crops/{crops.service.ts, crops.controller.ts, dto/place.dto.ts}`
- Modify: `backend/prisma/schema.prisma`, plus a migration (`GardenPlace.sun_hours GardenSun?`, enum `GardenSun` = `FULL`, `PARTIAL`, `SHADE`)
- Test: the `crop-calendar` spec and `test/e2e/crops.e2e-spec.ts`

**Produces:**
- `CropInfo` gains `scientific_name: string`, `description: string` (one line) and `sun: 'FULL' | 'PARTIAL'`.
  - PARTIAL: palak, methi, coriander, lettuce, mustard_greens, ginger, turmeric.
  - FULL: the rest.
- The calendar list items include `scientific_name`, `description` and `sun`.
- `GET /crops/calendar/:id` returns the list item plus `germination_days`, `transplant_after_days`, `harvest_span_days`, `thin_after_days`, `succession_every_days`, `care` and `windows` (for the user's group, as `[{start_month, end_month, label}]`). An unknown id is 404 `CROP_NOT_FOUND`.
- Places accept and return `sun_hours` on POST and PUT.

- [ ] **Step 1: Failing tests:**
  - every crop has a non-empty description, a scientific name and a sun value;
  - e2e: the detail endpoint for tomato returns `transplant_after_days` `[25,30]`, `care` containing stake, and windows labelled `Sep–Oct` and `Jan–Feb` for EAST;
  - unknown → 404;
  - a place created with `sun_hours: 'PARTIAL'` returns it.
- [ ] **Steps 2–5:** run (FAIL), implement, run all backend unit and e2e tests, commit `feat(crops): crop detail, sun needs and place sunlight`.

### Task 2: Web — the "Add to your garden" chooser
**Files:**
- Create: `web/src/features/crops/AddToGardenSheet.tsx`
- Modify: `crops/index.ts`, `dashboard/DashboardScreen.tsx` (the "Add a tree" tile becomes "Add to garden", which opens the sheet), `plants/PlantListScreen.tsx` (the "+" opens the sheet), `en.json`
- Test: `crops/chooser.test.tsx`

**Produces:** `AddToGardenSheet({ onClose })`, a role="dialog" frosted sheet with "Plant a tree" (link `/plants/new`), "Grow a vegetable" (link `/crops`, with a "Sow now: <first 3 open crop short names>" pill from `useCropCalendar`) and Cancel.

- [ ] **Step 1: Failing tests:**
  - the dashboard "Add to garden" opens a dialog with both links;
  - the pill lists the open crops;
  - the My Plants "+" opens the same dialog;
  - Cancel closes it.
- [ ] **Steps 2–5:** run (FAIL), implement, run web checks, commit `feat(web): add-to-garden chooser`.

### Task 3: Web — discovery rebuilt to Stitch
**Files:** `crops/CropsScreen.tsx`, a new `crops/CropPhoto.tsx`, `crops/schemas.ts` (new fields), `crops/crops.test.tsx`, `en.json`

**Produces:**
- **Header:** "<DISTRICT> · <MONTH> SOWING" (district from the session user; month from the clock, uppercased) and "N crops to sow now".
- **Search** field.
- **Filters:** Container-friendly, Easy for beginners, Quick harvest, and "Suits my sunlight" (shown only if some place has `sun_hours`; it keeps crops whose `sun` fits the sunniest place: FULL needs FULL, PARTIAL needs FULL or PARTIAL).
- **Sow now:** a 2-column grid of cards with `CropPhoto`, name, Hindi name (the first alias matching `/[ऀ-ॿ]/`), window and method line, first harvest, and a round "+" (or ✓). The card links to `/crops/:id`.
- **Coming up:** a horizontal row.
- **Later:** a collapsed button "Later: Okra, Gourds…" that expands to cards.
- **`CropPhoto({ cropId, family })`:** an `<img>` from `assets/crops/<id>.jpg` when it exists (an import map built with `import.meta.glob`), otherwise a family-icon pebble.

- [ ] **Step 1: Failing tests:**
  - the header reads "PATNA · <MONTH> SOWING";
  - the Hindi name is shown;
  - Later is collapsed and expands;
  - searching "पालक" leaves only palak;
  - the sunlight filter is hidden with no sunny places and works with one;
  - a crop without a photo renders the fallback (`role="img"` with the crop name, no `<img>` with a broken src);
  - the card links to `/crops/palak`.
- [ ] **Steps 2–5:** run (FAIL), implement, run web checks, commit `feat(web): what can I sow now, rebuilt from Stitch`.

### Task 4: Web — crop detail page
**Files:** a new `crops/CropDetailScreen.tsx`, `crops/api.ts` (`useCropDetail(id)`), `app/routes.tsx` (`/crops/:cropId`), `en.json`; test `crops/detail.test.tsx`

**Produces:**
- **Hero:** photo or gradient; kicker `<family>` · `<method>`; name plus Hindi; scientific name in italics; description.
- **Status card:** "Sow now (Sep–Nov)", "Opens in N days (Sep–Oct)", "Next sowing: Feb–Mar", or "Not usually grown in your region".
- **Facts:** Germinates; Transplant (nursery only); First harvest.
- **How it grows:** steps by method:
  - NURSERY: seeds, nursery tray, transplant, then the care keys, then harvest;
  - DIRECT: seeds, sow, then thin if set, then the care keys, then harvest;
  - TUBER, CLOVE, RHIZOME: material, plant, care, harvest.
- **How much to plant.**
- **Good to know:** a family rotation tip and a succession note.
- **Sticky buttons:** "Add to Want to grow" (or "On your list") and "Start now". Start now adds the crop if needed (POST `/crops/plan`, which returns the plant), then navigates to `/plants/<plantId>?start=1`.

- [ ] **Step 1: Failing tests:**
  - tomato shows the three facts, the steps "Nursery tray → Transplant → Stake → Harvest", and the rotation tip naming the family;
  - palak shows no transplant fact and has a Thin step;
  - out of season shows "Next sowing";
  - Start now posts the plan and navigates with `?start=1`.
- [ ] **Steps 2–5:** run (FAIL), implement, run web checks, commit `feat(web): crop detail page`.

### Task 5: Web — the crop journey page
**Files:**
- Create: `crops/CropHero.tsx`, `crops/JourneyHeader.ts` (pure `cropStatusLine` and `nextStep`)
- Modify: `crops/JourneyCard.tsx`, `biography/PlantDetailScreen.tsx` (the crop branch uses `CropHero`; the end button copy for crops; `?start=1` opens the start sheet), `biography/sections/EndSheet` copy for crops, `en.json`
- Test: `crops/journey.test.tsx`

**Produces:**
- **`cropStatusLine(plant, openSeason, placeName, now)`:**
  - "In the nursery · day N";
  - "In the bed · day N · <place>" (the place is omitted if unknown);
  - "Harvesting · day N · <place>";
  - "Want to grow";
  - "Resting until next season".
- **`nextStep(tasks)`:** the earliest pending CROP_PLAN task, as `{ title, dueKey }`.
- **JourneyCard additions:**
  - the next-step line;
  - "Day N of about <min>–<max>" before HARVESTING;
  - "N harvests this season" (HARVEST entries with this season's `plant_cycle_id`, from the timeline);
  - the rotation note, positive when `last` is set and `conflict` is false.
- **Crop end button:** "Stop growing this crop".

- [ ] **Step 1: Failing tests:**
  - NURSERY header "In the nursery · day 5" with no place;
  - IN_GROUND header with the place;
  - the next-step line from the tasks;
  - "Day 12 of about 30–40";
  - "2 harvests this season";
  - the positive rotation note;
  - `?start=1` opens the start sheet;
  - the end button reads "Stop growing this crop".
- [ ] **Steps 2–5:** run (FAIL), implement, run web checks, commit `feat(web): crop journey page from Stitch`.

### Task 6: Web — the stepped start sheet, place kind and sun
**Files:** `crops/StartSheet.tsx`, `crops/PlacePicker.tsx`, `en.json`; test `crops/journey.test.tsx`

**Produces:**
- **Sheet:** frosted (the Log a Moment style), with kicker "START THIS SEASON" and a step indicator (3 dots, or 2 for seeds → nursery and for transplant).
- **Step 1:** option cards, with a "Recommended" badge on Seeds for direct, tuber, clove and rhizome crops, and on Bought seedlings ("Quickest") for nursery crops.
- **Step 2:** method, with the hint built from `transplant_after_days`.
- **Step 3:** place, with:
  - the rotation advice;
  - a sun note when `crop.sun === 'FULL'` and `place.sun_hours` is PARTIAL or SHADE;
  - an out-of-season note when the crop's status isn't open.
- **PlacePicker "Add a place"** asks the name, the kind pills (Bed, Grow-bag, Pot, Container, Ground) and the sun pills (Full sun, Partial, Shade, optional).

- [ ] **Step 1: Failing tests:**
  - the recommended badge per method;
  - the nursery hint text;
  - the sun note for a tomato into a PARTIAL place;
  - the out-of-season note;
  - add-a-place posts `{name, kind:'BED', sun_hours:'FULL'}`;
  - the existing start-sheet tests still pass.
- [ ] **Steps 2–5:** run (FAIL), implement, run web checks, commit `feat(web): stepped start sheet with sun and place kind`.

### Task 7: Crop photos (best-effort)
- [ ] **Generate:** try generating one crop photo in Stitch (`generate_screen_from_text` with a photo-only prompt in project 7116397477334778532). If an IMAGE screen results, generate the rest, download each with `mcp__stitch__download_file`, shrink it with `sips` to ≤ 60 KB JPEG and save it as `web/src/assets/crops/<id>.jpg`.
- [ ] **Fallback:** if generation fails or times out repeatedly, ship the fallbacks and add "Crop photos" to spec §4. Ledger the outcome.
- [ ] **Verify:** run the web checks, and confirm `CropPhoto` picks up the bundled files. Commit `feat(web): crop photos`.

### Task 8: e2e, verification, final review
- [ ] **e2e:** extend `loop.spec.ts`: Home "Add to garden" → Grow a vegetable → open the palak card → Start now → I have seeds → add place "Terrace bag" (Grow-bag, Full sun) → Start season; the journey header reads "In the bed · day 0 · Terrace bag". Screenshots: `14-discover`, `15-crop-detail`, `16-crop-journey`.
- [ ] **Suites:** all backend and web suites, then the final review per executing-plans.
