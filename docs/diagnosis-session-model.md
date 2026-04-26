# Diagnosis Session Model

Bagicha diagnosis should not be stored as raw chat only and should not be collapsed into a single tree log.

The correct structure is:

- `DiagnosisSession`
- `DiagnosisOutcome`
- season-journal events derived from the diagnosis
- follow-up tasks derived from the outcome

## Why

This separates four different concerns:

- interaction context
- structured conclusion
- historical agronomy evidence
- action plan

If these are collapsed together:

- diagnosis history becomes noisy
- season comparison becomes weak
- tasks lose provenance
- AI context becomes harder to reuse

## Canonical Flow

1. User asks for diagnosis with image and optional note.
2. AI produces a structured diagnosis result.
3. System stores a `DiagnosisSession`.
4. System stores a `DiagnosisOutcome`.
5. System writes one or more season journal entries:
   - always `DIAGNOSIS`
   - optionally `PEST_DIAGNOSIS`, `FRUIT_DROP`, `FLOWER_DROP`, `WATERING_STRESS`, or `WEATHER_DAMAGE`
6. System creates follow-up task(s) from the outcome.

## Data Model

### DiagnosisSession

Represents the working diagnosis interaction.

Fields:
- `subject_type`
  - `TREE`
  - later `CROP_SEASON`
  - later `FLOWER_SEASON`
- `subject_id`
- `tree_id`
- `status`
- `messages`
- `attachments`
- `started_at`
- `closed_at`

This is interaction context, not final agronomy truth.

### DiagnosisOutcome

Represents the structured conclusion.

Fields:
- `session_id`
- `tree_id`
- `event_at`
- `primary_issue`
- `secondary_issues`
- `symptoms`
- `confidence`
- `severity`
- `affected_part`
- `reasoning_summary`
- `recommended_actions`
- `needs_follow_up`
- `follow_up_days`
- `attachments`

This is the persistent diagnosis summary that AI, tasks, and the season journal can all reuse.

## Season Journal Linkage

Diagnosis should write season-journal records, not replace them.

Expected linkage:
- one `DIAGNOSIS` log always
- one domain event when justified

Examples:
- pest issue -> `PEST_DIAGNOSIS`
- fruit drop issue -> `FRUIT_DROP`
- flower drop issue -> `FLOWER_DROP`
- dryness/water stress -> `WATERING_STRESS`
- weather injury -> `WEATHER_DAMAGE`

## Task Linkage

Diagnosis tasks must be tied to the outcome.

Examples:
- inspect again in 3 days
- apply treatment
- recheck fruit drop after irrigation correction

Tasks should store:
- `diagnosis_outcome_id`
- `reason`
- `due_date`
- `tree_cycle_id`

## Current Implementation

The current Bagicha backend now supports:

- persisted `DiagnosisSession`
- persisted `DiagnosisOutcome`
- linkage from logs and tasks back to `DiagnosisOutcome`
- automatic journal entries from diagnosis
- automatic follow-up task creation from diagnosis

This is the right base for:

- tree diagnosis
- future crop-season diagnosis
- future flower-season diagnosis
