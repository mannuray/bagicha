# Bagicha Tree Ledger V1 Plan

## Purpose
Build the Tree Ledger as the next real end-to-end feature after onboarding.

This document turns the earlier product draft into a practical implementation target for the current codebase.

## Product Position
The Tree Ledger is the long-lived inventory system for permanent plants and trees.

It should answer:
- What permanent assets does the user have?
- What stage is each asset in?
- What has happened to it over time?
- What care history, harvest history, and health history exist for it?

Longer term, it should also answer:
- What went wrong this harvest?
- What was different from last year?
- What should change before the next cycle?

Detailed domain model:
- [tree-domain-model.md](/Users/metallonudo/code/bagicha/docs/tree-domain-model.md)

## Scope Decision
Tree Ledger V1 will focus on **permanent assets**:
- fruit trees
- non-fruit trees
- ornamental long-lived plants

It will **not** try to model short seasonal balcony crops in V1.

Reason:
- the current backend schema is already tree-centric
- this keeps scope controlled
- seasonal vegetables and flowers need a different model and should live in the Seasonal Engine later

## Important Product Note
Seasonal remains a high-priority follow-up feature.

Why:
- many real users are balcony gardeners
- those users are more likely to manage flowers, herbs, and rotating seasonal plants than permanent orchard trees
- after Tree Ledger V1 is stable, Seasonal should be the next major build target

So the sequence is:
1. Tree Ledger V1
2. Seasonal Engine V1

## Current State In Repo

### Backend
Already present:
- tree create endpoint
- tree list endpoint
- tree detail endpoint
- add log endpoint
- timeline endpoint
- lifecycle calculation
- background perennial task generation

Files:
- [backend/src/modules/tree-ledger/tree-ledger.controller.ts](/Users/metallonudo/code/bagicha/backend/src/modules/tree-ledger/tree-ledger.controller.ts)
- [backend/src/modules/tree-ledger/tree-ledger.service.ts](/Users/metallonudo/code/bagicha/backend/src/modules/tree-ledger/tree-ledger.service.ts)
- [backend/src/modules/tree-ledger/services/lifecycle.service.ts](/Users/metallonudo/code/bagicha/backend/src/modules/tree-ledger/services/lifecycle.service.ts)
- [backend/src/modules/tree-ledger/processors/task.processor.ts](/Users/metallonudo/code/bagicha/backend/src/modules/tree-ledger/processors/task.processor.ts)

### Android
Currently mostly mock UI:
- mock list data
- mock detail data
- add tree screen does not submit
- no real ledger API integration

Files:
- [android/app/src/main/java/com/bagicha/app/ui/features/ledger/LedgerViewModel.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/LedgerViewModel.kt)
- [android/app/src/main/java/com/bagicha/app/ui/features/ledger/TreeListScreen.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/TreeListScreen.kt)
- [android/app/src/main/java/com/bagicha/app/ui/features/ledger/TreeDetailScreen.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/TreeDetailScreen.kt)
- [android/app/src/main/java/com/bagicha/app/ui/features/ledger/AddTreeScreen.kt](/Users/metallonudo/code/bagicha/android/app/src/main/java/com/bagicha/app/ui/features/ledger/AddTreeScreen.kt)

## Tree Ledger V1 Goal
Ship a real, backend-driven ledger that users can actually use.

V1 is still the base layer.
The full tree domain will later expand into:
- yearly cycle summaries
- milestone tracking
- diagnosis context
- next-cycle mitigation planning

## Tree Ledger V1 Feature Scope

### 1. Add Tree
Allow user to create a permanent asset with:
- name
- species
- optional variety
- type
- planting date

V1 will not require:
- photo upload
- rich metadata
- geotagging per tree

### 2. Tree List
Show the authenticated user’s real trees from backend.

List card should include:
- name
- species
- type
- lifecycle stage
- health status
- planting date or age summary

### 3. Tree Detail
Load real backend detail for one tree.

Show:
- name
- species
- variety
- type
- lifecycle stage
- health status
- planting date
- timeline preview

### 4. Timeline / Logs
Load real timeline entries from backend.

Supported V1 log types:
- note
- harvest
- pest diagnosis
- treatment
- photo as metadata-ready, but not required for first pass

### 5. Add Log
Allow user to log an event against a tree.

V1 log creation should support:
- log type
- content
- optional metadata JSON assembled by UI when needed

## Explicit Non-Goals For V1
- seasonal crop modeling
- companion planting logic
- offline sync
- media upload pipeline
- full yearly cycle comparison
- post-harvest mitigation analysis
- diagnosis-aware tree memory
- yield charts
- advanced pest history visualizations
- premium gating

## Backend Gaps To Close
- verify response shapes are clean for Android consumption
- add any missing DTO validation polish
- confirm timeline response contract
- optionally add task read endpoints later, but not required for first ledger cut

## Android Gaps To Close
- create real ledger API layer
- replace mock `LedgerViewModel` data with backend state
- wire Add Tree screen to create endpoint
- wire list screen to fetch real trees
- wire detail screen to fetch selected tree detail
- wire timeline UI to backend timeline
- add log creation flow
- handle loading, empty, and error states

## Recommended Build Order

### Phase 1
- Android ledger API models and repository
- fetch real tree list
- render empty state if user has no trees

### Phase 2
- submit Add Tree form to backend
- refresh list after creation

### Phase 3
- fetch real tree detail
- fetch timeline

### Phase 4
- add log creation
- refresh detail/timeline after logging

## UX Notes
- keep the current visual language where possible
- prioritize correctness over decorative placeholder content
- avoid fake text like fixed specimen names or invented histories once real data is wired

## Seasonal Follow-Up
After Tree Ledger V1, Seasonal should be the next major feature.

Seasonal V1 should likely target:
- flower and balcony gardeners
- seasonal planting windows
- weather-sensitive reminders
- lightweight rotating crop/flower guidance

This is especially important because many users may have:
- pots
- terrace plants
- flowers
- seasonal vegetables

These users may not identify strongly with an orchard-style ledger, so Seasonal must follow soon after Tree Ledger.

## Tree Domain Follow-Up
After the current ledger base is stable, the tree model should evolve into:
- lifecycle state
- seasonal phase
- structured event history
- yearly `TreeCycle` summaries
- milestone tracking
- AI-usable context for diagnosis and mitigation

That work is described in:
- [tree-domain-model.md](/Users/metallonudo/code/bagicha/docs/tree-domain-model.md)
