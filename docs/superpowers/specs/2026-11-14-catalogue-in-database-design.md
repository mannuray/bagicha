# Plant catalogue in the database — design

Status: agreed in chat with the owner, 2026-11-14.

## Why

All plant reference data lives in TypeScript files today. A full admin app
(reporting, subscriptions, crop management and more) is planned. Its crop
management part will edit this data, so the data has to live in the
database, in a shape the admin app can work with. This project moves it
there. The admin app itself, and its login, come later.

## Goals

1. Every kind of plant reference data below is stored in Postgres (Neon),
   and the API reads it from there, not from code constants.
2. Users see no change: the same crops, dates, reminders, care and texts,
   and the same response times.
3. The owner's approval gate survives: a record reaches users only when it
   is approved.
4. Planting methods and care-step wording become data. A new method (corm,
   bulb) or step (lift and store) is a row, not a code change. Bulbs
   (roadmap item 10) are the first batch added this way, after stage 1.

## Non-goals

- The admin app, admin accounts and admin login. The owner's decision:
  admins get their own accounts with email and password, later.
- Endpoints for creating, editing or approving records. The owner's
  decision: skip them for now; changes reach the database by a push from
  the repo. The design must not block adding them later.
- Districts, region clusters, the district map and geometry stay in code;
  they are map data, not plant data.
- Crop photos stay bundled in the web app, keyed by crop id. Moving them
  to media storage comes with the admin app.
- Logic stays in code: the care engine, crop journey, task building,
  rotation warnings, overlay and mitigation rules.

## Anti-goals (a failure even if it works)

- Any user-visible change in dates, reminders or texts at a switch-over.
- An unapproved or half-written record shown to users.
- A page noticeably slower because it queries the catalogue per request.
- Losing the source notes that sit beside values today.

## What moves (all of it, in four stages)

| Stage | Data | From today |
|---|---|---|
| 1 | Vegetables and seasonal flowers (calendar, timings, care steps, guide, details), planting methods and their wording, care-step titles | `plant-ledger/domain/crop-calendar.ts`, `flower-calendar.ts`; `MATERIAL` and sow titles in `crop-plan.service.ts`; `CARE_TITLES` in `crop-journey.service.ts` |
| 2 | Fruit catalogue (varieties, fruit types, Hindi names, aliases), life profiles, perennial flowers | `plants/domain/fruit-catalogue.ts`, `plant-ledger/domain/species-life-profiles.ts`, `plant-ledger/domain/flower-care.ts` |
| 3 | Tree care per family and region (items, phases, doses, `sameAs`, pending regions, sources) | `plant-ledger/domain/care/*.ts` |
| 4 | Home season guidance per region and month | `seasonal/domain/season-guide.ts` |

Each stage ships and deploys on its own and leaves the app fully working.

## How it works (decided)

**Where data is edited, for now.** In plain data files in the repo, one
per kind, with the source notes kept beside each value (comments today
become a `source` or `notes` field). The owner's add-plant playbook is
unchanged: source check, owner's yes, a test pinning the approved values,
commit.

**The push.** A command, run like the Prisma migrations (Docker, against
Neon, by the owner), validates every data file and writes it to the
database: inserts new records, updates changed ones, and never deletes
(a record dropped from the files is reported, and retired by setting its
status). It is idempotent: running it twice changes nothing. It prints
what it added, changed and would retire.

**Approval status.** Each catalogue record has a status: `DRAFT`,
`APPROVED` or `RETIRED`. Until the admin app, the data file is the truth:
the push writes the status the file gives, and an edit to an approved
record goes live on the next push (the approval already happened in the
repo: source check, owner's yes, pinned test, commit). *(My call.)*
- Retiring is never automatic. A record is retired only by setting
  `RETIRED` in its file. A record that exists in the database but is
  missing from the files makes the push stop with an error and change
  nothing, so a broken or half-loaded file can never hide crops. *(My call.)*
- What `APPROVED` gates: listings, search, the sowing calendar, the
  catalogue and season guidance. Lookups by id (a user's existing plant,
  its journey, care and reminders) also find `RETIRED` records, so
  retiring a crop never breaks a garden that already grows it. `DRAFT`
  records are found by nothing. *(My call.)*
- When the admin app comes, it adds a draft version beside the approved
  one (so an edit can wait for approval while the approved version stays
  live). That is an added table, not a change to these. *(My call.)*

**Methods and wording as data.** A planting-methods table holds each
method's key and its texts (what to get before sowing: "seed potatoes",
"gladiolus corms"; the sow or plant title; the web labels). Care-step keys
hold their reminder title template ("Stake the {name} plants") and web
label. The web reads these labels from the API instead of from `en.json`
where it shows a method or step.
- A method also names its journey shape, one of the shapes the code
  knows: `NURSERY` (nursery, transplant), `DIRECT` (sow in the bed, thin)
  or `PLANT` (get material, plant it: tubers, cloves, rhizomes, and now
  corms and bulbs). A new method that fits a shape is a row; a new shape
  is code. *(My call.)* Today's branches on `NURSERY_TRANSPLANT`
  (`crop-plan.service.ts`, `crop-journey.service.ts`, web
  `growingSteps`) branch on the shape instead.
- The web stops validating methods against a fixed list
  (`web/src/features/crops/schemas.ts`), so a new method row can't break
  the calendar. That web change ships before the first new-method push.
- Care steps keep `after: SOWING | TRANSPLANTING` plus days. "Lift and
  store" for bulbs is a step N days after planting, taken from the
  sources. *(My call.)*

**Reading.** The API loads the approved catalogue into memory at start
and serves it from there. After a push it picks up the new data without a
restart, within about a minute (the push bumps a catalogue version; the
API checks it at most once a minute). If the database is unreachable at
start, the API fails to start rather than run with an empty catalogue.

**Same answers.** Before a stage switches over, a test loads the data
files through the same path the API uses and compares the result with
today's code constants field by field, for every record. The code
constants are deleted only after that test passes and the stage is live.

**Tree care approval (stage 3).** Status is per family. Today's partial
gates stay as data: `pendingRegions` (regions not yet checked keep the
season-pack advice) and families with no approved care fall back the way
`CARE_PENDING` families do now. *(My call.)*

**The existing catalogue table.** `plant_catalog_entries` is filled from
code on every API start (`PlantsService.bootstrapCatalog`). Stage 2
replaces that boot-time fill with the push, so nothing writes catalogue
data at start. *(My call.)*

**After the switch.** Domain functions keep taking plain objects
(`CropInfo` and friends), so the journey, care engine and their tests
keep working; only where the data comes from changes. Tests that pin
approved values read the data files.

**Later, with the admin app.** The database becomes the place data is
edited. The admin app adds edit and approve endpoints behind admin login,
and the data files and push retire. Nothing in this design needs to be
redone for that.

## Left to the builder

- Table design: relational columns for what is searched and filtered (id,
  kind, name, family, status, timestamps); structured JSON for nested
  parts (windows per climate group, region care, doses, phases), each
  validated against a strict schema on push and on load.
- The data-file format (JSON or typed TS) and the schema library.
- How the push runs: its own Docker target, or a step in the migrate image.
- How the version check is done, and cache structure.
- The exact order of work inside a stage.

## Order and deploys

1. Stage 1, then bulbs as the first push-only batch.
2. Stage 2, 3, 4.

Each stage: migration (new tables) → push (data) → deploy the code that
reads it. The owner runs the migration and push, as today.
