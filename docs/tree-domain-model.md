# Tree Domain Model

## Goal
Treat each tree as a long-lived biological record, not a flat CRUD entry.

The system should answer:
- what stage of life is this tree in
- what is happening in the current seasonal cycle
- what happened in previous harvest cycles
- what likely went wrong this season
- what should change before the next flowering or harvest

This model is the foundation for:
- tree ledger history
- seasonal intelligence
- task generation
- diagnosis context
- year-over-year comparison

## Core Principle
Each tree needs both:
- permanent identity and lifetime milestones
- repeating yearly seasonal cycle records

A tree is not just “current status.”
It is:
- identity
- lifecycle state
- yearly cycle summaries
- fine-grained event history
- task history
- diagnosis history

## Tree Layers

### 1. Identity Layer
Stable data about the tree.

Fields:
- `tree_id`
- `user_id`
- `name`
- `species_family`
- `species`
- `variety`
- `tree_type`
- `planted_context`
  - ground
  - pot
  - grow bag
- `location`
- `planting_date`

This should change rarely.

### 2. Lifecycle Layer
Long-term biological stage.

Recommended states:
1. `sapling`
2. `juvenile`
3. `first_flowering`
4. `first_harvest`
5. `mature_bearing`

Important distinction:
- `first_flowering` does not imply successful fruiting
- flowers may drop
- first fruit set may fail
- first successful harvest is a separate milestone

### 3. Seasonal Phase Layer
This changes inside each year or crop cycle.

Recommended phases:
- vegetative_growth
- pre_flowering
- flowering
- fruit_set
- fruit_development
- harvest_window
- post_harvest_recovery
- stress_management

Important distinction:
- lifecycle state = where the tree is in its life
- seasonal phase = where the tree is in the current yearly cycle

### 4. Event History Layer
Fine-grained evidence of what actually happened.

Recommended event types:
- planting
- observation
- watering
- watering_stress
- pruning
- feeding
- flowering
- flower_drop
- fruit_set
- fruit_drop
- harvest
- pest
- treatment
- diagnosis
- weather_damage
- note
- photo

This is the tree biography.

### 5. Cycle Summary Layer
One record per major yearly cycle or harvest cycle.

This is necessary because users want:
- comparison between years
- explanation of weak harvests
- mitigation guidance for the next cycle

Raw logs alone are not enough.

## New Domain Object: TreeCycle

Each tree should eventually have a set of cycle records.

Example:
- `Malda Mango - 2026 Cycle`
- `Malda Mango - 2027 Cycle`

Suggested fields:
- `tree_id`
- `cycle_year`
- `region_cluster`
- `species_family`
- `expected_flowering_window`
- `observed_flowering_at`
- `observed_fruit_set_at`
- `harvest_started_at`
- `harvest_completed_at`
- `yield_quantity`
- `yield_quality`
- `flower_drop_level`
- `fruit_drop_level`
- `stress_score`
- `pest_pressure_score`
- `treatment_count`
- `cycle_summary`
- `recommended_next_cycle_actions`

This gives the app a summary record per season.

## Lifetime Milestones

Each tree should eventually store milestone timestamps like:
- `planted_at`
- `first_flowering_at`
- `first_fruit_set_at`
- `first_harvest_at`
- `latest_harvest_at`

These improve:
- lifecycle accuracy
- future task timing
- year-over-year comparison
- premium diagnosis and planning

## Why This Looks Like A Chat Record
Yes, conceptually it should behave like a durable conversation record for the tree.

Not in the UI sense of a literal chat thread, but in the data sense:
- a chronological sequence of observations
- actions
- incidents
- outcomes
- follow-ups

This gives AI and non-AI systems the context they need.

For diagnosis, the tree history should act like context memory:
- what happened before
- what treatments were applied
- what phase the tree was in
- what the last harvest looked like
- what environmental stress happened recently

That is much better than diagnosing from one photo in isolation.

