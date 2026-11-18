# Citrus care by kind: draft + source check (2026-11-18, for owner review)

Status: **approved by the owner on 2026-11-18 with every recommendation** (review doc "Citrus care by kind — owner review"). Transcribed into `backend/src/modules/catalogue/seed/tree-care/citrus.seed.ts`.

Sources (full links at the end):
- MUP = CIB&RC Major Uses of Pesticides to 30.09.2026. Insecticide list = MUP-I, fungicide list = MUP-F, bio-insecticide list = MUP-BI. Page numbers are PDF pages.
- PAU = PAU Package of Practices for Cultivation of Fruit Crops, citrus pp.13–34. Page numbers are printed pages.
- TNAU = Crop Production Guide, Horticulture Crops 2020 (Directorate of Horticulture, Tamil Nadu, with TNAU). Acid lime pp.14–16, sweet orange pp.17–18, mandarin pp.18–19. Page numbers are printed pages.
- NIPHM = AESA based IPM package, Citrus (NIPHM/DPPQS). Page numbers are PDF pages.

**Not reached:**
- ICAR-CCRI Nagpur's site would not resolve from here, so its monthly advisories are known only from search snippets (see Pending).
- Dr YSPUHF's citrus package, through the HP-SHIVA site, returned 404 or HTML.
- KAU, BAU Sabour, AAU and BCKV were not fetched in this pass.

---

## 1. Kinds

Four kinds. No pomelo kind.

