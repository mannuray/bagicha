# Plant playbook and region-aware care — design

Date: 2026-11-12. Status: draft for review.

## 1. Why

Bagicha will keep adding plants: trees, vegetables, seasonal and perennial
flowers. Each one touches about ten files today, and nothing checks that a
plant is complete. Care content is uneven:
- Four trees (mango, citrus, litchi, guava) have hand-written seasonal advice.
  The other 22 tree families get generic filler ("inspect new growth").
- New-tree tasks are a mango check: every other tree gets "water in 3 days".
- Tree care ignores region. A mango in Kerala gets the same months as one in
  Bihar.

Adding plants is ongoing and long-running work. It's done by the owner and
Claude together in sessions. So the work needs a written, repeatable
**playbook** that any future session follows: what "done" means for each kind
of plant, where each piece goes, how the facts are sourced, how the owner
reviews them, and which tests prove it. Items 4 and 5 of the content list
(tree care for 22 families, new-tree tasks) are its first use.

## 2. What the owner decided

- **Audience:** the gardener, not an academic. Every line is a practical
  instruction for this month, for this tree, in this region. No
  generalisation, and no filler such as "monitor plant health".
- **Region-aware:** care follows the gardener's region. Regions may share an
  entry only when the plant really behaves the same there, and the sharing is
  written down explicitly, never assumed.
- **Inputs:** both organic and chemical options, organic first. Name specific
  inputs with amounts, e.g. "5 kg compost + 500 g neem cake; or 250 g urea".
- **Delivery:** mostly **dated reminders** (a date window plus a one-line
  action), not monthly advice prose.
- **Notifications** are needed to deliver those reminders. They are a
  **separate project** with their own design, coming after this one. This
  project only has to produce reminders in a shape notifications can send.
- **Review:** a short table in chat for small additions, and a Claude Doc
  for large batches. Nothing ships without the owner's yes.
- **Who adds plants:** the owner and Claude in sessions. The playbook's main
  reader is a future Claude session.
- **Timing (after builder check):** support every timing a family really
  uses. Calendar-timed families (mango, guava, litchi…) use dates. Families
  timed by the grower use a per-tree setting asked once when the tree is
  added: citrus and pomegranate by the bahar chosen (ambe, mrig or hasta),
  grape by its fruit-pruning date. Banana and papaya use their planting date.