## AI Context Model

When AI is used for diagnosis, planning, or paid guidance, the tree context should include:

### Static Context
- species_family
- species
- variety
- lifecycle_state
- planted_context
- region_cluster

### Current Seasonal Context
- current seasonal phase
- expected next phase
- seasonal pack
- personalized overlay if paid

### Recent History Context
- last 10 to 20 important events
- recent pest events
- recent treatments
- dryness or water stress signals
- current open tasks
- latest diagnosis summaries

### Previous Cycle Context
- previous harvest quality
- previous flowering outcome
- previous fruit-set problems
- major stress or loss factors

This lets the system answer:
- what went wrong this harvest
- what changed from last year
- what to do differently next cycle

## Diagnosis Use Case

When a user asks:
- why is this tree weak
- why did fruits drop
- why did this harvest underperform

the system should be able to combine:
- image or symptom input
- recent events
- seasonal phase
- previous cycle summary
- treatment history

That creates much better diagnosis quality than isolated symptom analysis.

## Task Generation Model

Tasks should come from 3 sources:

### 1. Lifecycle Tasks
Examples:
- support sapling establishment
- structural pruning in juvenile phase
- first flowering observation

### 2. Seasonal Tasks
Examples:
- inspect panicles
- monitor fruit set
- prepare for harvest
- post-harvest care

### 3. Incident Tasks
Examples:
- water today because dryness is detected
- recheck leaves after treatment
- confirm if flower drop continues

Each task should link back to:
- a tree
- optionally a cycle
- optionally a seasonal pack
- optionally a personalized overlay
- optionally a diagnosis event

## Free vs Paid

### Free
Free users should get:
- tree history
- basic cycle summaries
- cohort seasonal tasks
- basic year-over-year comparison

### Paid
Paid users should get:
- personalized overlays
- tree-specific diagnosis context
- “what went wrong” explanations
- next-cycle mitigation plans
- adaptive tasks based on real events and stress

Example:
- `This harvest underperformed because flower drop was high after a dryness period during flowering. Next cycle, stabilize irrigation earlier and inspect fruit set every 5 days.`

## Recommended Backend Expansion

### Current Models Already Useful
- `Tree`
- `Log`
- `Task`
- `SeasonalPack`
- `PersonalizedOverlay`

### Next Models To Add
1. `TreeCycle`
2. `TreeMilestone`
   or milestone fields on `Tree`
3. richer structured event metadata on `Log`
4. optional `DiagnosisRecord`

## Implementation Plan

### Phase 1
Strengthen current ledger to capture normalized tree identity:
- species_family
- species
- variety

Use plant resolution before saving trees.

### Phase 2
Expand log/event taxonomy:
- flowering
- flower_drop
- fruit_set
- fruit_drop
- watering_stress
- diagnosis
- weather_damage

This is the minimum needed for meaningful cycle comparison.

### Phase 3
Add milestone support:
- first_flowering_at
- first_fruit_set_at
- first_harvest_at
- latest_harvest_at

### Phase 4
Add `TreeCycle` summary records:
- one per yearly harvest cycle
- generated from events plus user confirmation

### Phase 5
Use `TreeCycle + Log + SeasonalPack + PersonalizedOverlay` to generate:
- post-harvest summaries
- year-over-year comparisons
- next-cycle mitigation plans

### Phase 6
Use the same context for:
- premium diagnosis
- premium task generation
- tree-specific AI recommendations

## Product Outcome

If this model is implemented well, Bagicha can eventually tell a user:

- what stage the tree is in
- what is happening now
- what happened last harvest
- what likely reduced yield
- what should change before the next flowering or harvest

That is the real long-term value of the Tree Ledger.

## Shared Season Journal

The same entry format should also be reusable for crop and flower seasons, not only trees. The generic journal shape is documented in [season-journal-format.md](/Users/metallonudo/code/bagicha/docs/season-journal-format.md).
