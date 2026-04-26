# Tree Seasonal Intelligence

## Goal
Use:
- tree species
- tree lifecycle stage
- broad user region
- current seasonal window
- user logs and signals when available

to produce:
- likely current phase
- likely next phase
- what to do now
- what to avoid now
- what to watch for
- tasks the user should complete next

This is the layer that makes the Tree Ledger operational instead of archival.

Related tree record model:
- [tree-domain-model.md](/Users/metallonudo/code/bagicha/docs/tree-domain-model.md)

## Product Split

### Free Users
Free users should get strong shared intelligence.

Model:
- one reusable guidance pack for a cohort
- no per-user AI call
- deterministic runtime selection

Example cohort:
- `north_india:mango:mature_bearing:spring`

Free output:
- current phase
- upcoming phase
- do now
- avoid now
- watch for
- shared task templates

### Paid / Power Users
Paid users should get a personalized overlay on top of the shared pack.

Model:
- shared base pack
- plus tree-specific adjustment
- plus personalized task creation

Paid output can use:
- recent tree logs
- observed flowering / fruiting
- pest history
- treatment history
- dryness / moisture status
- local weather summary
- container vs ground planting
- missed tasks
- previous cycle summary
- harvest history
- diagnosis history

This can create real tasks such as:
- `Water the tree today`
- `Inspect panicles within 3 days`
- `Delay pruning this week`
- `Spray only after confirming mildew symptoms`

It should also support higher-level paid outputs such as:
- what likely went wrong this harvest
- what changed from last year
- what to change before the next flowering or harvest

## Core Architecture

### 1. Seasonal Pack
This is the reusable intelligence unit.

It should be generated once for a cohort, not once per user.

Suggested key:

```text
<region-cluster>:<species-family>:<lifecycle-stage>:<season-window>:<pack-version>
```

Example:

```text
north_india:mango:mature_bearing:spring:v1
```

### 2. Personalized Overlay
This is the paid layer.

It should not replace the base pack.
It should refine it.

Overlay inputs:
- tree history
- recent logs
- observed phase
- dryness signal
- weather anomaly
- health records
- cycle summary
- milestone history
- previous harvest outcome

Overlay outputs:
- adjusted phase
- reprioritized actions
- suppressed actions
- personalized tasks
- reasoning summary
- mitigation suggestions

### 3. Runtime Selection
At request time:
1. map user to a broad region cluster
2. map tree species to a species family
3. map current date to a season window
4. fetch the matching seasonal pack
5. if user is paid, fetch or generate the overlay
6. return `base pack + optional overlay`

This keeps request-time cost cheap.

## Why This Uses AI Differently
AI should not be called every time a user opens a tree.

AI should be used to generate:
- cohort guidance packs
- task templates
- seasonal risk summaries
- structured explanations

This means AI cost scales with:
- number of cohorts

not with:
- number of users

That is the right architecture for large scale.

## Region Model
Start broad.

Suggested initial region clusters:
- north_india
- east_india
- west_india
- central_india
- south_deccan
- coastal_humid
- hills_cool

District can later refine routing, but the first routing layer should stay broad.

Example:
- Malda can map into `east_india` or a Gangetic plain cluster if we add that later
- it does not need a dedicated AI call

## Species Model
Start with species families, not exact cultivars.

Suggested families:
- mango
- citrus
- litchi
- guava
- pomegranate
- banana
- generic_perennial

Cultivar-specific nuance can come later.

## Season Window Model
Keep this coarse at first.

Suggested windows:
- late_winter
- spring
- summer
- monsoon
- post_monsoon

This keeps the cohort count manageable.

## Seasonal Pack Schema

Suggested JSON shape:

```json
{
  "region_cluster": "north_india",
  "species_family": "mango",
  "lifecycle_stage": "mature_bearing",
  "season_window": "spring",
  "current_phase": "flowering_or_fruit_set",
  "upcoming_phase": "fruit_development",
  "confidence": "medium",
  "do_now": [
    "Inspect panicles and fruit set closely",
    "Maintain stable irrigation",
    "Watch for early disease pressure after humidity rise"
  ],
  "avoid_now": [
    "Avoid heavy pruning",
    "Avoid irregular watering"
  ],
  "watch_for": [
    "Anthracnose",
    "Fruit drop"
  ],
  "task_templates": [
    {
      "key": "inspect_panicles",
      "title": "Inspect flowering panicles",
      "category": "inspection",
      "priority": "high",
      "due_in_days": 5
    },
    {
      "key": "maintain_irrigation",
      "title": "Check irrigation consistency",
      "category": "watering",
      "priority": "medium",
      "due_in_days": 2
    }
  ],
  "basis": "ai_generated_cohort_pack_v1"
}
```

Backend storage model in Prisma:
- `SeasonalPack`
- key fields:
  - `region_cluster`
  - `species_family`
  - `lifecycle_stage`
  - `season_window`
  - `pack_version`
- content fields:
  - `current_phase`
  - `upcoming_phase`
  - `confidence`
  - `do_now`
  - `avoid_now`
  - `watch_for`
  - `task_templates`
  - `basis`

