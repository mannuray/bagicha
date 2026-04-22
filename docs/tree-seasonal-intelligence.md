# Tree Seasonal Intelligence

## Goal
Use:
- user location
- current date
- tree species
- tree lifecycle stage

to infer:
- likely current seasonal phase
- likely next phase
- what the user should do now
- what the user should avoid now
- what the user should watch for

This is the layer that makes the Tree Ledger feel intelligent instead of passive.

## Product Model

### 1. Expected Phase
System-generated inference.

Examples:
- pre-flowering
- flowering
- fruit set
- fruit development
- harvest window
- post-harvest recovery
- vegetative growth
- dormancy / slow growth

### 2. Observed Phase
User-confirmed reality.

Examples:
- buds visible
- flowering started
- fruit set seen
- harvest complete

V1 will implement **expected phase** only.
Observed phase can be added later through user logs and confirmations.

## Why This Should Not Start With AI
For this feature, AI is the wrong first abstraction.

Reason:
- phase inference is mostly rule-driven
- rules are auditable
- rules are cheaper
- rules are deterministic
- rules can be cached aggressively
- rules are much easier to scale for very large user counts

So V1 should be:
- deterministic
- species-aware
- month-aware
- stage-aware
- location-aware at a coarse level

## V1 Inputs
- tree species
- tree lifecycle stage
- user district
- user latitude / longitude
- current month

## V1 Outputs
- current_phase
- upcoming_phase
- confidence
- do_now[]
- avoid_now[]
- watch_for[]
- next_checkpoint_days
- basis

## V1 Rule Style
Rules should be:
- species-centric first
- region-light, not region-heavy
- safe and conservative

Meaning:
- prefer “likely entering flowering” over exact prediction
- prefer “watch for mildew” over hard disease certainty
- do not pretend biology is exact from date alone

## Supported V1 Tree Profiles
Start with:
- Mango
- Lemon / Citrus
- Litchi
- Guava
- Generic fallback for unsupported species

These are enough to prove the model.

## Example V1 Output

```json
{
  "species_family": "mango",
  "current_phase": "pre_flowering",
  "upcoming_phase": "flowering",
  "confidence": "medium",
  "do_now": [
    "Inspect terminals for bud initiation",
    "Maintain steady but not excessive watering",
    "Use light nutrition only if tree is not stressed"
  ],
  "avoid_now": [
    "Do not do heavy pruning",
    "Avoid overwatering during cool spells"
  ],
  "watch_for": [
    "Powdery mildew",
    "Early hopper activity"
  ],
  "next_checkpoint_days": 7,
  "basis": "month_window+species_rule+lifecycle_stage"
}
```

## Scalability Architecture

This feature must support very large numbers of users.

### Good Architecture For Scale
Use a **stateless inference service**.

Properties:
- no per-request model calls
- no external API required for baseline result
- pure function from user/tree/date context to guidance
- cheap CPU work
- horizontally scalable

### Request-Time Cost
At request time:
1. fetch tree
2. fetch user location/profile
3. run in-memory rules
4. return structured result

This is inexpensive and works well initially.

### Next Scale Step
As usage grows:
- precompute daily or weekly seasonal state for common species + districts
- cache results in Redis
- reuse cached guidance across many users in the same region and month

This works because many users share:
- species
- month window
- climate zone or district

### Better Cache Key
Example:

```text
tree-seasonal:v1:<species-family>:<lifecycle-stage>:<district>:<month>
```

This is far more scalable than per-user unique computation.

### Why This Scales Well
Because computation complexity is based more on:
- number of species rules
- number of regions/month windows

than on:
- total user count

That means hundreds of thousands of users are still manageable if:
- rules stay deterministic
- outputs are cacheable
- DB access stays indexed and minimal

## Recommended Data Flow

### V1
- tree detail page requests seasonal state on demand
- dashboard may later request per-tree summaries

### V2
- nightly or morning jobs generate seasonal states for active trees
- save or cache summaries for dashboard rendering
- push urgent alerts only for state transitions or weather risk changes

## Boundaries

### Tree Ledger Owns
- permanent assets
- lifecycle stage
- logs
- tree seasonal intelligence

### Seasonal Engine Owns
- balcony and rotating plants
- flowers and vegetables
- weather-driven general advice
- broader seasonal planning

This separation matters.

Tree seasonal intelligence is:
- per-tree
- perennial
- profile-driven

Seasonal engine is:
- broader
- more dynamic
- often non-permanent

## Future Extensions
- user-confirmed observed phase
- phase transition reminders
- weather-adjusted confidence
- district-specific rule packs
- species-specific task generation from inferred phase
- dashboard summaries like “2 trees entering flowering window”

## V1 Implementation Decision
Implement:
- backend-only seasonal inference endpoint for a tree
- deterministic rules engine
- supported species families + generic fallback

This creates a stable base that can later power:
- dashboard cards
- alerts
- tree detail guidance
- task generation
