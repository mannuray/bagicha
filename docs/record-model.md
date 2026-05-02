# Plant Model — Bagicha's Generalized Growing Record

This document supersedes the tree-only framing in `tree-domain-model.md`.
The Prisma model is now `Plant`; the underlying tables (`trees`,
`tree_cycles`, `tree_logs`) keep their names via `@@map`/`@map` so no
DB migration was needed. A `Plant` in the database is the persistence
engine for a generic growing record — tree, flower, crop, or recurring
seasonal practice.

## The mental model

A record in Bagicha is a **persistent biographical entry** for something a
user grows: a tree, a flower, a recurring vegetable line, a one-off seasonal
batch. The same engine drives all categories. What differs is:

- the **record kind** — what category of plant
- the **growth habit** — biological truth (perennial / annual / etc.)
- the **record pattern** — how the user thinks about continuity

The record is long-lived. It accumulates events, cycles, tasks, and diagnoses
over its lifetime. A single record can span many seasons or years; some
seasons may be skipped, some failed, some bumper.

Historically this model was named **Tree** because the first surface was
tree journaling. The Prisma models, services, controllers, and Android
types now read **Plant** / **PlantCycle** / **JournalEntry** consistently.
The DB tables stay `trees` / `tree_cycles` / `tree_logs` (preserved via
`@@map` so the migration was code-only). API routes are `/ledger/plants/*`
and `/ledger/plants/:id/journal`.

## The five layers

Every record has the same five layers regardless of kind:

1. **Identity** — species, variety, kind (TREE / FLOWER / CROP), category
   (fruit-bearing / non-fruit-bearing / ornamental), planted context,
   planting date. Rarely changes.
2. **Lifecycle stage** — current biological phase
   (SAPLING → JUVENILE → FIRST_FLOWERING → FIRST_HARVEST → MATURE_BEARING).
   Auto-inferred from planting age unless `lifecycle_stage_manual=true`.
3. **Event history (Journal)** — append-only timeline of observations:
   flowering, drop, harvest, pest, treatment, photo, note, etc.
4. **Cycle summary** — one `PlantCycle` per recurring growth window. Auto-
   derived from journal events.
5. **Seasonal / personal overlay** — guidance for "what to do now". Today:
   hardcoded month + species + lifecycle rules. Roadmap: SeasonalPack cohorts
   (free) + PersonalizedOverlay (paid).

## Two discriminators: `growth_habit` and `record_pattern`

The record's product behavior is positioned by two fields. Both already
exist in the schema and Android model.

**growth_habit** (biological truth)

| Value | Example |
|---|---|
| `PERENNIAL` | mango, rose, jasmine |
| `ANNUAL` | lettuce, marigold |
| `BIENNIAL` | some ornamentals |
| `SEASONAL` | most winter crops |
| `UNKNOWN` | fallback |

**record_pattern** (product behavior)

| Value | Meaning |
|---|---|
| `LONG_LIVED` | same biological organism continues year over year |
| `RECURRING_SEASONAL` | the user re-grows the same line every season — same place / variety / intent. One continuous record, many cycles |
| `ONE_OFF_SEASON` | single season, no continuation expected |

The two fields are **independent**. The same biological habit can have
different patterns depending on user intent:

- Tomato grown every winter in the same balcony bag →
  `growth_habit=ANNUAL`, `record_pattern=RECURRING_SEASONAL`. One record,
  many cycles.
- Friend's one-time spinach batch →
  `growth_habit=ANNUAL`, `record_pattern=ONE_OFF_SEASON`. One record, one
  cycle, then archived.
- Mango tree → `growth_habit=PERENNIAL`, `record_pattern=LONG_LIVED`.

Smart defaults by `record_kind` (Slice 1):

| record_kind | growth_habit | record_pattern |
|---|---|---|
| `TREE` | `PERENNIAL` | `LONG_LIVED` |
| `FLOWER` | `PERENNIAL` | `LONG_LIVED` |
| `CROP` | `ANNUAL` | `RECURRING_SEASONAL` |

The user can override either before saving.

## Why one record, many cycles

Continuity is the whole product value:

