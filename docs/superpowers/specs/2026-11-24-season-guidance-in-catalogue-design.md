# Season guidance in the catalogue (stage 4) — design

Date: 2026-11-24. Stage 4 of the data-polish roadmap, after stage 3 (tree care in the catalogue,
`2026-11-18-tree-care-in-catalogue-design.md`). Hindi round 2 (care reminders, plant-page steps,
season tips) follows this stage.

## Why

Two pieces of "season guidance" are still code:

1. **Home season tips** (`seasonal/domain/season-guide.ts`, `SEASON_GUIDE`): per region × month,
   the season's name, a headline and three points, shown on the home screen beside "good to sow
   now". Decent, region-aware text; but changing a word needs a deploy, and it can't get Hindi
   through the catalogue like everything else.
2. **The tree "season pack" fallback** (`plant-ledger/services/seasonal-intelligence.service.ts`):
   what a tree without reviewed care gets — the 21 families still in `CARE_PENDING`, a citrus tree
   of no known kind, and every reviewed family in a region still pending. Five all-India "windows",
   hand-written generic / guava / citrus guidance, and pack reminders built from it. Its generic
   text ("Inspect new growth and branch health", "Maintain moisture consistency") is exactly what
   `content-standard.md` lists as bad advice.

**Success:** home tips live in the database word for word (no gardener sees a difference) and are
edited by a catalogue push; a tree without reviewed care shows an honest "care is coming" instead
of filler and gets no filler reminders; reviewed care and the premium personal adjustment work as
before.

## Owner decisions (2026-11-24)

1. **No seasonal fallback.** A tree without reviewed care (or in a region not yet checked) shows
   no season phase, no avoid/watch lists and no season-pack reminders. Its page says care for this
   fruit is coming and invites the gardener to log what they see.
2. **The premium personal adjustment stays, for every tree**, detached from the season pack: it
   reacts to the gardener's own journal (e.g. "soil dry" → water today, recheck in 2 days), not to
   the season.
3. **Home tips move word for word.** Content changes, and Hindi, come later through the push.

## Part A — home season tips into the catalogue

- New catalogue kind `seasonGuide`: one record per region, `months: SeasonMonth[12]`
  (`{ season, headline, points }`), keyed by region, with `status` / `notes` like other records.
  Strict zod schema; exactly 12 months; every `RegionCluster` present and APPROVED (validator issue
  otherwise). Room for optional `hi` fields later, as other records have (not added now).
- Seed: `catalogue/seed/season-guide.seed.ts`, transcribed from today's `SEASON_GUIDE`
  byte-for-byte (a test compares the seed with the old constant before the constant is deleted).
- Persistence: Prisma model `CatalogueSeasonGuide` (JSON `data`, like `CatalogueTreeCare`) and a
  migration; repository load/write and the push's kind table (`keyOf` region, unordered).
- `Catalogue.seasonGuide(region): SeasonMonth[]`; `CatalogueStore` refuses to load a snapshot
  unless every `RegionCluster` has an approved 12-month guide (checked at load, not just a count),
  and logs `seasonGuideCount`. *(Design review.)*
- `SeasonalService.getSeasonalGuide` reads it from the snapshot instead of `SEASON_GUIDE`; the
  month is still `istMonth(now)`. API response unchanged.
- `season-guide.ts` keeps only the type (moved next to the catalogue types if cleaner); the data
  constant and its spec go once the seed test has proved the copy.

## Part B — no fallback for trees without reviewed care

**Backend (`SeasonalService`, `SeasonalIntelligenceService`):**
- A tree whose care doesn't apply (no reviewed care for its family or kind, or its region is
  pending) gets **no pack guidance and no pack tasks**. `materializeTasksForTree` creates only care
  reminders (reviewed care) and overlay tasks. The existing `retireSeasonTasksExcept` call (it
  covers both SEASONAL_PACK and PERSONALIZED_OVERLAY tasks) is passed the current overlay keys,
  as today, so pending pack tasks are cancelled and fresh overlay tasks survive. *(Builder's
  call, from the builder check.)*
- The intelligence response gains `care_status: 'reviewed' | 'coming'`. For `'coming'` the pack
  view carries no phase and empty `do_now` / `avoid_now` / `watch_for`.
