# Plant Identity Resolution

## Goal
Users should not need to understand the difference between:
- species
- species family
- fruit type
- cultivar / variety

If a user types something like:
- `Malda`
- `Langra`
- `Nimbu`
- `Kinnow`

the system should resolve that into normalized plant identity data that the backend can use consistently.

Example:
- input: `Malda`
- resolved:
  - `species_family = mango`
  - `species = mango`
  - `variety = malda`

This feature supports:
- onboarding
- add tree / edit registry
- seasonal intelligence
- task generation
- search and filtering
- future analytics

## Product Principle
The app should accept user language and convert it into structured horticultural identity.

That means:
- users enter what they know
- backend resolves it
- app stores normalized fields

This is better than asking users to manually provide taxonomy-heavy fields.

## Data Model

### Canonical Identity Fields
For each plant entry, the system should aim to store:
- `species_family`
- `species`
- `variety`
- optionally raw user input for traceability

### Example
For a Malda mango tree:
- `species_family = mango`
- `species = mango`
- `variety = malda`

This is better than:
- `species = Malda`

because seasonal and task engines need normalized species routing.

## Backend Catalog

The backend now includes a `PlantCatalogEntry` model.

Schema fields:
- `species_family`
- `species`
- `variety`
- `display_name`
- `plant_type`
- `aliases[]`
- `languages`
- `regions[]`
- `confidence_weight`
- `active`

Table:
- `plant_catalog_entries`

This table acts as the canonical plant identity catalog for search and resolution.

## Resolver Strategy

### Search First
The resolver should use a catalog and retrieval strategy first.

It should not rely on a free-form AI guess for every query.

Flow:
1. normalize user input
2. exact alias match
3. display name match
4. partial / fuzzy alias ranking
5. return best candidate + alternatives

This makes plant resolution:
- cheaper
- more controllable
- easier to improve
- more consistent than direct AI guessing

### AI Later
AI is still useful later, but not as the first layer.

Good future uses for AI:
- ambiguous candidate reranking
- mixed-language messy input
- colloquial phrase normalization

But the base system should remain:
- catalog-driven
- retrieval-driven

## Implemented Backend Endpoints

### Search
`GET /api/v1/plants/search?q=malda`

Purpose:
- typeahead / searchable picker

Typical response:
```json
{
  "items": [
    {
      "id": "...",
      "display_name": "Malda Mango",
      "species_family": "mango",
      "species": "mango",
      "variety": "malda",
      "plant_type": "fruit_tree"
    }
  ]
}
```

### Resolve
`POST /api/v1/plants/resolve`

Request:
```json
{
  "query": "malda aam",
  "region_cluster": "east_india",
  "language": "hi"
}
```

Typical response:
```json
{
  "match": {
    "id": "...",
    "display_name": "Malda Mango",
    "species_family": "mango",
    "species": "mango",
    "variety": "malda",
    "plant_type": "fruit_tree",
    "matched_alias": "malda"
  },
  "confidence": "high",
  "matched_alias": "malda",
  "alternatives": []
}
```

## Seeded Catalog Scope
The initial catalog includes common entries such as:
- Mango
- Malda Mango
- Langra Mango
- Amrapali Mango
- Lemon / Nimbu
- Kinnow
- Mosambi
- Guava
- Litchi
- Pomegranate / Anar
- Banana

This is an initial operational seed, not the final crop database.

## How This Should Be Used In Product

### Onboarding / Add Tree
Best UX:
- ask `What tree or fruit is this?`
- user types or searches
- app calls `resolve`
- app auto-fills normalized identity

If confidence is high:
- use the resolved identity directly

If confidence is medium or low:
- show suggestions and ask for confirmation

### Add Tree Example
User input:
- `Malda`

Resolved identity:
- `species_family = mango`
- `species = mango`
- `variety = malda`

Saved record:
- `name = user-chosen tree name`
- `species = mango`
- `variety = malda`

This prevents the system from misclassifying the tree as `generic_perennial`.

## Relationship To Seasonal Intelligence
This feature directly improves seasonal intelligence.

Without normalization:
- `Malda` might be treated as unknown

With normalization:
- `Malda` correctly routes to the mango cohort

That means:
- better seasonal packs
- better task generation
- better paid overlays

## Relationship To Species Normalization
The backend also includes a species normalization helper for existing tree records.

That helper:
- maps cultivar-like names such as `Malda` to a species family such as `mango`

The plant catalog feature is the better upstream solution.

Difference:
- species normalization fixes classification after the fact
- plant identity resolution fixes the data before it is stored

Both are useful, but plant identity resolution is the better entry-point solution.

## Current Implementation Notes

Implemented:
- Prisma model for `PlantCatalogEntry`
- migration for `plant_catalog_entries`
- `plants` backend module
- search endpoint
- resolve endpoint
- startup catalog seeding

Important runtime note:
- the backend must restart after deployment so the new module loads
- seeding happens on module init

## Recommended Next Step
Wire the Android onboarding / add-tree flow to:
- call `plants/search` for typeahead
- call `plants/resolve` on submit
- store normalized `species` and `variety`

That will improve:
- ledger quality
- seasonal routing
- personalized tasks
- future analytics
