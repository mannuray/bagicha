# Season Journal Format

Bagicha should treat tree, crop, and flower history as one reusable concept:

- a long-lived journal for a living asset or season
- with structured entries underneath
- not as raw chat only
- not as rigid forms only

## Core Idea

Each item keeps a persistent journal:

- identity
- milestones
- cycles
- tasks
- diagnosis
- event history

The journal should feel natural to the user, but every entry must remain structured enough for:

- seasonal summaries
- diagnosis
- task generation
- next-cycle mitigation
- cross-cycle comparison

## Canonical Entry Shape

Every season journal entry should support:

- `type`
  - `FLOWERING`, `FRUIT_SET`, `HARVEST`, `FLOWER_DROP`, `WATERING_STRESS`, `DIAGNOSIS`, etc.
- `event_at`
  - when the event actually happened
- `recorded_at`
  - when the user or system recorded it
- `content`
  - optional human note
- `metadata`
  - event-specific structured fields
- `attachments`
  - image/media references stored inside metadata for now
- `cycle_link`
  - attached to the correct season cycle

Example:

```json
{
  "type": "HARVEST",
  "event_at": "2026-06-14T12:00:00.000Z",
  "recorded_at": "2026-06-15T08:32:21.000Z",
  "content": "Fruit size was smaller than last year, some cracking after rain.",
  "metadata": {
    "quantity_value": 3.5,
    "quantity_unit": "kg",
    "quality": "FAIR",
    "loss_category": "WEATHER_DAMAGE",
    "loss_note": "Cracking after unseasonal rain",
    "attachments": [
      {
        "kind": "image",
        "url": "https://..."
      }
    ]
  }
}
```

## Why This Format

This hybrid format is correct because it supports both:

- user-friendly journaling
- machine-readable analysis

It works for:

- perennial trees
- seasonal flower beds
- rotating balcony crops
- harvest reviews
- diagnosis context

## Current Backend Direction

The current Bagicha implementation now aligns to this model more closely:

- `tree_logs.timestamp` is treated as `event_at`
- `tree_logs.recorded_at` stores when the record was created
- `metadata` carries structured event fields
- logs are linked to `tree_cycle_id`

This means the storage model is already usable as a generic season journal, even though the surrounding product still uses tree-focused naming in many places.

## Product Direction

UI should eventually present this as:

- `Add update`
- quick event types
- optional note
- optional photo
- optional backdated event date

The backend should continue storing it as:

- typed event
- event date
- recorded date
- structured metadata
- cycle-linked record

That format can be reused cleanly for:

- tree lifecycle journals
- crop season journals
- flower season journals

Diagnosis should not be stored as raw chat inside this journal. It should be stored as `DiagnosisSession + DiagnosisOutcome`, which then writes structured season-journal evidence and follow-up tasks. See [diagnosis-session-model.md](/Users/metallonudo/code/bagicha/docs/diagnosis-session-model.md).