- **Version skew:** Vercel deploys the web ~30 s before the manual Render deploy, and a cached old
  web may meet the new API. So the API keeps sending `seasonal_pack` (same shape; for `'coming'`
  with empty lists and phase values `care_coming`, which an old cached web humanises as "Care
  coming" — acceptable), and the new web treats a missing `care_status` as today's behaviour.
- **Pack rows are anchors only, never content.** Neither the intelligence view nor
  `materializeTasksForTree` reads a pack row's phase, lists or `task_templates` any more, so
  existing rows still holding the old filler are harmless. New anchor rows are written with empty
  lists, `current_phase`/`upcoming_phase` `care_coming`, empty `task_templates`, `basis`
  `anchor_only` and **`pack_version: 2`**, so a rolled-back old API (which looks up version 1)
  never reuses them and rebuilds its own filler rows. Test: a pending-family tree whose old filler
  row (version 1, with templates) is in the database shows empty lists and gets no pack task.
  *(Design review.)*
- `SeasonalIntelligenceService`'s hand-written generic / guava / citrus guidance, its five windows,
  `buildTaskTemplates` (in `seasonal/domain/overlay-rules.ts`) and the cohort pack's guidance content are deleted. The `seasonal_packs`
  row stays only as the overlay's database anchor (no migration to the overlay table in this
  stage); dropping the pack table is a later cleanup. *(Builder's call where cleaner.)*
- **Other readers of the deleted guidance** (`PlantRecordService.inferTreeSeasonalState` callers):
  the AI diagnosis context (`getContextForAi`) and
  `GET /plants/:id/seasonal-state` (no web caller found) both got the filler, even for trees with
  reviewed care. Both now get the same honest view as the plant page: when reviewed care applies,
  the care phase view (`carePhaseView`: phase, avoid, watch, what's open this month) plus
  `care_status: 'reviewed'`; otherwise `care_status: 'coming'` with no seasonal guidance. This
  applies to **trees only** (`record_kind === TREE && !crop_id`); a crop or seasonal flower (any
  plant with `crop_id`) gets no `seasonal_state` in the AI context (perennial flowers keep their
  bloom season), so a tomato is never told "care is coming". Test: a crop's AI context has no
  `seasonal_state`. *(Design review.)* The
  endpoint keeps its route (the shelved Android client may use it) with that shape. The care
  lookup (`treeCareFor` + `careApplies` + region) becomes one helper reachable from both
  plant-ledger and seasonal. Test: a diagnosis context for a pending-family tree has no
  seasonal advice; for a mango in North India it has the care phase. *(Builder's call, from the
  builder check: decision 1 applied to every reader.)*
- **First-watering check** (`TaskProcessor`): it is skipped only when reviewed care *applies* —
  the job loads the user's region (it carries `user_id`) and uses the shared care lookup with
  `careApplies`. A new pomegranate in WEST_INDIA (reviewed family, pending region) therefore still
  gets its watering check instead of nothing. Test for that case. *(Design review.)*
- **Personal adjustment (decision 2):** `getOrRefreshOverlay` runs for premium users on every
  tree, care or not. `buildPersonalizedOverlay` no longer needs a pack phase: `adjusted_phase` is
  `${carePhase}_with_dryness_attention` when reviewed care gives a phase, else
  `dryness_attention`. Its tasks and expiry are unchanged.

**Web:**
- `ThisSeason`: for `care_status: 'coming'` show one short card: "Care for {fruit} is coming. Until
  then, log what you see — it helps." (English and Hindi strings; `{fruit}` is the plant's display
  name), with the existing "Log a moment" action as its link. No avoid/watch lists.
- `AtAGlance`: no "Now … → Next …" line for `'coming'`. With a personal adjustment active it shows
  only "Now: <adjustment>" (humanised), never a "Next" half. *(Design review.)*
- Web zod: `care_status` optional (missing → `'reviewed'` behaviour).

## Release order (two releases, one risk each — design review)

1. **Release A (home tips):** Prisma migration (new table) → catalogue push (writes the season
   guide) → API deploy. The API refuses to boot without a complete season guide, so the push
   precedes the deploy. No web change. Rollback: the old API ignores the new table.
2. **Release B (no fallback):** API deploy, then the web (Vercel builds on push; the API stays
   compatible with the old web and the new web with the old API). No migration, no catalogue
   change. Pending SEASONAL_PACK tasks are cancelled lazily, the next time a tree's reminders
   refresh (once per session per plant from the dashboard, or on add/refresh); a session open
   during the deploy may show them until then. No blanket SQL cancel in a migration (the old API
   could re-create them mid-deploy). Rollback: the old API rebuilds its version-1 filler packs.
3. As for tree care: a seed change that adds a **new field** (e.g. Hindi `hi` on season-guide
   rows) deploys the schema that knows it before the content is pushed.

## Tests

- Seed equals the old `SEASON_GUIDE` (before deleting it); validator rejects 11 months, a missing
  region, an unknown field.
- `getSeasonalGuide` returns the same as before for a few region × month cases.
- A pending-family tree: intelligence has `care_status: 'coming'`, empty lists; materialize creates
  no SEASON_PACK task and retires an existing one; a premium user with a "soil dry" log still gets
  the two overlay tasks, `adjusted_phase` `dryness_attention`.
- A reviewed-care tree: unchanged (existing suites), `care_status: 'reviewed'`.
- A reviewed family in a pending region (pomegranate, WEST_INDIA): `'coming'`; a new one still gets
  the first-watering check.
- An existing version-1 filler pack row: not shown, no task from its templates; new anchors are
  version 2 with empty content.
- A crop's AI context has no `seasonal_state`; a North India mango's has the care phase.
- Store: a snapshot missing one region's guide is refused.
- Web: the "coming" card shows and the lists don't; missing `care_status` behaves as today;
  AtAGlance hides the phase for `'coming'`.
- e2e: the catalogue push writes the season guide; boot fails without it.

## Non-goals

- New or improved home-tip content; Hindi (round 2, next).
- Deleting the `seasonal_packs` table or changing the overlay's schema.
- Care for more fruits (the playbook continues separately).

## Left to the builder

Helper names; where the `SeasonMonth` type lives; the neutral phase value sent for `'coming'`;
test file layout; exact card wording within decision 1's meaning.