- "My tomato did better this year than last."
- "I skipped last monsoon."
- "Fruit drop got worse this cycle."
- "This flower batch failed two winters in a row."

If every season created a new record, that continuity disappears. So a
single plant holds many `PlantCycle` rows, each tracking one growth window
(annual fruiting for a tree, winter crop for tomato, season for marigold).

A cycle can be:

- `active` — currently in progress
- `completed` — closed on harvest done / season end
- `failed` — the cycle ended without yield
- `skipped` — user chose not to grow that year

## Implicit cycles

A cycle is **not** something the user creates manually. It begins implicitly
when a domain event fires:

- pre-flowering observation
- flowering log
- fruit set log
- first seasonal care event tied to that crop window

It accumulates as the journal grows (flowering → drop → fruit set → pest
/ treatment → harvest), and closes when:

- harvest is completed
- a post-harvest recovery state is reached
- the next cycle begins

The user records **events**; the system maintains the **cycle bucket**. At
key milestones the app may ask a confirmation ("Did flowering begin?"), but
never requires the user to pre-create a cycle.

After harvest, the system generates:

- the cycle summary
- a "what went wrong" review
- a draft next-cycle mitigation plan

## The hybrid journal format

A journal entry is a **typed structured event with optional free-text and
attachments**. Not raw chat, not a rigid form.

```jsonc
{
  "type": "HARVEST",
  "event_at": "2026-06-14",
  "note": "Fruit was smaller than last year, some cracking after rain.",
  "metadata": {
    "quantity_value": 3.5,
    "quantity_unit": "kg",
    "quality": "FAIR",
    "loss_category": "WEATHER_DAMAGE"
  },
  "attachments": [],
  "plant_id": "plant-...",
  "plant_cycle_id": "cyc-..."
}
```

**Mandatory** — `type`, `event_at`.
**Optional but rich** — `note`, `metadata`, `attachments`.

`metadata` schema is scoped per event type:

| Event type | Metadata fields |
|---|---|
| FLOWERING | intensity |
| FRUIT_SET | strength |
| FLOWER_DROP / FRUIT_DROP | severity |
| HARVEST | quantity, unit, quality, loss_category, loss_note |
| PRUNING | pruning_type |
| FEEDING | feeding_type |
| WATERING_STRESS | severity |
| PEST_DIAGNOSIS | pest_type, severity |
| TREATMENT | treatment_type |
| DIAGNOSIS | diagnosis_outcome_id, symptoms, suspected_issue, confidence |
| NOTE | (free-text only) |
| PHOTO | (URL in `content`) |

**Composer UX** — typed quick-action chips (Flowering / Fruit Set / Harvest
/ Stress / Photo / Treatment / Note). Each opens just the right structured
fields, plus an optional free-text note and a photo. Quick capture, but
analyzable under the hood.

## Event vocabulary by record kind (Slice 2)

The current `LogType` enum is tree-biased. To support flowers and crops we
need additional event types, gated by `record_kind` in the composer:

**For TREE** — current set:
PLANTING, PHOTO, NOTE, WATERING, WATERING_STRESS, PRUNING, FEEDING,
FLOWERING, FLOWER_DROP, FRUIT_SET, FRUIT_DROP, HARVEST, PEST_DIAGNOSIS,
TREATMENT, DIAGNOSIS, WEATHER_DAMAGE.

**For CROP** — add:
SOWING, TRANSPLANTING, GERMINATION, THINNING, BOLTING, SEASON_END.

**For FLOWER** — add:
PINCHING, DEADHEADING, BLOOM_PEAK, SEASON_END.

The composer surfaces only the relevant subset for the record's kind. The
storage taxonomy stays unified.

## Diagnosis pipeline (Slice 3)

When the user chats with AI about an issue (fruit drop, pest, leaf spots,
etc.), the conversation produces **three artifacts** with separable scope:

```
DiagnosisSession  →  DiagnosisOutcome  →  Journal Events + Tasks
   (memory)            (conclusion)         (history)   (action)
```

**DiagnosisSession** — temporary working memory.
Fields:
- `id`, `subject_type` (TREE / CROP_SEASON / FLOWER_SEASON), `subject_id`
- `messages`, `attachments`
- `started_at`, `closed_at`, `status` (OPEN / RESOLVED / DISMISSED)

