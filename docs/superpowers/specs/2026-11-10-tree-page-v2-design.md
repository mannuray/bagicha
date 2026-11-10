# Tree Page v2 ("The Botanical Record") — Design

**Date:** 2026-11-10
**Builds on:** Slice 1 web app on branch `backend-cleanup` (`web/`), and the slice 1 spec `2026-11-10-web-slice1-core-loop-design.md`.
**Standard:** `docs/coding-principles.md` (web review in `web/README.md`).
**Product sources:**
- `docs/bagicha-prd.md` §3.1 and §5;
- `docs/record-model.md`;
- `docs/season-journal-format.md`;
- `docs/tree-domain-model.md` ("Cycle Summary Layer", "Lifetime Milestones");
- `docs/tree-frontend-plan.md` ("Next Frontend Work").

## 1. Why

The tree page (`/plants/:id`, `web/src/features/biography/PlantDetailScreen.tsx`) is the tree's biography. The docs promise one record across many years ("one record, many cycles"). The page currently shows what to do now, but not the tree's story or how this year compares with last, even though the backend already stores both. Several sections are also duplicated or decorative.

The page is reorganised around the six questions a tree owner has:
1. How is my tree, and what stage is it at?
2. What should I do now?
3. What is its story?
4. Was this year better or worse than last?
5. What went wrong, and what do I change next season?
6. How long have we been together? (legacy and memory)

## 2. Goals: the page, top to bottom

Everything uses the Stitch "Botanical Record" look: serif headings, pebble cards, no divider lines, and the tighter sizing used elsewhere in the app.

1. **Hero**
   - **Photo:** the user's latest moment photo. If there isn't one, use the bundled Stitch mango-tree photo (`src/assets/stitch/tree-hero.jpg`), not the gradient.
   - **Text:** name, then species · variety.
   - **Age line (new):** "Planted 2015 · 11 years". Use the planting date at its precision: a year-only date gives "11 years"; a recent planting gives months, e.g. "8 months"; no planting date means no line.
   - **Badge:** the existing health label (Healthy / Needs attention). This is also where vitality would go (see §2.9).
2. **At a glance** (one compact card)
   - **Lifecycle stage:** a 5-step track (Sapling → Juvenile → First flowering → First harvest → Mature bearing). It replaces the large growth-ring drawing.
   - **Season phase:** "Now: <adjusted or current phase> → next: <upcoming phase>", taken from the seasonal pack and premium overlay the page already loads.
   - The two must read as different things: stage is lifelong, phase is this season.
3. **This season:** only **Avoid** and **Watch for**. "Do now" is removed because the same templates become tasks, so they already appear under Upcoming care.
4. **Upcoming care:** unchanged. Shows the next 3 pending tasks, with "See all" linking to the tree's Daily Path.
5. **Year on year (new)**, built from `GET /ledger/plants/:id/cycles` (all pages):
   - **Yield bars:** one bar per cycle year that has a yield. If units differ, use the unit of the latest cycle that has a yield; years in other units show their value as text without a bar.
   - **Latest vs previous:** compares the latest cycle with the previous one on yield, flower drop level, fruit drop level and pest pressure, each with a better / worse / same marker. A missing value shows "—", with no marker.
   - **Season review:** the link for the latest cycle goes to the existing Season review screen, which reviews only the latest cycle.
   - **Fewer than 2 cycles:** "Log harvests to start comparing", showing the single year's numbers if there are any.
   - This section **replaces** the separate "Cycles" section and the standalone "Season review" link.
6. **Milestones (new):** a horizontal strip with Planted, First flowering, First fruit set, First harvest and Latest harvest. The dates come from `planting_date`, `first_flowering_at`, `first_fruit_set_at`, `first_harvest_at` and `latest_harvest_at`. The backend already returns these on `GET /ledger/plants/:id`; the web schema has to add them. A milestone that hasn't happened yet is shown muted, with no date.
7. **The Sanctuary Record** (the timeline, renamed from "Geological Path")
   - **Year groups:** entries are grouped by the year of their event date, newest first. A year header is followed by its entries.
   - **Cards:** Stitch layout, with a type kicker, date (e.g. "Mar 12"), note and photo. Structured metadata shows as tags:
     - harvest: "120 kg · Good";
     - flower or fruit drop: severity ("Heavy drop");
     - other types: no tags.
   - **Filters (new):** chips for All, Care, Bloom & fruit, Harvest, Health, and Notes & photos. Filtering happens **on the server** (see §5.1), so "Show earlier moments" pages through the filtered set. The type families are:
     - **Care:** WATERING, PRUNING, FEEDING, TREATMENT
     - **Bloom & fruit:** FLOWERING, FRUIT_SET, FLOWER_DROP, FRUIT_DROP
     - **Harvest:** HARVEST
     - **Health:** PEST_DIAGNOSIS, DIAGNOSIS, WATERING_STRESS, WEATHER_DAMAGE
     - **Notes & photos:** NOTE, PHOTO, PLANTING
   - Any other type appears under All only.
