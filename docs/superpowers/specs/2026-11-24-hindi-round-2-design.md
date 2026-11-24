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
   `why`, `conditional`; per phase its `avoid` and `watch`. Phase **names** are translated once,
   by key, in the web's strings (decision below).
2. **Home season tips** (7 regions × 12 months): `season`, `headline`, `points`.
3. **Saved reminders**: a tree-care reminder's title **and its card body** (organic way,
   alternative, why) show in Hindi, looked up from the catalogue by the task key in the
   gardener's region (as round 2a does for crops and flowers). *(Design review.)*
4. **Engine sentences**: the dose line's three patterns ("For a 6-year-old tree: …", "Per year of
   the tree's age …", "… if you also use fertiliser, add …"), the not-grown note, and the
   "growing" and "care coming" phases get Hindi in code. *(Design review.)*

Out: typed reminders, AI diagnosis text, the review docs, product names and numbers inside dose
lines (kept as written).

## How

**Data (code first, then content — strict schemas):**
- `TreeCareItem.hi?: { title?; organic?; chemical?; why?; conditional? }` (all optional strings,
  title ≤ 60 characters like the English).
- `PhaseWindow.hi?: { avoid?: string[]; watch?: string[] }`; when given, the same length as the
  English lists (checked in `treeCareIssues`).
- `SeasonMonth.hi?: { season?; headline?; points?: string[] }`; `points` the same length as
  English (checked in `seasonGuideIssues`).
- Hindi strings reuse round 1's `hindi()` / `hindiText` helpers (non-empty, trimmed); the
  Hindi title limit follows round 1's precedent, chosen on purpose for Devanagari (matras count
  as characters). *(Design review.)*
- **Phase names (decision, design review):** about 35 phase keys are shared across families. The
  web gets one key → Hindi map (`biography.phase.<key>` in `hi.json`), which also covers
  `growing`, `care_coming` and the personal adjustment's `…_with_dryness_attention` /
  `dryness_attention` (the suffix translated once). The API keeps sending keys; a key with no
  Hindi string falls back to today's humanised English. Cost: a new fruit's new phase key needs
  one web string (the add-plant checklist says so).

**API (`Accept-Language`, `RequestLang`, as round 1):**
- `GET seasonal/plant/:id/intelligence` and `GET seasonal/guide` take the request language and
  return Hindi where written, English otherwise (care lines, avoid/watch, dose line, not-grown
  note, season tips).
- Saved reminders: for `TREE_CARE` tasks the reminder view, in Hindi, replaces `title`,
  `care_how.organic` / `chemical` / `why` and `reason` with the item's `hi` fields; `amount` (a
  number line saved at creation) and `window_end` stay. The item is found from the source key
  parsed **from the right** (last part `YYYY-MM-DD` or `d<n>`, then the item key, the rest is the
  family, which may be `citrus:<kind>`) **in the gardener's region** (`resolveRegionCare`, so
  `sameAs` works): keys repeat across regions with different doses (18 of 361 family:key pairs).
  Not found → the saved English stays. The database keeps the saved English. *(Design review.)*

**Content:**
- Hindi drafted per family and for the season tips in everyday Hindi (round 1's style guide and
  glossary: plain words a gardener uses — खाद, गोबर की खाद, छिड़काव, दस्ताने; product names stay as
  written; numbers as digits).
- **Owner review gate:** one Claude Doc per batch (tree care; season tips) with English beside
  Hindi; nothing is pushed before an explicit yes.

**Release order:** code release (schemas accept `hi`, API serves it, web shows phase strings) →
then the catalogue push with the Hindi content. This is the reverse of the usual "migrate →
push → deploy": pushing content first would make the live API reject the catalogue on its next
restart. **Rollback after the Hindi push:** revert the content first (push the seed without
`hi`), then roll the code back — the old schemas reject `hi` and the push never deletes, so a
rolled-back API would not start. *(Design review.)*

## Tests

- Validator: `hi` accepted; a Hindi `avoid` list of a different length rejected; a Hindi title over
  60 characters rejected; unknown `hi` keys rejected.
- Engine/service: with lang `hi`, care lines and phase labels use Hindi; a field without Hindi
  falls back to English; lang `en` unchanged.
- Titler: a saved `TREE_CARE` reminder (plain family and citrus kind) shows its Hindi title; a
  reminder whose item no longer exists keeps its saved title.
- Season guide: Hindi month returned for `hi`, English otherwise.
- Reminder view: a saved papaya reminder (`papaya:feed_1:d90`) in SOUTH_DECCAN shows the South
  Hindi title and body, not the coastal one; a citrus-kind key works; an unknown key keeps English.
- Engine: Hindi dose line patterns, not-grown note.
- **Completeness (with the content):** a spec lists every approved item, phase list and season
  month missing `hi`; it lands with the Hindi content and must be empty before the owner review.
  *(Design review.)*
- Web: Hindi phase strings for known keys (incl. the dryness suffix, `growing`, `care_coming`);
  humanised key for an unknown one.

## Non-goals

Dose-template translation, Hindi for typed reminders and AI output, new care content.

## Left to the builder

Where the language-picking helpers live, response field names beyond those above, test layout.
