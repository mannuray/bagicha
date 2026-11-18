# Data polish roadmap

The live app (bagicha-web.vercel.app) works end to end; this is the list of data and copy we are making better, in the order agreed, with what each step covers and where it stands. Each item is shipped and deployed on its own.

## Order

1. District → region map — **done, live**
2. Home season guidance — **done, live**
3. Tree catalogue — **in progress** (phases 1–3 done)
4. + 5. + 6. Tree care, first tasks and life profiles — together, tree type by tree type, after item 3
7. Crop and flower photos — **done, live**
8. Task-title wording — **done**
9. More vegetables — **done** (9 of 10: spring onion added 2026-11-16; parwal dropped)
10. Bulbs — **done, live**
11. Hindi translation — **round 1 done, live** (screens and catalogue); round 2 (reminders, tree care, season tips) after stages 3–4
12. Copy gaps — **done** (one held: see below)
13. Matching gaps — **done**

## Done

### 1. District → region map (live)
- 786 districts across all 36 states and UTs (2021 government list plus districts created since, each with its parent), with old and common names (Gurgaon → Gurugram, Allahabad → Prayagraj).
- Region rules: east UP with Bihar in East; Vidarbha in Central; Konkan and coastal Karnataka in Coastal; Jammu hill districts, Dehradun, Darjeeling and Kalimpong in Hills.
- Type-ahead on onboarding and Profile; names shared by two states are saved as "Aurangabad, Bihar".
- "Use my location": the server finds the district from geoBoundaries 2021 boundaries (ODbL, credited on Profile). Coordinates are posted, rounded to ~100 m and never logged. Islands are covered; PoK and Gilgit-Baltistan are treated as India.
- Design: `docs/superpowers/specs/2026-11-11-district-map-design.md`.

### 2. Home season guidance (live)
- The season as each region names it (Northeast monsoon in the south, snow winter in the hills, dry season on the coast).
- 84 cards (7 regions × 12 months): a headline and 2–3 points. Gardening practice only: no weather, temperatures or forecasts; no frost or snow where there is none.
- "Good to sow now" still comes from the crop calendar.

### Old trees (live after next deploy)
- "Has it fruited yet?" on the tree form; milestones show "Since 2019", "Before Bagicha" or an estimate ("Around 2020–2023", marked estimated) instead of "Not yet"; logs on trees that already fruit are not their "first". Spec: `docs/superpowers/specs/2026-11-11-old-tree-milestones-design.md`.

## 3. Tree catalogue (in progress)

Each tree type touches four things: the **catalogue entry** (add-tree search, Hindi and regional names), **name matching** (typed text → tree type), a **life profile** (first fruit, productive years, lifespan) and **care** (item 4). The catalogue grows in phases; each phase ships on its own.

| Phase | What | Status |
|---|---|---|
| 1 | Popular varieties for the 14 known fruit types, with Hindi names; Hindi search works | **Done, live** (79 entries) |
| 2 | Common home fruit trees we don't have: jamun, ber, bael, fig, mulberry, star fruit (kamrakh), karonda, phalsa, wood apple (kaith), tamarind, kokum, dragon fruit | **Done** (106 entries, 26 fruit types) |
| 3 | Hill and cool-climate fruit: apple, pear, peach, plum, apricot, cherry, walnut, almond, kiwi, persimmon | **Done** (142 entries, 36 fruit types; seed only, live after the catalogue push) |
| 4 | Shade, ornamental and sacred trees: neem, peepal, ashoka, curry leaf and others (no fruit stages; care more like the perennial flowers) | Planned |

**For each new tree type (phases 2–4):** catalogue entries with Hindi names, name-matching aliases, a life profile. Care stays generic until item 4.

### Phase 3 detail (done)
- Apple (Royal Delicious, Golden Delicious, Ambri, low-chill HRMN-99 for the plains), pear (Patharnakh, Punjab Beauty, William Bartlett), peach (Shan-i-Punjab, Florda Prince, Partap, July Elberta), plum (Satluj Purple, Kala Amritsari, Santa Rosa), apricot (New Castle, Halman), cherry (Stella, Mishri), walnut, almond (Waris, Shalimar, Makhdoom), kiwi (Hayward, Allison, Bruno), persimmon (Fuyu, Hachiya). Source-checked and owner-approved (review doc 2026-11-15).
- "badam" does not mean almond (it also means Indian almond); variety names that are also people's names (Stella, Mishri, kaki…) find the variety in search but never mark a tree's type.
- "kath bel" now resolves to wood apple, not bael (wood apple moved above bael in the fruit list).
- Later, with tree care: pollination notes (kiwi male vine 1:8; Satluj Purple needs Kala Amritsari).

### Phase 2 detail (done)
- Jamun (Konkan Bahadoli, Jamwant), ber (Apple Ber, Gola, Umran, Banarasi Karaka), bael (NB-5), fig (Poona, Brown Turkey), mulberry (black, long), star fruit (kamrakh), karonda, phalsa, wood apple (kaith), tamarind (PKM-1, sweet), kokum, dragon fruit (red and white flesh), each with Hindi names and a life profile.
- Name matching is whole-word now ("ber" no longer matches inside "mulberry" or "cucumber").
- Variety labels all read "Fruit (Variety)": Mango (Malda), Orange (Kinnow), Sweet lime (Mosambi)…