8. **Memory card (new, in-app):** one card near the top, shown only when an anniversary falls in the current month (IST):
   - the planting month, if the planting date precision includes a month: "11 years ago this month, Aam was planted.";
   - the month of `first_harvest_at`, in a later year: "3 years ago this month: Aam's first harvest.".

   If both apply, show only the planting one. There is no push notification (see §2.9).
9. **Placeholders.** These are not built: nothing shows in the UI, and the code carries a `TODO(<name>)` comment at the spot where the feature would go, saying what it needs.
   - **Vitality %**, at the hero badge. It needs a backend health score; `health_status` is only a label today.
   - **Push memory reminders**, in the memory-card module. They need a notification service, scheduling and permission, none of which exist.
   - **Sustenance score**, in the Profile status card. `users.ranking_points` exists, but nothing awards points and the API doesn't return it. It needs the PRD's earning rules (organic practices, compost logs, community).

## 3. Removed

- **Botanical Essence bento:** family repeats the species, "Perennial" is obvious for a tree, and the entry count adds nothing.
- **Large growth-ring drawing:** replaced by the stage track.
- **"Do now" list:** duplicates the tasks.
- **"Cycles" section and standalone "Season review" link:** merged into Year on year.

## 4. Non-goals and anti-goals

- **Non-goals:**
  - crop- and flower-specific pages (record patterns, SOWING and other new event types), which is slice 2 in `record-model.md`;
  - editing milestones;
  - a health score;
  - push notifications;
  - points rules;
  - the Stitch "Vitality 94%" number.
- **Anti-goals:**
  - **Made-up numbers.** Vitality, scores and comparisons appear only when backed by stored data; a missing value shows "—", never a guess.
  - **Client-side filtering of paged data.** It would make "no harvests" look true when they are just on an unloaded page.
  - **Losing the seasonal loop.** This season, upcoming care and the season review stay one tap away.

## 5. Decisions

### 5.1 Backend change (small)
- `GET /ledger/plants/:id/timeline` accepts an optional `types` query: a comma-separated list of `LogType` values, validated against the enum. An unknown value returns 422 `VALIDATION_ERROR`, the app's existing validation convention.
- The default (no `types`) behaves exactly as today. Paging is unchanged.
- Add an entry to `docs/api-changes-slice0.md`.

### 5.1b Backend change: yearly yield is the season total
- Today `cycle-summary.ts` stores the **latest** harvest's quantity as the cycle yield.
- It becomes the **sum of all HARVEST entries in the cycle that share the unit of the latest harvest that has an amount**. Harvests in other units are left out of the sum; quality stays the latest harvest's.
- Stored cycles pick this up the next time their summary is recalculated. There is no backfill, because nothing is deployed yet.

### 5.2 Decided by the user
- Build the six-question page above, including the removals.
- Build the "not now" items where possible; otherwise leave a placeholder with a code comment saying it still needs building. The timeline filters and the in-app memory card are built; vitality, push reminders and the sustenance score are placeholders.

### 5.3 My calls (the user can override)
- Year groups use the event date's year rather than cycle records, so entries without a cycle still group.
- The memory card is tree-page only for now (no dashboard card).
- The hero fallback is the Stitch mango photo, bundled like the other Stitch photos.
- Comparison "better/worse": higher yield is better; lower drop level or pest pressure is better.
- **Which cycles are compared** (from the builder check):
  - Only *finished* seasons are compared: a cycle whose year is before the current IST year. A harvest logged this year does **not** finish the season, because a first pick isn't the season total (changed after the final review).
  - The current year is listed as "so far", showing its yield so far, with no bar and no comparison.
  - "Latest vs previous" compares the two most recent finished seasons.
  - The Season review link stays on the latest cycle, as the existing screen works.
- **Missing values:**
  - Drop level `UNKNOWN` means "not logged" and shows "—" with no marker. `NONE` is a real value, better than LOW.
  - Pest pressure is shown as **"Pest reports logged: N"**. It's a count of logs, so 0 is a true statement and is compared like any other number.

## 6. Left to the builder

- Component split inside `features/biography` (keep files focused; features import each other only through `index.ts`).
- Exact copy beyond the strings quoted here (all strings go in `en.json`).
- Chart rendering: simple CSS bars, with no chart library.

## 7. Done means

- Every section above renders from real backend data, with loading, error-with-retry and empty states.
- Tests (written first) cover:
  - backend yield total (same unit summed, other units ignored);
  - finished-season selection;
  - age line formatting;
  - stage track;
  - removal of "Do now";
  - yield bars, including mixed units;
  - latest vs previous markers;
  - milestones, including muted missing ones;
  - year grouping;
  - metadata tags;
  - server-side filter requests;
  - memory card rules;
  - backend `types` validation (unit and e2e).
- The web build, lint, unit tests, boundaries, cycles and Playwright e2e pass, as do backend build, lint, jest and e2e.