| Kind key | Label | Why it is its own kind (from the sources) | Grown in (union of its add-tree entries' regions) | Ships now | Pending |
|---|---|---|---|---|---|
| `lime` | Acid lime (Kagzi) | <ul><li>PAU: Kagzi is "highly susceptible" to canker, so it gets a routine canker spray in Oct, Dec and Feb (PAU p.32).</li><li>Fruit is on the tree almost all year, so copper sprays are never "no fruit on the tree".</li><li>TNAU gives a separate dated schedule for acid lime in Tamil Nadu (TNAU pp.14–16).</li></ul> | NORTH, EAST, WEST, CENTRAL, SOUTH_DECCAN, COASTAL_HUMID | NORTH_INDIA, SOUTH_DECCAN | EAST_INDIA, WEST_INDIA, CENTRAL_INDIA, COASTAL_HUMID |
| `lemon` | Lemon (Baramasi, Galgal, Eureka, Assam lemon) | <ul><li>PAU lists lemon separately (Punjab Baramasi, Galgal, Eureka). It has its own picking months and no routine canker spray.</li><li>In North India its care is otherwise the same as lime.</li><li>It is kept separate because only lime is sourced in the South, and because a lemon tree must not get lime-only rows, or the reverse.</li></ul> | NORTH, EAST, WEST, CENTRAL, SOUTH_DECCAN, COASTAL_HUMID, HILLS_COOL | NORTH_INDIA | all others |
| `mandarin` | Mandarin (Kinnow, Nagpur, Darjeeling/Khasi, Coorg) | <ul><li>PAU has a Kinnow-only fertiliser table: linear in age, up to 8 years (PAU p.21).</li><li>Kinnow-only potassium nitrate sprays (PAU p.26) and fruit thinning on young trees (PAU p.26).</li><li>Kinnow is picked mid-Jan to mid-Feb, which changes the pruning and copper months.</li><li>CCRI's Nagpur mandarin care follows the grower's bahar.</li></ul> | NORTH, CENTRAL, WEST, EAST, HILLS_COOL | NORTH_INDIA (Kinnow) | CENTRAL_INDIA, WEST_INDIA, EAST_INDIA, HILLS_COOL |
| `sweet_orange` | Sweet orange (Mosambi, Malta, Sathgudi) | <ul><li>PAU: "Sweet oranges (malta)" use the "other citrus" dose.</li><li>Picking runs from Oct to Mar depending on the variety, and there is no Kinnow thinning or KNO₃.</li><li>TNAU has its own sweet orange schedule, but no South Deccan add-tree entry exists yet.</li></ul> | NORTH, WEST, HILLS_COOL (+ SOUTH_DECCAN if a Sathgudi entry is added) | NORTH_INDIA | WEST_INDIA, HILLS_COOL |

**Why there is no pomelo or grapefruit kind:**
- PAU covers grapefruit (Star Ruby, Marsh Seedless and others) only under the generic "other citrus" dose, and calls grapefruit highly susceptible to canker.
- I found no pomelo (chakotra) source.
- So `citrus:Chakotra` picks no kind. See open question Q6.

**Regions:**
- NORTH_INDIA follows Punjab (PAU). Haryana, Rajasthan and western UP are not separately checked.
- SOUTH_DECCAN follows Tamil Nadu (TNAU). Karnataka, Andhra Pradesh and Telangana timing is not separately checked, as for guava.

### Kind words (whole-word, NFC; checked in Python)
NFC turns precomposed ज़ (U+095B) into ज + ़ (U+091C U+093C), so both nukta spellings of कागज़ी match. कागजी without the nukta is a different string, so it is listed separately.

| Kind | English words | Devanagari words |
|---|---|---|
| lime | kagzi, kagzi lime, kagzi nimbu, kaghzi, kagji, acid lime, tahiti lime, *lime (Q1)* | कागज़ी, कागजी |
| lemon | baramasi, seedless lemon, galgal, hill lemon, pahadi nimbu, assam lemon, kaji nemu, eureka | बारामासी, गलगल, पहाड़ी नींबू |
| mandarin | kinnow, kinnu, mandarin, nagpur, nagpuri, darjeeling, khasi, coorg, kodai, daisy, murcott | किन्नू, किन्नो, नागपुरी, नागपुर, दार्जिलिंग, खासी |
| sweet_orange | mosambi, mausambi, musambi, mosumbi, sweet orange, malta, blood red, blood orange, jaffa, valencia, sathgudi, sathukudi, batavian, *sweet lime (Q2)* | मौसमी, मौसंबी, मोसंबी, मुसम्मी, माल्टा |

Notes on the words:
- मौसमी also means "seasonal" in Hindi. That is harmless here, because only trees already resolved to citrus are matched.
- "sweet lime" must win over "lime" by position. It starts earlier in the text, so the earliest-word rule handles it.
- The species value `sweet_lime` is one token, so it does not contain the whole word "lime".

## 2. Ambiguous words: pick NO kind
nimbu, nimboo, neembu, nimbe, limbu, lebu, nemu, **lemon**, citrus, orange, santra, narangi, pomelo, chakotra, grapefruit, gondhoraj, नींबू, निंबू, संतरा, नारंगी, चकोतरा.
These stay in the citrus fruit type's `match_aliases`, so the tree is still citrus, but they choose no kind.

**Should "lemon" pick the lemon kind? Recommendation: no.**
1. The plain "Lemon / नींबू" entry (key `citrus`) is the generic nimbu entry. Searches for nimbu, nimboo, limbu and neembu land on it, and PAU itself names Kagzi "Lime (Nimboo)" (PAU p.17). Many trees saved as species `lemon` are really Kagzi lime.
2. Wrong-kind care is worse than none (owner's decision, 2026-11-18). A lime given lemon care would lose the routine canker sprays in Oct, Dec and Feb, which PAU gives because Kagzi is highly susceptible.
3. It costs the variety entries nothing. Kagzi, Galgal, Assam lemon and Seedless/Baramasi all save species `lemon`, but their variety is checked first and decides the kind.
4. Cost: a tree added from the plain entry gets no care until the gardener picks a variety. That is what the "ask which kind" follow-up is for.

## 3. Add-tree entry clean-up
Proposal: keep the plain entry as the generic "nimbu" (no kind), fix the wrong aliases and species, rename two variety values, and optionally add a Sathgudi entry. Every key stays as it is.

| Entry key | Today | Proposed change | Intended kind |
|---|---|---|---|
| `citrus` | "Lemon", species lemon; aliases include narangi, musambi, malta | <ul><li>Display "Nimbu", hi नींबू.</li><li>Species stays `lemon`.</li><li>**Remove** narangi, musambi, malta.</li></ul> | **none** |
| `citrus:Kagzi` | "Lemon (Kagzi)", species lemon | <ul><li>Display "Lime (Kagzi)", species `lime`.</li><li>Add aliases kaghzi, kagji and hi कागजी नींबू.</li></ul> | lime |
| `citrus:Seedless` | variety "Seedless" | <ul><li>Variety "Baramasi", display "Lemon (Baramasi, seedless)".</li><li>Without this change, "Seedless" is not a kind word and the entry resolves to none.</li></ul> | lemon |
| `citrus:Galgal` | species lemon | none needed (PAU lists Galgal under Lemon, p.16) | lemon |
| `citrus:Assam lemon` | species lemon | none needed | lemon |
| `citrus:Gondhoraj` | species lemon | none. Its botany and care are unsourced | **none** |
| `citrus:Kinnow` | "Orange (Kinnow)", species orange | display "Mandarin (Kinnow)", species `mandarin` | mandarin |
| `citrus:Nagpur` | species orange; aliases include santra | species `mandarin`. Keep the santra alias for search only; the variety decides the kind | mandarin |
| `citrus:Darjeeling` | species orange | species `mandarin` | mandarin |
| `citrus:mosambi` | "Sweet lime (Mosambi)", species sweet_lime | <ul><li>Add aliases musambi, mosumbi and hi मौसमी, मोसंबी.</li><li>Consider adding central_india to its regions (Q5).</li></ul> | sweet_orange |
| `citrus:Malta` | species orange | species `sweet_orange` (PAU: "Sweet oranges (malta)", p.15) | sweet_orange |
| `citrus:Chakotra` | aliases include grapefruit | **Remove** grapefruit, which is a different fruit (PAU p.15) | **none** |
| *new* `citrus:Sathgudi` (Q4) | — | Sweet orange, regions south_deccan, aliases sathgudi, sathukudi, satgudi | sweet_orange |

**Why the plain entry's display name must contain no kind word.** A new plant's `name` appears to default to the entry's display name (for example plant name "Mango (Dasheri)" in `web/src/features/plants/plants.test.tsx`). Kind matching falls back to the name field. A display name like "Nimbu (lime or lemon)" would therefore resolve to lime if "lime" becomes a kind word (Q1). So the display name is just "Nimbu". The variety entries' display names are safe, because their variety decides first.

Narangi and santra stay only in the fruit type's `match_aliases`. Q3 asks whether to add a generic "Orange (santra/narangi)" entry instead.

---

## 4. Care tables

Rules for every table:
- Organic comes first.
- "Wear gloves" goes on every spray and every paste.
- A chemical is listed only if it has a citrus (or kind-specific) MUP claim with a per-litre dose and a waiting period.
- Bordeaux (home-made, owner exception 2026-11-12) is used as a paste on cuts, and as a spray **only when no fruit is on the tree**.
- Bahar is plain advice only. There are no choice-timed reminders.

**Recipes used below** (PAU pp.10–11):
- **Bordeaux paste:** 2 kg copper sulphate dissolved in 15 L water. In another vessel, slake 3 kg quicklime with a little of a second 15 L of water, then add the rest. Mix the two and stir. Brush it on cuts. For home use, keep the same ratio: 200 g + 300 g in 1.5 L + 1.5 L. Wear gloves.
- **Bordeaux mixture 2:2:250:** 8 g copper sulphate + 8 g quicklime per litre. Dissolve each in half the water, in separate non-metal vessels, then pour the copper into the lime while stirring. Don't spray in rain or in great heat. Wear gloves.

### 4N. NORTH_INDIA (all four kinds, from PAU)

**Dose: mandarin (Kinnow).** PAU p.21. I checked the columns by converting back (urea = N ÷ 0.46, SSP = P₂O₅ ÷ 0.16, MOP = K₂O ÷ 0.60).
- Per year of age, up to 8 years:
  - FYM 10 kg, all of it in December;
  - urea 240 g a year, split into two halves: urea 120 g × age per feed (Feb, and Apr–May).
  - As a `Dose`: organic `[FYM 10000]` on N1 and chemical `[urea 120]` on N2 and N3, `maxAgeYears: 8`.
- SSP starts only at age 4: 1.37–2.4 kg in years 4–7, then 2.73 kg from year 8, all with the February feed. The `Dose` type has no starting age, so this goes in row text.
- Example: a 6-year-old Kinnow gets 60 kg FYM in December and 720 g urea per feed.

**Dose: lime, lemon, sweet orange ("citrus other than Kinnow").** PAU p.21. These are age bands, not linear, so they go in row text (guava precedent).

| Age | FYM a year | Urea a year |
|---|---|---|
| 1–3 years | 5–20 kg | 110–330 g |
| 4–6 years | 25–50 kg | 440–550 g |
| 7–9 years | 60–90 kg | 660–880 g |
| 10 years and over | 100 kg | 880–1760 g |

Half the urea goes in each feed.

| # | Reminder (title ≤60) | Window (NORTH) | Kinds | Stages | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| N1 | Spread the year's manure under the tree | Dec 1–31 | all | young, bearing | All the year's FYM in the basin under the canopy, forked in lightly. Kinnow: 10 kg per year of age, up to 8 years. Others: see the band table | — | Manure goes in during the winter rest, before spring growth | OK | PAU p.21–22 |
| N2 | Give the first feed before new growth | Feb 1–28 | all | young, bearing | — | **Mandarin (Kinnow):** half the year's urea plus all the SSP (from year 4 only; amounts in the dose note); water in. **Lime, lemon, sweet orange:** half the year's urea only. PAU's table for these gives no P amount, so no SSP. Wear gloves | Feeds the spring flush and the flowers | corrected: the draft gave SSP to all kinds, but PAU's "other citrus" table has no P figure | PAU p.21–22 ("apply the first half in February … phosphorus along with the first dose") |
| N3 | Give the second feed after fruit set | Apr 1–May 31 | all | young, bearing | — | Other half of the urea in the basin; water in. Wear gloves | Feeds the young fruit | OK | PAU p.22 ("second half in April-May after fruit set") |
| N4 | Prune out dead and diseased twigs | lime, lemon, sweet orange: Jan 1–Feb 28 · mandarin: Feb 1–28 | all | bearing | Cut dead, dried and diseased twigs back to healthy wood, open up the centre, and burn the prunings. Seal cuts with Bordeaux paste; wear gloves | — | Stops die-back spreading and lets light in | corrected: mandarin moved to Feb (Kinnow is picked until mid-Feb) | PAU p.21, p.25 ("January to February"), p.33 (die-back: "remove the infected twigs during February") |
| N5 | Spray Bordeaux mixture after pruning | Mar 1–31 | mandarin, sweet orange | bearing | Bordeaux mixture 2:2:250 (recipe above); wear gloves. Skip it if fruit is still on the tree (e.g. Valencia) | — | Protects cuts and the new flush from die-back | corrected: PAU's repeat sprays in July and September removed (fruit on the tree; copper oxychloride is an owner call, Q8). Removed for lime and lemon (fruit always on the tree; paste only) | PAU p.25, p.33 |
| N6 | Water every 2–3 weeks in the hot months | Apr 1–Jun 30 | all | bearing | Water bearing trees every 2–3 weeks, using a ring basin so water doesn't touch the trunk. Don't flood | — | Dry soil after fruit set sheds flowers and fruit | OK (window = PAU's "after fruit set in April and in the hot weather"; PAU's drip table peaks Apr–Jun) | PAU p.23 |
| N7 | Spray against citrus psylla | Mar 1–31 + Sep 1–10 | all | young, bearing | Pinch off and destroy curled new shoots carrying nymphs (NIPHM). No organic spray has a citrus label claim (Q7) | Thiamethoxam 25 WG 0.1 g per litre (1 g in 10 L); wear gloves; not within 20 days of picking. Spray in the evening, not on open flowers (check) | Psylla sucks the new shoots and spreads greening disease | corrected: dose 0.32 g/L (PAU) → 0.1 g/L (label). Removed: imidacloprid (no per-litre label dose) and HMO (no MUP claim) | PAU p.28; MUP-I p.53; NIPHM p.24–25 |
| N8 | Spray young trees for leaf miner | Apr 1–May 31 + Aug 1–Sep 30 | all | young | Pick off and burn leaves with silvery tunnels (NIPHM: prune affected parts). No organic spray has a citrus label claim (Q7) | Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC 0.3 ml per litre; wear gloves; not within 10 days of picking | Tunnels curl young leaves and open the way for canker | corrected: PAU's imidacloprid swapped for a product with a per-litre citrus label (psyllids, thrips, leaf miner) | PAU p.28; MUP-I p.87; NIPHM p.25 |
| N9 | Spray lime trees against canker | Oct 1–31 + Dec 1–31 + Feb 1–28 | lime only | young, bearing | Cut out and burn twigs with canker spots (NIPHM); pre-monsoon cutting is on the plant page. Bordeaux spray is not allowed with fruit on the tree; copper oxychloride is an owner call (Q8) | Copper sulphate 47.15% + mancozeb 30% WDG 5 g per litre; wear gloves; not within 10 days of picking | Kagzi lime is highly susceptible; corky spots on leaves and fruit | corrected: streptocycline removed (antibiotic; prohibition order; no waiting period). Product swapped for one with a citrus canker label claim | PAU p.32; MUP-F p.59; NIPHM p.26 |
| N10 | Hang a fruit fly trap; bury fallen fruit | Aug 8–14 | mandarin, sweet orange | bearing | Hang a PAU fruit fly trap in the second week of August, 1–1.5 m up in shade; keep it until picking, and recharge it if fresh damage appears. Collect and bury stung or fallen fruit. PAU says the trap leaves "no pesticide residue". PAU's rate is 16 per acre; "1 per home tree" is my scale-down (check). PAU also says the traps are less effective in kitchen gardens (Q13) | — | Flies sting fruit at colour break; the fruit rots and drops | OK (trap contents and time confirmed in PAU ch.25) | PAU p.31, pp.154–155 |
| M1 | Pick Kinnow with clippers | Jan 15–Feb 15 | mandarin | bearing | Clip the fruit, leaving a short button stalk; don't pull. Don't pick in dew or just after rain. Outer fruit first | — | Pulling tears the skin and the fruit rots | OK | PAU p.26 |
| M2 | Spray potassium nitrate for bigger fruit | May 21–31 + Jun 21–30 + Jul 21–31 | mandarin | bearing | — | Potassium nitrate 10 g per litre (1%). It is a fertiliser, so there is no waiting period. Wear gloves | Bigger fruit and higher yield in Kinnow | OK | PAU p.26 |
| M3 | Thin fruit on young Kinnow trees | May 1–31 | mandarin | young | Thin heavy fruit loads soon after fruit set in the 3rd and 4th year (400–500 fruits is too many) | — | An over-loaded young Kinnow can die | OK | PAU p.26 |

**Month check (at most 3 reminders a month).** Leaf miner (N8) is young-only, so it is not counted for bearing trees.

| Kind | Month count | Over 3? |
|---|---|---|
| Lime | Feb 3 (N2, N4, N9); Dec 2; Apr and May 2 | No |
| Lemon | Feb 2 | No |
| Mandarin | Feb 3 (N2, N4, M1); Mar 2 (N5, N7); May 3 (N3, N6, M2) | No |
| Sweet orange | Feb 2; Mar 2 | No |
| Young trees | Apr and May: N3 + N8 (+ M3 in May for mandarin) = 3 | No |

**Plant page only, NORTH (conditional, never reminders):**
- **Gummosis or foot rot** (gum oozing from the trunk base, bark cracking, pale leaves):
  - Organic, always:
    - don't flood the basin;
    - keep water off the trunk (ring basin);
    - don't hoe deep or wound the bark;
    - scrape the lesion clean, then cover it with Bordeaux paste; wear gloves (PAU p.32).
  - Chemical, in Feb–Mar and again in Jul–Aug:
    - cymoxanil 8% + mancozeb 64% WP drench, 2.5 g per litre, 10 L per tree;
    - or paint it on the lesion, 2.5 g in 100 ml linseed oil (50 ml per tree);
    - wear gloves; not within 82 days of picking.
  - Check: corrected. Label rates replace PAU's 2 g/100 ml. Sodium hypochlorite removed (no MUP claim). Trichoderma is an owner call (Q7). Sources: MUP-F p.60; PAU p.32–33.
- **Zinc or manganese shortage** (mottled leaves, small narrow "little leaf"):
  - spray zinc sulphate 4.7 g + manganese sulphate 3.3 g per litre at the end of April and in mid-August, on fully grown flush leaves;
  - keep a week's gap from any Bordeaux spray;
  - it is a fertiliser, so there is no waiting period; wear gloves.
  - Check: OK. Source: PAU p.22.
- **Bark-eating caterpillar** (webbing and chewed bark on the trunk): pull off the webbing and push kerosene into the holes in Sep–Oct and again in Jan–Feb. Check: OK. Source: PAU p.30.
- **Mites** (fine specks, dusty leaves, worst in May–Jun and Aug–Sep): diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days of picking. Check: OK. PAU gives no product; label MUP-I p.24.
- **Mealybug** (white cottony clusters, Jul–Oct):
  - keep branches off the ground;
  - prune and destroy infested shoots;
  - destroy ant nests (PAU p.30–31);
  - organic: *Verticillium lecanii* 1.15% WP about 4.5 g per litre (label: 2.5 kg in 550 L; TNAU rounds it to 5 g), wear gloves.
  - Check: OK. Sources: PAU p.30; MUP-BI p.12.
- **Canker spots on lemon, mandarin or sweet orange:** cut out and burn spotted twigs before the monsoon; if it spreads, copper sulphate + mancozeb WDG 5 g per litre, wear gloves, not within 10 days of picking. Check: corrected (as N9). Sources: NIPHM p.26; MUP-F p.59.
- **Scab, melanose, die-back in the rains** (Jun–Sep, fruit on the tree): PAU sprays Bordeaux or copper oxychloride 3 g per litre. With fruit on the tree, Bordeaux isn't allowed, and copper oxychloride's label (leaf spot and canker) gives no waiting period. **OWNER CALL (Q8).** Source: PAU p.32–33; MUP-F p.8.
- **Picking months by variety** (PAU pp.14–17):

  | Kind | Variety | Picking |
  |---|---|---|
  | Mandarin | Daisy | by Nov 20 (granulation) |
  | Mandarin | Kinnow | mid-Jan to mid-Feb |
  | Mandarin | W. Murcott | Jan–Feb |
  | Sweet orange | Early Gold | late Oct to mid-Nov |
  | Sweet orange | Musambi | Nov |
  | Sweet orange | Jaffa | Dec |
  | Sweet orange | Blood Red | Dec–Jan |
  | Sweet orange | Valencia | Feb–Mar |
  | Lemon | Punjab Baramasi | first week of July |
  | Lemon | Eureka | Aug–Sep |
  | Lemon | Galgal | last week of Nov |

  Check: OK.
- **Fruit drop (Kinnow and other citrus):** what is left of PAU's integrated fruit-drop list once GA₃ is removed:
  - collect and destroy mummified fruit on the tree, and bury fallen fruit deep;
  - prune dead and diseased twigs (N4) and spray Bordeaux (N5);
  - feed on schedule (N1–N3);
  - irrigate as needed, with no water standing in the basin;
  - don't flood-irrigate (Phytophthora).
  - Check: corrected (GA₃ removed). Source: PAU p.25–26.
- **Watering a young tree:** every week up to 3–4 years old, using a ring basin. Check: OK. Source: PAU p.23.
- **Potash (mandarin):**
  - PAU adds MOP (about 183 g per year of age, up to 8 years) with the December FYM, but **only in Punjab's sub-mountain and central zones**.
  - Not a reminder (check whether it applies elsewhere in North India).
  - Check: OK as quoted; zone-limited.
  - Source: PAU p.21 footnote.

**Phases, NORTH:**

| Phase | Lime / lemon / sweet orange | Mandarin | Avoid | Watch | Source |
|---|---|---|---|---|---|
| winter_rest | Dec–Jan | Dec | Heavy pruning in active growth | Bark-eating caterpillar | PAU p.21, p.30 |
| harvest | — (by variety, plant page) | Jan–Feb | Pulling fruit off; picking in dew or after rain | Fruit drop | PAU p.26 |
| spring_flush_and_flowering | Feb–Apr | Mar–Apr | Water stress before sprouting and after fruit set; insecticide on open flowers (check) | Psylla (Mar–mid-Oct), aphids (Mar), thrips (Mar–Apr), leaf miner (from end Mar) | PAU p.23, p.28–30 |
| summer | May–Jun | May–Jun | Letting the basin dry out; flood irrigation | Mites (May–Jun), leaf miner (Apr–May) | PAU p.23, p.28, p.30 |
| monsoon | Jul–Sep | Jul–Sep | Water standing in the basin or touching the trunk | Gummosis, scab, melanose, mealybug (Jul–Oct), fruit fly (from Aug) | PAU p.25, p.30–33 |
| autumn | Oct–Nov | Oct–Nov | Flood irrigation | Leaf miner (Sep–Oct), canker on lime | PAU p.28, p.32 |

### 4S. SOUTH_DECCAN, lime only (from TNAU)

**Dose (TNAU p.14), per plant per year:**

| Nutrient | 1st year | Add each year | From 6th year |
|---|---|---|---|
| FYM | 10 kg | 5 kg | 30 kg |
| N | 200 g | 100 g | 600 g |
| P₂O₅ | 100 g | 25 g | 200 g |
| K₂O | 100 g | 40 g | 300 g |

- This is a base plus an increment, and the source's own figures don't add up in a straight line. So it goes in row text, not a `Dose`.
- Also add *Pseudomonas* 20 g and VAM 200 g per plant along with the FYM.

| # | Reminder | Window (SOUTH_DECCAN) | Stages | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | Feed manure, P, K and half the nitrogen | Oct 1–31 | young, bearing | The year's FYM (dose table) plus *Pseudomonas* 20 g and VAM 200 g in the basin, mixed in | All the year's P and K, plus half the N, in the basin; water in. Wear gloves | The main feed, after the monsoon flush | OK | TNAU p.14 |
| S2 | Give the second half of the nitrogen | Mar 1–31 | young, bearing | — | Other half of the N in the basin; water in. Wear gloves | Feeds the spring flush | OK | TNAU p.14 |
| S3 | Spray zinc on the new flush | Mar 1–31 + Jul 1–31 + Oct 1–31 | young, bearing | — | Zinc sulphate 5 g per litre (0.5%) once the new flush has opened. It is a fertiliser, so there is no waiting period. Wear gloves | Prevents little-leaf and twig die-back | OK | TNAU p.14 |

Month check: Mar 2 (S2, S3); Jul 1; Oct 2 (S1, S3).

**Plant page only, SOUTH_DECCAN lime:**
- **Psylla on new flush:** thiamethoxam 25 WG 0.1 g per litre; wear gloves; not within 20 days of picking. Check: OK; TNAU's 1 g/10 L matches the label. Sources: TNAU p.15; MUP-I p.53.
- **Leaf miner:** thiamethoxam + lambda-cyhalothrin ZC 0.3 ml per litre; wear gloves; not within 10 days. Check: corrected. TNAU's imidacloprid 0.5 ml/L has no per-litre label dose; TNAU's neem, NSKE and carbofuran removed (Q7; carbofuran has no waiting period). Sources: TNAU p.15; MUP-I p.87.
- **Rust mite:** diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days. Check: OK. Sources: TNAU p.15; MUP-I p.24.
- **Mealybug:** debark the infested branches; use a 5 cm sticky band on fruiting shoots; *Verticillium lecanii* 1.15 WP 5 g per litre, wear gloves. Check: OK. Fish oil rosin soap is an owner call (Q7). Sources: TNAU p.16; MUP-BI p.12.
- **Canker:** cut out and burn spotted twigs; copper sulphate + mancozeb WDG 5 g per litre, wear gloves, not within 10 days. Check: corrected. Streptocycline removed; copper oxychloride 0.3% is an owner call (Q8). Sources: TNAU p.16; MUP-F p.59.
- **Twig blight or dried twigs:** cut each dried twig back with 2–3 cm (one inch) of green wood and burn it. Check: corrected. TNAU's spray of carbendazim or copper oxychloride removed: carbendazim + mancozeb is labelled for mandarin only (MUP-F p.56), and copper oxychloride is Q8. Source: TNAU p.14, p.16.
- **Mulch:** 10 cm of dry leaves or paddy husk in the basin. Check: OK. Source: TNAU p.14.
- **Young tree:**
  - water every 8–10 days after the monsoon and every 5–7 days in summer;
  - ring basin; no standing water;
  - remove side branches on the main stem up to 45 cm.
  - Check: OK. Source: TNAU p.14.
- **Bahar (plain advice):**
  - Acid lime flowers almost all year, with flushes in Jun–Jul (Mrig), Sep–Oct (Hast) and Jan–Feb (Ambe).
  - Fruit from the Sep–Oct flowering, picked in summer, sells best.
  - Fruit matures 5–6 months after flowering; pick when the colour just starts to change.
  - Main picking is in Jul–Sep and Nov–Jan.
  - Check: OK. Source: TNAU p.14–15.

**Phases, SOUTH_DECCAN lime:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| year_round_bearing | Jan–Dec | Water standing in the basin or touching the trunk | Psylla and leaf miner on each new flush (Jun–Jul, Sep–Oct, Jan–Feb); canker in the rains | TNAU p.14–16 |

### 4S-SO. SOUTH_DECCAN, sweet orange (ready only if a Sathgudi entry is added; Q4)

| # | Reminder | Window | Organic | Chemical | Check | Source |
|---|---|---|---|---|---|---|
| SO1 | Feed manure, P, K and half the nitrogen | Oct 1–31 | FYM in the basin, 70 cm from the trunk, mixed in. Year 1 10 kg, add 5 kg a year, 30 kg from year 6 | All the P and K, half the N. Wear gloves. Doses: N 200 g (+100 a year, 600 from year 6), P 100 g (+20, 200), K 100 g (+40, 300) | OK | TNAU p.17 |
| SO2 | Give the second half of the nitrogen | Mar 1–31 | — | Other half of the N; water in. Wear gloves | OK | TNAU p.17 |

Plant page:
- Prune only dead, diseased and crowded branches, after picking (OK, TNAU p.17).
- Stopping water 1–2 months before flowering helps; plain advice, no months (OK, TNAU p.17).
- Micronutrient spray at each new flush; no months (TNAU p.17).

---

## 5. Pending regions (keep the season pack) and why
- **CENTRAL_INDIA and WEST_INDIA** (lime, mandarin, sweet orange, lemon):
  - Care follows the grower's bahar.
  - The CCRI monthly advisories (site unreachable; seen only in search snippets) tie irrigation to it: stop watering after the Ambia harvest in December, stress in May for the Mrig flowering in June.
  - TNAU p.14 confirms three bahars for acid lime.
  - These become choice-timed rows once per-tree timing exists. CCRI's full text is needed before drafting them.
- **EAST_INDIA** (lime, lemon incl. Assam lemon, mandarin incl. Darjeeling/Khasi): no BAU, AAU, BCKV or ICAR-NEH source was fetched.
- **COASTAL_HUMID** (lime, lemon): no KAU or Konkan source was fetched.
- **HILLS_COOL** (lemon/Galgal, mandarin/Darjeeling, sweet orange/Malta): the YSPUHF citrus package (HP-SHIVA) was unreachable. Darjeeling and Khasi mandarin would need a different source again.
- **SOUTH_DECCAN for lemon:** no South lemon source. TNAU covers acid lime only.
- **SOUTH_DECCAN for mandarin:** TNAU's mandarin (Coorg, Kodai) is a hill crop at 500–1500 m, fed in June and October, with a Palani Hills table (TNAU p.18). No catalogue entry is in that region. See Q9.

## 6. Label claims checked (MUP 30.09.2026; citrus unless stated)

| Product | Claim | Dose per litre | Waiting days | Used? |
|---|---|---|---|---|
| Thiamethoxam 25 WG (MUP-I p.53) | psylla | 0.1 g | 20 | yes (N7, S) |
| Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC (MUP-I p.87) | psyllids, thrips, leaf miner | 0.3 ml | 10 | yes (N8, S) |
| Cyantraniliprole 10.26 OD (MUP-I p.19) | psylla, thrips | 1.2 ml | 5 | spare alternative |
| Spirotetramat 15.31 OD (MUP-I p.48) | psylla, mites | 0.6 ml | 30 | spare alternative |
| Diafenthiuron 50 WP (MUP-I p.24) | mites | 2 g | 30 | yes (conditional) |
| Imidacloprid 17.8 SL (MUP-I p.36) | leaf miner, psylla | label gives only "50 ml/ha, volume by tree size" | 15 | **no**: no per-litre dose (Q10) |
| *Verticillium lecanii* 1.15 WP (MUP-BI p.12) | mealybug | ~4.5–5 g | — (bio) | yes (organic) |
| Copper sulphate 47.15% + mancozeb 30% WDG (MUP-F p.59) | canker, Alternaria spot | 5 g | 10 | yes (N9, conditional) |
| Cymoxanil 8% + mancozeb 64% WP (MUP-F p.60) | gummosis | 2.5 g drench; 25 g/L linseed-oil paint | 82 | yes (conditional) |
| Metalaxyl-M 3.3% + chlorothalonil 33.1% SC (MUP-F p.74) | Phytophthora foot rot | 2 ml drench, 5 L/tree | 51 | spare alternative |
| Carbendazim 12% + mancozeb 63% WP (MUP-F p.56) | **mandarin** twig blight, anthracnose | 3 g | 30 | not used (mandarin-only claim; no mandarin row needs it in the North) |
| Copper oxychloride 50 WP (MUP-F p.8) | leaf spot, canker | 2.5–3.3 g | **none given** | **OWNER CALL (Q8)** |
| Dropped: no waiting period given | carbofuran 3 CG (MUP-I p.10), chlorpyrifos 20 EC aphid (p.16), quinalphos 25 EC scale (p.46), sulphur 80 WP (MUP-F p.36), zineb 75 WP (p.43), captan 75 WP (p.4), aureofungin (p.3), streptomycin + tetracycline (p.28, p.31) | | | dropped |

---

## 7. What the check changed
1. **Psylla:** thiamethoxam corrected from PAU's 0.32 g/L to the label's 0.1 g/L. Imidacloprid removed from every row: the label gives no per-litre dose.
2. **Leaf miner:** PAU and TNAU imidacloprid replaced by thiamethoxam + lambda-cyhalothrin ZC, the citrus leaf-miner label with a per-litre dose.
3. **Canker:**
   - streptocycline removed: it is an antibiotic, the 2021 prohibition order phases it out of agriculture, and it has no waiting period;
   - copper sulphate + mancozeb WDG (label) put in;
   - routine canker sprays kept for lime only (PAU: Kagzi highly susceptible).
4. **Gummosis:**
   - Curzate paint corrected to the label's 25 g per litre of linseed oil;
   - sodium hypochlorite removed (no claim);
   - Trichoderma made an owner call;
   - the whole item moved to the plant page, because it treats affected trees.
5. **Copper sprays:** Bordeaux spray limited to March for mandarin and sweet orange (no fruit on the tree). PAU's July and September die-back sprays, its scab and melanose sprays, and every lime/lemon copper spray became owner calls.
6. **Mandarin pruning** moved to February, because Kinnow is picked until mid-February.
7. **Removed:**
   - PAU's mercuric chloride wound disinfectant;
   - GA₃ (PAU fruit drop), 2,4-D and NAA (TNAU): the PGR list has no citrus claim;
   - HMO (no MUP claim);
   - neem oil and NSKE: no azadirachtin citrus claim (guava precedent; Q7);
   - fish oil rosin soap (Q7);
   - malathion baits and traps;
   - dimethoate, monocrotophos, thiodicarb, oxydemeton-methyl, permethrin, phorate, quinalphos, carbofuran;
   - TNAU's carbendazim spray for lime;
   - the metaldehyde snail bait (nursery only).
8. **Kept as plant page rather than reminders:** zinc + manganese (PAU frames it as a deficiency cure) and Kinnow potash (zone-specific).
9. **Regions:** CENTRAL, WEST, EAST, COASTAL and HILLS are pending for every kind, and South Deccan is pending for lemon and mandarin.

**Row tally** (final; every reminder and plant-page item has a status and a source)

| Group | Rows | OK | Corrected | Owner call |
|---|---|---|---|---|
| North reminders | 13 (N1–N10, M1–M3) | 7 (N1, N3, N6, N10, M1–M3) | 6 (N2, N4, N5, N7, N8, N9) | — |
| North plant-page items | 11 | 7 (zinc, bark caterpillar, mites, mealybug, picking months, young watering, potash) | 3 (gummosis, canker on other kinds, fruit drop) | 1 (scab, melanose, die-back copper) |
| South reminders (lime) | 3 | 3 | — | — |
| South plant-page items (lime) | 9 | 6 | 3 (leaf miner, canker, twig blight) | — |
| South reminders (sweet orange, if Sathgudi) | 2 | 2 | — | — |
| **Total** | **38** | **25** | **12** | **1** |

Phase rows: North 6, South 1, all sourced.

Removed: 24 draft lines in all.
- 22 chemical lines from PAU, TNAU and NIPHM (each lacks a citrus label claim, a per-litre dose or a waiting period):
  - imidacloprid ×3 (PAU psylla, PAU leaf miner, TNAU leaf miner);
  - HMO;
  - streptocycline ×2 (PAU, TNAU);
  - sodium hypochlorite;
  - mercuric chloride;
  - GA₃, 2,4-D, NAA;
  - neem/NSKE ×2;
  - fish oil rosin soap;
  - malathion ×2;
  - dimethoate;
  - carbofuran;
  - carbendazim (lime);
  - thiodicarb;
  - quinalphos;
  - metaldehyde.
- 2 rows: PAU's July/Sep copper repeat, and the lime/lemon copper sprays.

## 8. Open questions for the owner
- **Q1.** Should plain **"lime"** pick the lime kind? Recommendation: yes.
  - In Indian usage "lime" means acid lime, and PAU and TNAU use it that way.
  - Rangpur lime, a rootstock, is rare in home gardens.
  - "Sweet lime" wins by position.
- **Q2.** Should **"sweet lime"** pick sweet orange (mosambi)? Recommendation: yes.
  - Most people mean mosambi.
  - But PAU lists a true Sweet Lime (Mitha) separately (p.17), and its care is unsourced.
- **Q3.** Narangi and santra: keep them on the fruit type only, or add a generic "Orange (santra/narangi)" entry with no kind?
- **Q4.** Add a **`citrus:Sathgudi`** entry (sweet orange, south_deccan)? Then the TNAU sweet orange rows (SO1–SO2) can ship.
- **Q5.** Add central_india to **Mosambi's** regions (Marathwada and Vidarbha)? It only matters once Central is sourced.
- **Q6.** Pomelo and grapefruit: no kind for now (recommended)? Should grapefruit get its own entry, since PAU grows it in Punjab?
- **Q7.** **Organic sprays without a citrus label claim**: neem oil 3%, NSKE 5%, fish oil rosin soap 25 g/L, *Trichoderma asperellum* 100 g + 2.5 kg FYM, and HMO.
  - The guava precedent drops them, so psylla and leaf miner have no organic spray.
  - Allow them as "traditional organic, ICAR/SAU-recommended", like Bordeaux?
- **Q8.** **Copper oxychloride 50 WP** has a citrus label claim (leaf spot, canker) but no waiting period.
  - Mango shipped it; guava dropped mancozeb for the same gap.
  - Allowing it would restore PAU's July and September die-back sprays and its scab and melanose sprays, and TNAU's twig-blight and canker sprays.
- **Q9.** TNAU's hill mandarin (Coorg, Kodai): which region does it belong to, SOUTH_DECCAN hill pockets or HILLS_COOL? Add Coorg and Kodai entries?
- **Q10.** **Imidacloprid** dose: the label says "50 ml/ha, volume by tree size" (also NIPHM p.25). PAU uses 0.4 ml/L and TNAU 0.5 ml/L. Leave it out (current draft), or accept the SAU per-litre dose as an owner call?
- **Q11.** Is the "don't spray insecticide on open flowers (bees)" caution acceptable as general practice? It is not in PAU. PAU's March psylla spray overlaps Kinnow's bloom.
- **Q12.** Is NORTH_INDIA = Punjab (PAU) acceptable for Haryana, Rajasthan, Delhi and western UP?
- **Q13.** PAU says its fruit fly traps are "less effective … if fixed in kitchen gardens instead of orchards". Keep N10 as a reminder, or move it to the plant page with the fallen-fruit advice only?
- **Q14.** **The North mandarin rows are Kinnow-specific:** the linear dose, KNO₃ (M2), thinning (M3) and the Jan 15–Feb 15 picking window (M1).
  - Any North mandarin would get them, e.g. a Nagpur or Daisy planted in Delhi.
  - PAU gives non-Kinnow mandarins the "other citrus" dose, and Daisy is picked by Nov 20.
  - Options: accept it (Kinnow is almost all of North mandarin), or split off a `kinnow` kind.
- **Q15.** **Age bands versus the content standard.** The standard says doses scale per year of age and are never hand-written bands.
  - PAU gives lime, lemon and sweet orange only bands (FYM and urea), and TNAU gives base + increment. So those rows carry no `Dose`, only row text.
  - Guava still had a per-age NPK `Dose`; these rows have none.
  - Accept the row text, or fit a per-age figure (my draft doesn't, because that would invent numbers)?

## Source links
- MUP: CIB&RC Major Uses of Pesticides (to 30.09.2026), https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides
  - insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28insecticide%29%20%2030.09.2026.pdf
  - fungicides: https://ppqs.gov.in/sites/default/files/Fungicide%20MUP%20%20as%20on%2030.09.2026.pdf
  - bio-insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28bio%20insecticide%29%2030.09.2026.pdf
  - PGR: https://ppqs.gov.in/sites/default/files/5.%20PGR%20MUP%20as%20on%2030.09.2026.pdf (no citrus entry)
  - bio-fungicides: https://ppqs.gov.in/sites/default/files/3.%20bio%20fungicides%20MUP%20as%20on%2030.09.2026.pdf (no citrus entry)
- PAU: Package of Practices for Cultivation of Fruit Crops, https://www.pau.edu/content/ccil/pf/pp_fruits.pdf (citrus pp.13–34; Bordeaux recipes pp.10–11)
- TNAU: Crop Production Guide, Horticulture Crops 2020, https://agritech.tnau.ac.in/pdf/HORTICULTURE.pdf (acid lime pp.14–16, sweet orange pp.17–18, mandarin pp.18–19)
- NIPHM: AESA based IPM, Citrus, https://niphm.gov.in/IPMPackages/Citrus.pdf (pp.24–27)
- Streptomycin + tetracycline prohibition (draft order, Dec 2021; full ban in agriculture from 1 Jan 2024): https://www.downtoearth.org.in/agriculture/union-agriculture-ministry-prohibits-use-of-tb-antibiotics-on-crops-80785. The final gazette was not confirmed; the line is dropped anyway, because it has no waiting period.
- Not reachable (cited only for the pending reason):
  - CCRI monthly advisories, e.g. https://ccri.icar.gov.in/site/assets/files/1223/december.pdf and https://ccri.icar.gov.in/site/assets/files/1223/may.pdf
  - HP-SHIVA/YSPUHF citrus PoP: https://www.hpshiva.in/wp-content/uploads/2025/10/citrus.pdf