### Phase 1 detail (done)
- Mango: Dasheri, Chausa, Alphonso (Hapus), Kesar, Himsagar, Banganapalli, Totapuri, Fazli, Mallika, Neelum, plus Malda, Langra, Amrapali.
- Citrus: Kagzi lime, Gondhoraj, Assam lemon, Galgal, seedless lemon, Nagpur and Darjeeling oranges, Malta, Chakotra (pomelo), plus Kinnow and Mosambi.
- Banana: G9 (Grand Naine), Robusta, Dwarf Cavendish (Basrai), Malbhog, Poovan, Nendran, Elaichi, Red.
- Guava, litchi, pomegranate, papaya, grape, coconut, chikoo, amla, custard apple (incl. Ramphal), moringa, jackfruit varieties.
- Search keeps letters in any script and matches Hindi names; variety names typed as the species are recognised.
- Data lives in `backend/src/modules/catalogue/seed/fruit-plants.seed.ts` (and `fruit-types.seed.ts` for matching words and life profiles).

## 4 + 5 + 6. Tree care, first tasks, life profiles (after item 3)

Done tree type by tree type over everything the catalogue holds:
- **Care (4):** month-by-month guidance per region. Today only mango, citrus, litchi and guava have real rules; the rest fall back to generic advice.
- **First tasks (5):** what a newly added tree gets. Today only mango gets feed and prune tasks; everything else gets "water in 3 days".
- **Life profiles (6):** first fruit, productive years, lifespan for every type (today 14 fruit families and 10 perennial flowers).
- Personal points on Home ("Your mango: stop watering before flowering") come with this.

## Later items

7. **Crop and flower photos:** done: every crop and flower has its own photo (made with Stitch, 480×480).
8. **Task-title wording:** done: titles use the short name ("Thin the spinach seedlings", not "Thin the spinach (palak) seedlings"); tasks created before keep their old title.
9. **More vegetables:** done: beetroot, turnip, amaranth (chaulai), bathua, sem, lobia, tinda, ash gourd, source-checked and owner-approved (review doc 2026-11-14). Spring onion added 2026-11-16 from the documented onion-set method (PAU, YSPUHF, IARI): plant small sets in late August, pull young plants as greens Oct–Dec; no window for the south (sources cover bulbs only). Parwal dropped (owner, 2026-11-16): perennial, and sources cover only the plains.
10. **Bulbs:** done: gladiolus (corms), dahlia (root tubers), rajnigandha and Asiatic lily (bulbs), with a "Lift and store" step for gladiolus and dahlia; owner-approved (review doc 2026-11-14). Added as catalogue data only. Later: photos; rajnigandha's second and third years (ratoon care); Asiatic lily windows for the south and hills once sources agree; rain lily.
11. **Hindi translation:** round 1 live 2026-11-15: every screen and the catalogue's names and texts in everyday Hindi, owner-reviewed; plant names show in Hindi while they keep their catalogue name. Round 2a live 2026-11-16: crop, perennial-flower and default reminder titles in Hindi (crop reminders created before that stay English). Still to do after catalogue stages 3–4: tree-care reminders and advice, season tips. Small gaps: `<html lang>`, replacement links, plural at 0, q-values in Accept-Language.
12. **Copy gaps:** done: the "should start blooming soon" task is an observation, not a harvest; stopping a crop offers crop reasons (no "Old age" or "Replaced"; "Removed" reads "Pulled out") and an ended crop has no tree "Plant a replacement" link. Held: flower care reasons are generic, but no screen shows a task's reason yet; write them when one does.
13. **Matching gaps:** done: Hindi with ड़ typed either way matches; a plant's species and variety are read before its name ("Champa's rose" with species Rose is a rose); text naming only a one-region state (Goa, Kerala, Sikkim) gets that region; Sikkim's "North", "East"… match with the state. Then (2026-11-15, source-checked, owner-approved): fruit trees named in Hindi script are recognised from each fruit's Hindi names, and about 60 common Hindi and regional names were added (amrood, nimbu, aam, anaar, shevga, kaitha bel…); "tut" and "lalit" no longer mark a tree's type. Plain "bel" stays bael; wood apple answers to "kath bel", "kaitha bel", "katbel".

## Catalogue in the database

From 2026-11-14 the crop and flower calendar, planting methods and care steps live in the database, filled from `backend/src/modules/catalogue/seed/` by the catalogue push (design: `docs/superpowers/specs/2026-11-14-catalogue-in-database-design.md`). Stage 2 (fruit types with their matching words and life profiles, add-tree search entries, perennial flowers) moves the tree catalogue there too, so new trees (item 3, phase 3) are seed edits plus a push. Stage 3 (tree care: the six reviewed calendars move as data, then citrus by kind; design `docs/superpowers/specs/2026-11-18-tree-care-in-catalogue-design.md`) is built and waiting to ship; stage 4 (season guidance) follows. Bulbs (item 10) were the first batch added this way.

## Still open outside the list
- Rotate the AWS key, Neon password and Gemini key that were pasted in chat; check the Gemini key works (it starts `AQ.`, not `AIza…`).
- Render does not redeploy on push; deploys are started by hand (`docs/deploy.md`).