This is for the back-and-forth interaction. AI reads it for context. Not
the source of truth for agronomy.

**DiagnosisOutcome** — persistent conclusion. The agronomic truth.
Fields:
- `id`, `diagnosis_session_id`, `subject_id`, `event_at`
- `primary_issue` (pest / fungal / watering_stress / nutrient / weather /
  unknown)
- `secondary_issues[]`, `symptoms[]`, `affected_part`
- `severity`, `confidence`
- `reasoning_summary`, `recommended_actions[]`
- `needs_follow_up`, `follow_up_days`
- `attachments[]`

**Journal events** — what actually enters the timeline. From one outcome we
may create:
- one `DIAGNOSIS` event (always) — references `diagnosis_outcome_id` in
  metadata
- zero or more domain events (`PEST_DIAGNOSIS`, `FRUIT_DROP`,
  `WATERING_STRESS`, `WEATHER_DAMAGE`) when the conclusion justifies it

**Tasks** — derived from `recommended_actions`, with provenance:
- `source = AI_DIAGNOSIS`
- `reason = reasoning_summary`
- linked to outcome (and cycle if appropriate)

This four-way split keeps **conversation**, **conclusion**, **history**, and
**action** independently queryable. Conversation feels natural; the journal
stays clean and analyzable; tasks have clear provenance.

## Naming: where things landed

| Concept | Prisma model | DB table (legacy) | API route | Android type |
|---|---|---|---|---|
| The persistent growing entity | `Plant` | `trees` | `/ledger/plants` | `Plant` |
| One growing window | `PlantCycle` | `tree_cycles` | nested | `CycleSummary` |
| One journal event | `JournalEntry` | `tree_logs` | `/journal` segment | `JournalEntry` |
| Action follow-up | `Task` | `tasks` | nested | `PlantTask` |
| Diagnosis chat | `DiagnosisSession` | `diagnosis_sessions` | `/diagnosis/finalize` | (TBD) |
| Diagnosis conclusion | `DiagnosisOutcome` | `diagnosis_outcomes` | nested | (TBD) |

The DB tables stay tree-named because column/table renames would force a
real migration. Code, API, and Android types now use Plant terminology
consistently. `RecordKind` (TREE/FLOWER/CROP) and `RecordPattern`
(LONG_LIVED/RECURRING_SEASONAL/ONE_OFF_SEASON) are kept since they
categorize the plant rather than name the entity.

## What's live vs. roadmap

**Live today**
- Persistent record with five-layer model (identity / lifecycle / journal /
  cycles / mitigation)
- `growth_habit` + `record_pattern` fields end-to-end
- AddPlantScreen exposes both pickers
- Plant alias normalization (substring match against family alias table)
- Hardcoded seasonal phase + guidance (month + species + lifecycle stage)
- Implicit cycle assignment on log write
- Auto-populated milestones (`first_flowering_at`, `first_fruit_set_at`,
  `first_harvest_at`, `latest_harvest_at`)
- Tasks materialised from log type (e.g. PEST_DIAGNOSIS → INSPECT)
- Mitigation plan synthesised from cycles + recent logs
- PlantDetailScreen shows identity / lifecycle (chip + watermark) / seasonal
  phase / next-up tasks / mitigation / cycle history / journal

**Roadmap (slices)**
1. **Slice 1** — smart defaults for `growth_habit` / `record_pattern` keyed
   off `record_kind`; tighten user-facing copy from tree-only to
   record-generic.
2. **Slice 2** — extend `LogType` vocabulary for crops and flowers; gate
   composer chips by `record_kind`.
3. **Slice 3** — `DiagnosisSession` → `DiagnosisOutcome` pipeline that
   writes structured journal events + follow-up tasks.
4. **Slice 4** — `SeasonalPack` cohort generation
   (region × species × stage × season) replacing hardcoded rules.
5. **Slice 5** — `PersonalizedOverlay` (paid tier) — per-record adjustments
   using the record's own events + history.
6. **Slice 6** — Event-driven phase inference using
   `first_flowering_at` / `first_fruit_set_at` etc. to refine the seasonal
   phase output beyond pure month-of-year.