## Personalized Overlay Schema

Suggested paid-layer JSON shape:

```json
{
  "tree_id": "tree_123",
  "base_pack_key": "north_india:mango:mature_bearing:spring:v1",
  "adjusted_phase": "fruit_set_delayed",
  "priority_actions": [
    "Inspect for heat stress within 2 days",
    "Confirm fruit set before changing feeding plan"
  ],
  "suppressed_actions": [
    "Do not schedule bloom-stage pruning advice"
  ],
  "personalized_tasks": [
    {
      "key": "water_tree_today",
      "title": "Water the tree today",
      "category": "watering",
      "priority": "high",
      "due_in_days": 0,
      "reason": "Dryness signal detected for this tree"
    }
  ],
  "reasoning_summary": "Tree is drier than expected for its cohort and needs immediate watering support.",
  "expires_at": "2026-04-25T06:00:00Z"
}
```

Backend storage model in Prisma:
- `PersonalizedOverlay`
- key fields:
  - `user_id`
  - `tree_id`
  - `seasonal_pack_id`
- content fields:
  - `adjusted_phase`
  - `priority_actions`
  - `suppressed_actions`
  - `personalized_tasks`
  - `reasoning_summary`
  - `expires_at`
  - `refreshed_at`

## Task Generation Model

### Shared Tasks
Base seasonal packs can generate shared tasks from `task_templates`.

Examples:
- inspect buds
- check fruit set
- monitor for mildew
- avoid pruning

These are cohort-level tasks and are appropriate for free users.

### Personalized Tasks
Paid overlays can create tasks from user-specific signals.

Examples:
- if dryness is detected, create `Water the tree today`
- if flowering is confirmed, create `Inspect fruit set in 5 days`
- if a pest log exists, create `Recheck affected leaves in 3 days`
- if a treatment was logged, create `Follow up on treatment response`
- if last harvest underperformed after flower drop, create `Stabilize irrigation before next flowering`

This is where premium value becomes real.

These tasks should use durable tree history, not just one isolated event.

### Rules For Personalized Task Creation
Paid task generation should still be structured.

It should not produce uncontrolled free text.

Each task should have:
- `key`
- `title`
- `category`
- `priority`
- `due_in_days`
- `reason`
- `source`

Example:

```json
{
  "key": "water_tree_today",
  "title": "Water the tree today",
  "category": "watering",
  "priority": "high",
  "due_in_days": 0,
  "reason": "Dryness signal detected for this tree",
  "source": "paid_personalized_overlay"
}
```

Backend storage model in Prisma:
- existing `Task` table extended with:
  - `title`
  - `category`
  - `priority`
  - `source`
  - `source_key`
  - `reason`
  - `metadata`
  - `seasonal_pack_id`
  - `personalized_overlay_id`

Task source values:
- `SYSTEM`
- `SEASONAL_PACK`
- `PERSONALIZED_OVERLAY`
- `MANUAL`

## Example: Malda Mango Tree

For a mango tree in Malda:

Free path:
1. map Malda to a broad region cluster
2. map mango to `mango`
3. map today to a season window
4. fetch the matching cohort pack

Paid path:
1. fetch the same cohort pack
2. inspect tree-specific signals
3. adjust the advice
4. create personalized tasks if needed

Example personalized trigger:
- soil or dryness signal indicates stress
- result: create `Water the tree today`

So the paid intelligence is:
- not a separate product
- not a separate agronomy engine
- but a personalized overlay over the same base intelligence

Over time, that overlay should use:
- tree event history
- yearly `TreeCycle` summaries
- milestone history
- diagnosis context

## Scale Story
This architecture supports large user counts because:
- the expensive part is cohort pack generation, not per-user inference
- the number of cohorts is limited
- base packs can be cached aggressively
- paid overlays can be event-driven and cached

Compute scales mostly with:
- regions
- species families
- lifecycle stages
- season windows

not with:
- raw active user count

## Implementation Order

### Phase 1
- define region clusters
- define species families
- define season windows
- define `SeasonalPack` schema
- define `task_templates` schema

### Phase 2
- build cohort routing logic
- store and serve reusable seasonal packs
- use packs for tree detail seasonal guidance

### Phase 3
- add `PersonalizedOverlay` schema
- generate paid overlays asynchronously
- generate personalized tasks from overlay outputs

### Phase 4
- add event triggers:
  - new log
  - observed phase
  - dryness signal
  - pest diagnosis
  - treatment follow-up
  - weather anomaly

### Phase 5
- connect overlays to tree cycle comparison
- generate next-cycle mitigation plans
- use cycle summaries for premium diagnosis context

## Product Decision
The correct long-term model is:
- free users get strong cohort intelligence
- paid users get personalized overlays and personalized tasks

This gives Bagicha:
- a scalable baseline
- a meaningful premium layer
- a path to automation such as
  - `Water the tree today`
  - `Inspect fruit set in 5 days`
  - `Recheck pest damage after treatment`
