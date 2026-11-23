# Planting-timed tree care (papaya) — design

Date: 2026-11-23. Step 2 of the tree-care order (citrus → **papaya** → pomegranate) set in
`2026-11-18-tree-care-in-catalogue-design.md`.

## Why

Papaya care is counted from the day it was planted, not from the calendar: first feed about
three months after planting, feeds every two months after that, a microbe booster at planting
and at six months. The catalogue already has a `FROM_PLANTING` anchor
(`catalogue/domain/tree-care.ts`), but the care engine only evaluates `CALENDAR`, so those
items show on the plant page with no date and never become reminders. This design makes
planting-timed items real reminders, then papaya care goes through the add-plant playbook
like citrus did.

**Success:** a papaya with a known planting month gets dated reminders for the steps still
ahead of it, a papaya without one is asked for the month and still gets its calendar care,
and nothing changes for the seven families already live.

## Owner decisions (2026-11-23)

Research found no common app pattern for a missing planting date, and the guides disagree on
papaya timing by a month or two (TNAU: flowers 4–5 months after planting; NHB: 6–7), so a
guessed date would make reminders wrong. The owner approved:

1. **Exact date or month + year: use it.** A month-only date counts from the **15th** of that
   month (stored as the 1st today). Papaya windows are weeks wide, so ±2 weeks is harmless.
2. **Year only or no date: no planting-timed reminders and no guessing.** The plant page asks
   "When did you plant it? Add the month to get papaya reminders", linking to the existing
   edit form. Calendar care (cold, monsoon waterlogging, aphids that spread virus) still runs.
3. **Steps that depend on what the gardener sees are tied to the sign, not a date.** Removing
   extra male plants is an "if you see it" item (once flowers appear, keep about 1 male to
   10–20 females). TNAU and NHB both time it by flowering, not by day.
4. **A papaya added late gets only the steps still ahead of it.** A two-year-old plant is never
   told to do its one-month feed.

## How it works

### Engine (`plant-ledger/domain/care/engine.ts`)

- `TreeCareInput` gains `plantingPrecision: PlantingDatePrecision`. The planting start used for
  timing is:
  - `EXACT_DATE` → `plantedAt`;
  - `MONTH_YEAR` → `plantedAt` + 14 days (the 15th);
  - `YEAR` / `UNKNOWN` → none.
- A `FROM_PLANTING` item's window is `start = plantingStart + fromDays`,
  `end = plantingStart + toDays`, at IST midnight like calendar windows. It is treated exactly
  like a calendar window from there: open now, or opening within the same 30-day lookahead,
  becomes a candidate; a window whose end has passed is skipped (decision 4); `conditional`
  items go to the page; the 3-reminder cap and priority order are shared with calendar items.
- The task key stays `${family}:${key}:${YYYY-MM-DD of start}`. If the gardener corrects the
  planting date, the starts move, the old pending reminders fall out of `current` and the
  existing `retireCareTasksExcept` cancels them; the new ones are created. No migration.
- With no usable planting start, `FROM_PLANTING` items are left out entirely (not shown
  undated on the page as today), and `treeCareDue` returns `needsPlantingMonth: true` when the
  tree's stage has at least one non-conditional `FROM_PLANTING` item that could still be ahead.
  For a year-only date that means counting from 31 December of that year: if every such window
  would have ended even then, the flag is `false` (asking would add nothing, decision 4).
  Otherwise `false`. *(Builder's call, from the builder check.)*
- `thisMonth` lists open and upcoming planting-timed items alongside calendar ones, by priority.
- `carePhaseView` is unchanged: phases stay calendar-only (papaya's phases are seasons).
- `FROM_CHOICE` stays unevaluated (pomegranate, step 3) and keeps today's on-page behaviour.

### Catalogue schema (`catalogue/domain/tree-care.schema.ts`)

- `phases[].when` must be `CALENDAR` (the engine ignores anything else, so other kinds would
  be dead data).
- `FROM_PLANTING`: `0 ≤ fromDays ≤ toDays`. Existing uniqueness (key + window start) already
  covers it.
- `FROM_PLANTING` items may not carry `dose`: `doseFor` scales by whole years of age, which is
  wrong for a plant a few months old. Papaya guides give an amount per plant per feed, so the
  amount goes in the `organic` / `chemical` text. The schema rejects `dose` on these items.
  *(Builder's call.)*
- Repeating steps (feed every two months) are written as **separate items** with their own
  keys and windows. No repeat field: the schema stays as it is and each occurrence is
  source-checked on its own.

### API and web

- `GET` tree intelligence adds `care_needs_planting_month: boolean`; the seasonal service
  passes `plant.planting_date_precision` to the engine in both places it calls it.
- `ThisSeason.tsx` shows the prompt (decision 2) with a link to the plant's edit form when the
  flag is true. English and Hindi strings in `en.json` / `hi.json`.
- Saving a plant whose planting date changed runs the existing materialize call afterwards
  (web, in `useUpdatePlant`, as `useCreatePlant` already does), so reminders appear and
  outdated ones are retired straight away, not at the next session. No cross-module call in
  the backend. *(Builder's call.)*
- The web zod schema for the intelligence response accepts the new field (optional, so an old
  API and a new web still work during the deploy window).

### Papaya care content

Through the add-plant playbook, unchanged: draft from TNAU / NHB / ICAR / state university
packages → line-by-line source check with links → owner review table → **no seed file before
an explicit yes** → `papaya.seed.ts`, remove `papaya` from `CARE_PENDING`. Open content
question for the draft: the catalogue lists papaya in east, south Deccan, coastal humid, west
and central India but not north India, although it is grown there (PAU has papaya
recommendations). The draft proposes adding `north_india` with PAU as its source, for the
owner to accept or not.

## Release order

1. Code release: engine, schema rule, API flag, web prompt. No catalogue change; no family
   has `FROM_PLANTING` items yet, so nothing visible changes. Deploy per `docs/deploy.md`
   (no Prisma migration).
2. Papaya care: seed after the owner's yes, then catalogue push. It uses the field the code
   from release 1 already knows (strict schemas: code first, data second).

## Tests

- Engine: exact date → reminder with the right start/end and key; month-only → counted from
  the 15th; year-only / unknown → no planting items and `needsPlantingMonth` true; a window
  already ended → skipped; a window 20 days ahead → a reminder due at its start; planting
  items share the cap of 3 with calendar items; changing the planting date changes the key.
- Schema: non-calendar phase rejected; `fromDays > toDays` rejected; `dose` on a planting-timed
  item rejected.
- Year-only date whose windows would all be over even from 31 Dec → flag false.
- Service: the flag reaches the API; precision is passed through.
- Web: prompt shows when flagged, hidden otherwise; saving a changed planting date calls
  materialize.
- Existing families: their current test suites pass unchanged (they have no planting items).

## Non-goals

- Bahar choice / `FROM_CHOICE` (pomegranate, next design).
- Guessing a planting date from age, size or flowering.
- Asking for the planting date anywhere but the existing edit form.
- Hindi for the care text itself (Hindi round 2).
- Banana and other planting-timed fruit (their own playbook runs later, on this engine).

## Left to the builder

Names of helpers, where the planting-start helper lives (engine or `planting-date.ts`), the
exact prompt wording within decision 2's meaning, test file layout.