- **Season packs (after builder check):** their jobs move into the new
  format. Care data also carries a phase per window ("pre-flowering", "fruit
  set") and "avoid now" items (e.g. "no insecticide while the tree is in
  bloom"). The biography's Now/Next, the This-season lists and the paid
  personalised overlay all read from it. The overlay is rebuilt on the new
  data, not dropped.
- **Regions where a tree isn't usually grown (after builder check):** care is
  written only for the regions the catalogue lists for that tree. Elsewhere
  the gardener gets the nearest listed region's care plus a short note: "not
  usually grown here; timings may differ".

## 3. Goals, non-goals, anti-goals

**Goals**
1. A project skill, `.claude/skills/add-plant/`, that loads whenever a
   session adds or improves a plant. It holds per-kind checklists, the
   content standard, the review templates and the source standard.
2. One data format for **perennial care** (trees and perennial flowers):
   dated care items per region, staged by tree age, with organic and
   chemical options and age-scaled amounts.
3. Tree care for all 26 families in that format, delivered in reviewed
   batches of about six families.
4. New-tree tasks (item 5) come from the same care calendar, so the mango
   check goes away.
5. A completeness check: a test that fails when a catalogue family lacks
   care data. Families not yet done sit on an explicit "pending" list that
   only ever shrinks.

**Non-goals (for now)**
- Notifications (their own project, next).
- Re-keying vegetables and seasonal flowers from 3 climate groups to 7
  regions. Their format gains an optional region override, used when a crop
  is next reviewed. No mass rewrite.
- Hindi translation of care text (that is item 11).
- Pest diagnosis changes.

**Anti-goals: these would make it a failure even if it works**
- Invented facts. Every month, dose and pest has to trace to a source class
  in §6.
- Generic filler lines, or the same line copied across trees.
- Reminder spam. A gardener with five trees shouldn't get 40 tasks a month.
  Cap and merge (§5.4).
- Chemical advice without the basics (dose, gloves, waiting days before
  harvest), or chemicals listed first.

## 4. The playbook (project skill)

`.claude/skills/add-plant/SKILL.md`, plus reference files beside it:
- `checklist-tree.md`, `checklist-crop.md`, `checklist-seasonal-flower.md`,
  `checklist-perennial-flower.md`: every file to touch, in order. Paths come
  from the inventory in §7.
- `content-standard.md`: the rules in §2 and §3 written as dos and don'ts,
  with good and bad example lines.
- `review-templates.md`: the chat table format and the Claude Doc outline
  (§6).
- `sources.md`: the source standard (§6).

The skill's flow for one plant (or a batch):
1. Check what exists for the plant, using the checklist and the completeness
   test.
2. Draft the content from sources and record the source per plant.
3. Show the review table or Doc and wait for the owner's yes. Corrections go
   back into the draft.
4. Write the code and data, then tests (test-first for any logic change).
5. Run the checks the checklist names, update the pending list, and commit.

## 5. Perennial care format and engine

### 5.1 Data

One file per family under `backend/src/modules/plant-ledger/domain/care/`
(trees), for example `care/mango.ts`. The existing perennial flower data
moves to the same format. Shape:

```ts
type Anchor =
  | { kind: 'CALENDAR'; from: [month, day]; to: [month, day] }
  | { kind: 'FROM_PLANTING'; fromDays: number; toDays: number }          // banana, papaya
  | { kind: 'FROM_CHOICE'; choice: string; fromDays: number; toDays: number };
    // citrus/pomegranate: choice = bahar ('AMBE' | 'MRIG' | 'HASTA'), days from that
    // bahar's start in the region; grape: choice = 'FRUIT_PRUNING', days from the
    // pruning date the gardener entered

interface CareItem {
  key: string;                 // stable within the family, e.g. 'pre_flower_feed'
  title: string;               // one-line action, ≤ 60 chars: the reminder text
  category: 'FEEDING' | 'PRUNING' | 'PROTECTION' | 'WATERING' | 'GENERAL';
  stages: ('YOUNG' | 'BEARING')[];
  when: Anchor;
  organic: string;             // what to use and how much (first)
  chemical?: string;           // alternative with dose, safety and waiting days
  amounts?: { upTo3y: string; y4to7: string; y8plus: string };  // when the dose scales with age
  conditional?: string;        // "only if you see …" (pest sprays): plant page only, never a reminder
  why: string;                 // one short reason shown with the task
}

interface PhaseWindow {        // replaces the pack's phase and avoid/watch lists
  when: Anchor;
  stages: ('YOUNG' | 'BEARING')[];
  phase: string;               // "Pre-flowering", "Fruit set": shown as Now / Next
  avoid: string[];             // "No insecticide while in bloom"
  watch: string[];             // pests and diseases to look for now
}

interface RegionCare { items: CareItem[]; phases: PhaseWindow[] }

interface FamilyCare {
  family: string;
  sources: string[];           // §6
  grownIn: RegionCluster[];    // from the catalogue; care must exist for these
  choices?: { key: string; options: string[]; ask: string };  // e.g. bahar, pruning date
  regions: Partial<Record<RegionCluster, RegionCare | { sameAs: RegionCluster }>>;
}
```

- Care is required for every region in `grownIn`. `sameAs` is the only way
  for two of those regions to share, so sharing is always explicit.
- For a region outside `grownIn`, the engine uses the nearest listed region
  and marks the care "not usually grown here" (a fixed nearness table, per
  region; builder's call).
- Stage mapping (builder's call, documented in the file): YOUNG covers
  sapling and pre-bearing, BEARING covers bearing stages.
- **Per-tree choices:** a nullable field on the plant (e.g. `care_choice`
  and `care_choice_date`, via a migration), asked in the add/edit tree form
  only for families that declare `choices`. Until it's answered, the plant
  page asks for it, and calendar-free items stay on the page without becoming
  reminders.

### 5.2 Engine

The perennial-flower engine (`flowerCareDue` and `materializeFlowerCare`)
grows into one perennial-care engine for trees and perennial flowers.
- Items whose window is open now or opens within the next 30 days become
  tasks. A task is due at the window start (or today if the window is already
  open), and its end is the window end.
- Key: `{family}:{key}:{occurrence}`. The occurrence is the window's start
  date, so a window crossing New Year, a new bahar or a new pruning makes a
  new occurrence. It stays a one-off source: done or skipped never comes back,
  and cancelled does.
- Tasks are created when the app asks for them (opening Home or the plant),
  as today. A server-side schedule belongs to the notifications project.
- Tasks carry `window_end`, `organic`, `chemical` and `why` in metadata, so
  the task card and, later, notifications can show them.
- A new task source, `TREE_CARE` (a migration adds the enum value). The old
  `SEASONAL_PACK` tree tasks are retired once a family's care ships. Packs
  stay only for families still on the pending list, then go away.
- **Paid overlay:** rebuilt on the new data. The same triggers (e.g. dryness
  logged) adjust the current phase and add short-lived tasks, read from the
  family's `RegionCare` instead of the pack. Paid users must not lose
  anything they see today. Their current overlay tasks keep working until
  their family moves.

### 5.3 What the gardener sees

- **Reminders:** the dated tasks above, on Home and the plant's task list.
- **Plant page:** "This month": the open care items with organic and
  chemical options, plus the current phase's avoid and watch lists. This
  replaces the do-now/avoid/watch advice. The biography's Now/Next reads the
  phase windows.
- **New tree (item 5):** creating a tree runs the same materialise step,
  replacing `task.processor`'s mango check.

### 5.4 Volume

At most 3 care reminders per tree per month. If more are due, priority
decides (PROTECTION, then FEEDING, then PRUNING, then WATERING, then GENERAL;
conditional items are never reminders), and the rest show on the plant page
only. When a tree has no planting date, the dose band is `y4to7` for
BEARING trees and `upTo3y` for YOUNG trees (my call). Several trees of the same family
in one garden produce one task per tree. Merging across trees is left to
the notifications project.

## 6. Sources and review

**Sources, in order of preference:**
1. ICAR institutes for the crop: CISH Lucknow (mango, guava), NRC Litchi
   Muzaffarpur, NRC Banana Tiruchirappalli, NRC Pomegranate Solapur, CCRI
   Nagpur (citrus), IIHR Bengaluru, and others.
2. State agricultural university package-of-practice guides for the region.
3. KVK and state horticulture department advisories.

Each family file lists its `sources`. Claude drafts from its knowledge of
these sources and says where it's unsure. The owner's review is the gate,
not a formality.

**Chemical rule (my call):** suggest only products approved for that crop in
India. Never anything banned. Every chemical line carries the dose, "wear
gloves", and the waiting days before harvest.

**Review table (chat).** One table per family:

| Region | When | Stage | Reminder | Organic | Chemical | Why |
|---|---|---|---|---|---|---|

**Claude Doc (batches).** One section per family, using the same table.
The owner comments inline, and corrections are applied before the code is
written.

## 7. Where things live today

From the inventory, 2026-11-12:

- **Trees** (keyed by `species_family`, 26 families):
  - catalogue: `plants/domain/fruit-catalogue.ts` (keys must stay stable)
  - aliases: `species-normalization.service.ts`
  - life profiles: `species-life-profiles.ts`
  - `cycleStartMonth`: `species-config.ts`
  - care rules: `seasonal-intelligence.service.ts`
  - new-tree tasks: `task.processor.ts`
  - region prose that names fruits: `seasonal/domain/season-guide.ts`
- **Vegetables** (crop id, 26):
  - calendar: `crop-calendar.ts` (`RAW`, `DETAILS`, windows per climate group)
  - per-crop logic: `CARE_TITLES` in `crop-journey.service.ts`, `MATERIAL` in
    `crop-plan.service.ts`
  - web: photos in `web/src/assets/crops/{id}.jpg`, family icons, `en.json` steps
- **Seasonal flowers** (16): `flower-calendar.ts`, same shape as crops.
- **Perennial flowers** (10): `flower-care.ts`, also seeded into the
  catalogue and life profiles.
- **Tests that pin content:**
  - `fruit-catalogue.spec`, `species-life-profiles.spec`, `crop-calendar.spec`
  - `flower-care.spec`, `species-normalization.spec`, `task.processor.spec`
  - `season-guide.spec`, `seasonal.service.spec`
  - e2e: catalogue, crops, flowers, ledger
  - web: crops, detail, journey, category

The checklists in §4 turn this into ordered steps.

## 8. Rollout

1. Write the playbook skill and the format, then move one family through
   end to end as the template: **mango**, since it has the richest existing
   rules to compare against. The owner reviews mango's table.
2. Change the engine (calendar anchors), add `TREE_CARE`, move phases and
   the paid overlay to read from care data for families that have it, and
   replace the new-tree tasks. Families still pending keep packs.
3. Calendar-timed batch: guava, litchi, chikoo, amla, jackfruit, custard
   apple.
4. Per-tree timing (planting and choice anchors, the plant field, the form
   question), then citrus, pomegranate, banana, papaya, grape.
5. The remaining families in batches of about six, each with a Doc review,
   then code.
6. Move perennial flowers to the same format, the same data rewritten
   region-aware.

Each step deploys on its own. Deploy order for the migration: migrate
first, then push.

## 9. Known limits

- The 7 regions are coarse: `COASTAL_HUMID` runs from Kerala to Konkan, and
  mango flowers at different times along it. The format keeps regions for
  now. A district-level override can be added later if review shows it's
  needed. It isn't built now.

## 10. Left to the builder

- File layout inside `care/`, helper names, and how `sameAs` resolves.
- Exactly how "This month" looks on the plant page (keep to the existing
  design system).
- Test structure, apart from the completeness test (§3.5), which is
  required.
- How pack retirement is sequenced, within the rule that pending families
  keep working.
