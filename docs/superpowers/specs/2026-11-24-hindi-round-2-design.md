# Hindi round 2 (tree care and season tips) — design

Date: 2026-11-24. Item 11 of the data-polish roadmap. Round 1 (screens, catalogue names and texts)
and round 2a (crop, perennial-flower and default reminder titles) are live. This round covers
what stages 3–4 moved into the catalogue and is still English only.

## Why

A gardener using the app in Hindi sees Hindi screens but English tree-care reminders, English
plant-page care steps ("This month", "Only if you see it", avoid / watch), English season phase
names and English home season tips. These are now all catalogue data, so Hindi can be added as
data and edited by a push.

**Success:** with the app in Hindi, every tree-care reminder title, plant-page care line, phase
name and home season tip shows in everyday Hindi, owner-reviewed; English is unchanged; a field
with no Hindi falls back to English.

## Scope

In:
1. **Tree care** (13 families, citrus kinds included): per item `title`, `organic`, `chemical`,
   `why`, `conditional`; per phase its name, `avoid` and `watch`.
2. **Home season tips** (7 regions × 12 months): `season`, `headline`, `points`.
3. **Reminder titles in lists**: tree-care reminders already saved show in Hindi (looked up from
   the catalogue by their task key, as round 2a does for crops and flowers).

Out: dose amounts (`amount` lines are numbers and product names: "For a 6-year-old tree: 30 kg
FYM …" — the units already read in both; translating the template is a later polish), typed
reminders, AI diagnosis text, the review docs.

## How

**Data (code first, then content — strict schemas):**
- `TreeCareItem.hi?: { title?; organic?; chemical?; why?; conditional? }` (all optional strings,
  title ≤ 60 characters like the English).
- `PhaseWindow.hi?: { phase?: string; avoid?: string[]; watch?: string[] }`; when given, `avoid`
  and `watch` must have the same length as the English lists (validator issue otherwise).
- `SeasonMonth.hi?: { season?; headline?; points?: string[] }`; `points` same length as English.
- Phase names: today the web humanises the snake-case key ("fruit_development" → "fruit
  development"). With `hi.phase` the API sends a ready label in Hindi; English keeps the key and
  the web keeps humanising it.

**API (`Accept-Language`, `RequestLang`, as round 1):**
- `GET seasonal/plant/:id/intelligence` and `GET seasonal/guide` take the request language and
  return Hindi where written, English otherwise. The pack view gains `current_phase_label` /
  `upcoming_phase_label` (null when no Hindi; the web then humanises the key as today).
- Reminder lists: `PlantNamesService.titler('hi')` also translates `TREE_CARE` tasks: from the
  task's source key (`family:key:…`, family may be `citrus:<kind>`) it finds the item and uses its
  `hi.title`. A reminder's saved English title stays in the database.

**Content:**
- Hindi drafted per family and for the season tips in everyday Hindi (round 1's style guide and
  glossary: plain words a gardener uses — खाद, गोबर की खाद, छिड़काव, दस्ताने; product names stay as
  written; numbers as digits).
- **Owner review gate:** one Claude Doc per batch (tree care; season tips) with English beside
  Hindi; nothing is pushed before an explicit yes.

**Release order:** code release (schemas accept `hi`, API serves it, web shows labels) → then
the catalogue push with the Hindi content. Pushing content first would make the live API reject
the catalogue on its next restart.

## Tests

- Validator: `hi` accepted; a Hindi `avoid` list of a different length rejected; a Hindi title over
  60 characters rejected; unknown `hi` keys rejected.
- Engine/service: with lang `hi`, care lines and phase labels use Hindi; a field without Hindi
  falls back to English; lang `en` unchanged.
- Titler: a saved `TREE_CARE` reminder (plain family and citrus kind) shows its Hindi title; a
  reminder whose item no longer exists keeps its saved title.
- Season guide: Hindi month returned for `hi`, English otherwise.
- Web: phase label shown when sent; humanised key otherwise.

## Non-goals

Dose-template translation, Hindi for typed reminders and AI output, new care content.

## Left to the builder

Where the language-picking helpers live, response field names beyond those above, test layout.
