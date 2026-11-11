# Old trees: milestones that know the tree's past

**Date:** 2026-11-11 · **Status:** approved in chat ("yes"), written up for the plan

## Why

People add trees they have had for years. A mango planted in 2017 shows "First flowering: Not yet", "First fruit set: Not yet" (screenshot, live app), and the first flowering they log now is saved as the tree's *first* — "Nov 2026" — which is false. Hardly anyone remembers the year a tree first flowered, so "fill in the milestones by hand" is not the main flow. The app already knows the planted year and, from the life profile, how long the species usually takes to fruit; it should use that, and ask one easy question.

## Goals

1. **One question when adding a tree:** "Has it fruited yet?" — *Yes* / *Not yet* / *Not sure* (default *Not sure*). With *Yes*, an optional "Since about which year?".
2. **Milestones read the tree's past.** For each "first" card (first flowering, first fruit set, first harvest), in order:
   1. a recorded date → shown as today (month year);
   2. the gardener said *Yes* → "Since {year}" if a year was given, else "Before Bagicha";
   3. *Not sure* (or never asked: every existing tree) and the tree is older than the species' latest usual first-fruit age → an estimate, "Around {from}–{to}" (or "Around {year}" when both ends are the same year), with a visible "estimated" mark. `from` = planted year + first-fruit min (years, rounded down), `to` = planted year + first-fruit max (rounded up);
   4. otherwise "Not yet".
   Cards in 2 and 3 count as reached (tick), styled like recorded ones; the estimate is visibly marked as an estimate.
3. **New logs don't rewrite history.** On a tree that already fruits — *Yes*, or *Not sure* and older than the latest usual first-fruit age (the same rule as 2.3) — logging flowering, fruit set or harvest does **not** set the `first_*` dates. Latest harvest still updates; the moment still goes in the record, year-on-year still counts it.
4. **Correctable.** The edit-tree form carries the same question. The milestones section has an "Edit" link to that form.
5. **Existing trees** get the estimate with no data change (their answer is "not asked").
6. **Stage agrees.** *Yes* means the growth stage is at least First harvest. *Not yet* means the age-based stage stops at Juvenile until something is recorded. The life line ("before its first fruit" / productive) treats *Yes* as fruit recorded.
7. **Back button** on the tree page scrolls with the page instead of floating over the task cards (it covered "Mark done").

## Non-goals

- Editing each milestone's own date by hand (the answer + since-year covers it; can come later).
- The question for flowers and crops. Trees only (record kind TREE). Flowers have their own blooming stages; crops have journeys.
- Changing care or first tasks for bearing trees (roadmap item 4+5+6).

## Anti-goals

- An estimate that looks like a recorded fact. It must say "estimated".
- Promising a date: ranges, "around".
- Any data migration that rewrites existing trees' milestones.

## Data

On `plants` (additive migration):
- `bearing_status` enum `BearingStatus { BEARING, NOT_YET }`, nullable. Null = *Not sure* / never asked.
- `bearing_since_year Int?` — only meaningful with BEARING; validated 1900..current year, and not before the planted year when the planted date is known; cleared when the status is not BEARING.

Create and update plant DTOs accept both (update: `null` clears). Plant detail and list responses return them (they return the row).

## Decided (builder's notes)

- The "older than the latest usual first-fruit age" rule is one shared function on each side (backend: journal milestones + stage; web: milestone cards), both using `life_profile.first_fruit_months[1]` and the planting date. No profile or no planting date → no estimate, firsts behave as today.
- Setting `bearing_status` on create/update recomputes the stage from scratch (not "never backwards"); that is how a wrong *Yes* is undone. (The form already clears the manual-stage flag on every save; unchanged.) *My call.*
- **Wrong firsts already recorded** (a 2017 mango whose first flowering was logged as Nov 2026 before this change): saving *Yes* with a since-year clears the `first_*` dates later than that year; with no year nothing is cleared (firsts logged in Bagicha may be real — final review), because the gardener just told us the firsts came earlier. Only on that save, never as a migration. *My call.*
- Switching a tree's record kind away from TREE clears both bearing fields. *My call.*
- The journal service needs the life profile: it resolves the species family the way the lifecycle service does (`species_family` or `SpeciesNormalizationService`).
- Copy: "Has it fruited yet?", "Yes", "Not yet", "Not sure", "Since about which year? (optional)", "Since {{year}}", "Before Bagicha", "Around {{from}}–{{to}}", "Around {{year}}", "estimated", "Edit".
- A bare planted year (stored as 1 January) counts from the **end** of that year for "past its first fruit" (both sides), so a young tree is never called old; the estimate spans earliest (1 Jan + min) to latest (end of year + max), never past this year. *Final review.*
- A stored since-year that a corrected planted year makes impossible is dropped, not a 422; a since-year the gardener sends that is out of range is a 422 with its own message. *Final review.*
