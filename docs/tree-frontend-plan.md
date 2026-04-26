# Tree Frontend Plan

## Goal
Make the tree flow usable for real gardeners, not just technically correct for backend fields.

The frontend should let a user:
- enter the tree or fruit name they actually know
- start a tree from any lifecycle stage
- enter approximate planting time
- see normalized identity without understanding taxonomy

This document focuses on Android frontend changes for the tree flow.

## UX Principles

### 1. Accept User Language
Users should type:
- `Malda`
- `Langra`
- `Nimbu`
- `Kinnow`

The app should resolve that into:
- species family
- normalized species
- variety

The user should not have to understand backend field names.

### 2. Separate User Input From Canonical Data
The visible field should be:
- `Tree or Fruit`

The canonical values should be:
- `species`
- `variety`

The app should auto-fill those from the resolver and allow manual correction.

### 3. Support Approximate Time
Users often do not know exact planting dates.

The frontend must support:
- `YYYY`
- `YYYY-MM`
- `YYYY-MM-DD`

This is essential for older trees.

### 4. Support Any Starting Stage
A user may onboard a tree that is already:
- sapling
- juvenile
- first flowering
- first harvest
- mature bearing

The frontend should never force everything into `Sapling`.

## Implemented In This Pass

### Add / Edit Tree Form
Implemented in:
- [AddTreeScreen.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/AddTreeScreen.kt)
- [LedgerViewModel.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/LedgerViewModel.kt)
- [ApiService.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/data/remote/ApiService.kt)

What now works:
- `Tree or Fruit` input instead of raw species-first entry
- backend-powered plant suggestions from `plants/search`
- final resolution on save via `plants/resolve`
- auto-filled normalized species and variety
- lifecycle stage includes `First Harvest`
- planting date accepts `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`
- inferred planting date precision is sent to backend
- milestone section on tree detail
- first-pass structured cycle-event logger for:
  - flowering
  - flower drop
  - fruit set
  - fruit drop
  - harvest
  - watering stress
  - pruning
  - feeding
  - pest / treatment / diagnosis
- richer metadata capture in the logger for:
  - harvest quantity / quality
  - fruit-set strength
  - pruning type
  - feeding type
- cycle-aware timeline grouping on tree detail:
  - logs grouped into yearly cycle sections
  - structured metadata shown on timeline cards
  - cycle sections summarize whether the year contains harvest or flowering history
- backend-driven cycle summaries on tree detail
- cycle comparison and mitigation section:
  - compares latest cycle against the previous cycle when available
  - shows what changed in harvest, stress, pests, and fruit set
  - surfaces next-cycle mitigation actions from backend cycle guidance
- tree task surfacing on tree detail:
  - fetches real backend tasks for the selected tree
  - supports task sync via seasonal materialization
  - shows priority, due date, source, and reason
- tree task actions on tree detail:
  - pending tasks can be marked done or skipped
  - task state refreshes after status change
- tree task grouping on tree detail:
  - overdue, upcoming, and completed/skipped buckets
  - pending work is no longer shown as one flat list
- task provenance on tree detail:
  - shows task source
  - shows the linked cycle year when available
- diagnosis and treatment follow-up tasks:
  - diagnosis-related logs now create follow-up tasks
  - task explanation can reference the originating diagnosis, pest, or treatment log
- diagnosis logs now drive action automatically:
  - pest diagnosis can create treatment follow-up
  - diagnosis can create recheck inspection
  - treatment can create recovery recheck
- backend-driven next-cycle mitigation plan on tree detail:
  - likely issues
  - what to change
  - what to watch early
  - priority actions
- structured harvest logging:
  - separate quantity value
  - unit
  - quality
  - loss / damage note
- season review on tree detail:
  - cycle summary plus completed / skipped / pending task counts
- mitigation plan now learns from task execution:
  - skipped tasks influence likely issues and next actions

## Current User Flow

### Tree Identity Entry
1. user types a familiar name like `Malda`
2. app shows suggestion rows from backend search
3. user can tap a suggestion
4. app shows a detected identity card
5. normalized `species` and `variety` are filled
6. if user does not tap a suggestion, save still attempts backend resolution

### Lifecycle Entry
Current choices:
- Sapling
- Juvenile
- First Flowering
- First Harvest
- Mature Bearing

### Planting Time Entry
Current accepted formats:
- `2020`
- `2020-06`
- `2020-06-15`

These are sent with inferred precision:
- `YEAR`
- `MONTH_YEAR`
- `EXACT_DATE`

## Next Frontend Work

### 1. Tree Detail Upgrade
Needed:
- show lifecycle state separately from seasonal phase
- show milestones:
  - first flowering
  - first fruit set
  - first harvest
  - latest harvest
- show current cycle summary when backend supports it

### 2. Timeline Upgrade
Needed:
- support richer event types visually
- filters by event group
- real backend `TreeCycle` summaries instead of only inferred year-grouping from log timestamps
- richer event review patterns:
  - filters by event family
  - jump between care, flowering, fruiting, and health events
  - highlight milestone events inside a cycle

### 3. Cycle Summary Screen
Needed:
- per-tree yearly cycle cards
- deeper cycle drill-down
- explicit cycle filters and navigation between years

### 4. Comparison UX
Needed:
- stronger causal explanation of what likely went wrong this harvest
- richer comparison when there are more than two cycles
- tie comparison directly into tree tasks and diagnosis follow-up

### 5. Task UX
Needed:
- richer task details for why this task matters in the current cycle
- diagnosis provenance when a task comes from a diagnosis or personalized overlay
- stronger completion feedback loops into cycle outcome summaries

### 6. Harvest UX
Needed:
- richer harvest loss taxonomy instead of only free-text loss note
- optional photo or grade evidence for harvest outcome

## Recommended Frontend Build Order

### Phase 1
- add/edit tree resolver flow
- approximate planting date input
- lifecycle stage expansion

### Phase 2
- tree detail milestone section
- lifecycle vs seasonal phase section

### Phase 3
- structured timeline event forms
- structured metadata review in timeline cards:
  - harvest quantity / quality
  - fruit-set strength
  - pruning type
  - feeding type
  - cycle grouping
  - better event review cards

### Phase 4
- backend-driven cycle summaries
- cycle summary screen
- comparison and mitigation UX

### Phase 5
- diagnosis context built from cycle comparison
- deeper cycle drill-down
- task-to-diagnosis linkage

### Phase 6
- stronger diagnosis summaries tied back to cycle outcomes

## Product Outcome
With these frontend changes, the tree flow becomes much more realistic for actual users:
- they can add old trees
- they can use familiar fruit names
- they can start from the correct stage
- the backend gets normalized data for seasonal routing and task generation

The event composer and timeline should also be treated as the base `season journal` pattern for future crop and flower flows. See [season-journal-format.md](/Users/metallonudo/code/bagicha/docs/season-journal-format.md).
