# Citrus: pomelo kind (chakotra, batabi lebu): draft + source check (2026-11-24, for owner review)

This draft adds a fifth citrus kind, `pomelo` (*Citrus maxima*, syn. *C. grandis*), to the four in the approved citrus doc (`docs/plant-care/citrus.md`, §1). That doc left `citrus:Chakotra` with no kind because no pomelo source was found (its Q6). One pomelo source has now been found, plus the PAU citrus chapter, which applies to citrus in general.

**Outcome:**
- NORTH_INDIA can ship: 10 dated reminders, 11 plant-page items and 4 phases.
- EAST_INDIA stays pending, because no eastern source was reached (§5).
- Most North rows reuse the approved citrus rows. Four are new for pomelo: manure, the two feeds, summer watering and picking.

Sources (full links at the end):
- **IH 2026** = Shivam, Kuldeep, M. Sankaran and Jai Prakash, "Pummelo: A future fruit for human health and wellness", *Indian Horticulture* (ICAR), March–April 2026, pp.18–20 (printed pages).
  - The authors are a PhD scholar at ICAR-IIHR Bengaluru, a PhD scholar at GBPUAT Pantnagar, the Head of the Division of Fruit Crops at ICAR-IIHR, and a Principal Scientist in the Division of Fruits at ICAR-IARI New Delhi.
  - **It is a popular ICAR magazine article, not an IIHR package of practices** (Q1).
  - It is the only pomelo-specific Indian source found. Its timing is given for **North India** ("Flowering occurs during March–April, and fruits mature from October to November in North India", p.19).
- **PAU** = Package of Practices for Cultivation of Fruits (2021), citrus chapter, printed pp.13–34; Bordeaux recipes pp.10–11. PAU covers mandarin, sweet orange, lime, lemon and **grapefruit**, but not pomelo (see §1.2).
- **MUP** = CIB&RC Major Uses of Pesticides to 30.09.2026. MUP-I is insecticides, MUP-F fungicides, MUP-BI bio-insecticides. PDF pages.
- **NIPHM** = AESA based IPM package, Citrus (as used in the approved citrus doc).

**Searched, nothing usable for pomelo:**

| Source | Result |
|---|---|
| Assam AU: PoP Horticulture 2023 (KVK Kokrajhar) and 2021 (KVK Udalguri) | Both links return 404. The Assam Directorate of Horticulture 2016 package also returns 404. |
| Assam AU: PoP Horticulture 2015 (KVK Jorhat) | Read in full. Citrus covers **Assam lemon and Khasi mandarin only**. "Pummelo" appears only in a list of hedge and windbreak trees. Not used: lemon and mandarin care shouldn't stand in for pomelo in the East. |
| BCKV (West Bengal) | Only germplasm work at the Mondouri research station (Nadia) and annual reports. No cultivation guide. Search confirms "batabi" is the Bengal name. |
| BAU Sabour (Bihar) | Only a survey-and-collection project on pummelo in Bihar. No package. |
| OUAT (Odisha) | Nothing on pummelo. |
| ICAR-CCRI Nagpur | Released NRCC Pummelo-5 (IH 2026 p.19), but no pummelo folder or advisory was found. |
| ICAR-IIHR | Arka Chandra and Arka Anantha varieties; the only care text is IH 2026. |
| NHB | No pummelo crop sheet found. |
| TNAU Crop Production Guide 2020 | No pummelo section. |
| KAU | Not needed: COASTAL_HUMID is not in pomelo's `grownIn`. |
| Search snippet: Assam "20–30 kg FYM, 260 g N … Feb–Mar and Sep–Oct" | **Not used.** Its PDF could not be opened, and the line is under a citrus-decline heading, not pomelo. |

---

## 1. The kind

### 1.1 Kind record

| Field | Proposal |
|---|---|
| `key` | `pomelo` |
| Label | Pomelo (Chakotra, batabi lebu) |
| `words` | pomelo, pummelo, shaddock, chakotra, chakotara, chakotha, batabi, चकोतरा |
| `varietyWords` | none |
| `grownIn` | NORTH_INDIA, EAST_INDIA (the regions of `citrus:Chakotra`) |
| `regions` | `NORTH_INDIA: north('pomelo')` (IH 2026 + PAU; §3) |
| `pendingRegions` | EAST_INDIA, WEST_INDIA, CENTRAL_INDIA, SOUTH_DECCAN, COASTAL_HUMID, HILLS_COOL. Seed convention (citrus.seed.ts, comment at line 21): every region without checked care is pending, even outside `grownIn`, so the engine never lends this kind another region's care. |

**Why pomelo is its own kind, and does not reuse lime, lemon, mandarin or sweet orange whole:**
- **Season.** It flowers Mar–Apr and its fruit matures Oct–Nov in North India (IH 2026 p.19).
  - This is unlike Kinnow (picked Jan–Feb) and the lime, which bears all year.
  - So pomelo needs its own phases and a picking row.
  - A March copper spray is "no fruit on the tree" for pomelo.
- **Feeding.** IH 2026 gives a pomelo-only year-by-year dose table, about twice PAU's "other citrus" nitrogen at the same age (§2).
- **Watering.** IH 2026 says bearing trees every 7–10 days in summer, where PAU says every 2–3 weeks for citrus.
- **No routine canker spray.** That is lime-only, kept for Kagzi's high susceptibility; pomelo's susceptibility is unsourced (Q6).

### 1.2 Can PAU's grapefruit stand for pomelo?
- PAU's grapefruit is *Citrus paradisii* (PAU's botanical-names table at the back of the book): Star Ruby, Red Blush, Marsh Seedless, Duncan, Foster. It is a different fruit. The approved citrus doc already removed "grapefruit" from `citrus:Chakotra`'s aliases for this reason.
- PAU gives grapefruit only the generic "Fertilizer schedule for citrus plants other than Kinnow" (p.21) and says "Kagzi lime and Grapefruit are highly susceptible" to canker (p.31).
- PAU never names pomelo, so its grapefruit lines cannot stand for pomelo.
- What can be reused for pomelo is **PAU's citrus-wide text**: pruning months, die-back Bordeaux, pests, gummosis and zinc. PAU writes these for "citrus" as a whole, and IH 2026 lists the same pests and diseases for pummelo ("foot rot, root rot, crown rot, gummosis, powdery mildew, scab, and citrus greening … soft green scale, citrus leaf miner, aphids, and citrus psylla", p.20).
- **Proposal:** take PAU's citrus-wide rows, but not its grapefruit dose. Q2 asks whether the owner prefers PAU's "other citrus" dose instead of IH 2026's.

### 1.3 Words: check
Checked against `domain/words.ts` (whole-word, any script, NFC, lower-case) and every word on the four existing kinds (citrus.seed.ts lines 655–790).

| Word | Source | Collision? |
|---|---|---|
| pomelo | catalogue alias; IH 2026 p.18 | none |
| pummelo | IH 2026 (title and throughout) | none |
| shaddock | IH 2026 p.18 ("pomelo, shaddock, Chinese grapefruit") | none |
| chakotra | catalogue variety and alias | none |
| chakotara, chakotha | IH 2026 p.18 ("locally as chakotha or chakotara") | none |
| batabi | catalogue alias "batabi lebu"; BCKV ("'Batabi' (in Bengal)") | **none:** "batavian" (sweet orange) is a different whole word. "batabi lebu" matches through "batabi", so "lebu" can stay a no-kind word. |
| चकोतरा | catalogue `hi` | none |

- **Kept off the words:** "grapefruit" (a different fruit; stays no-kind) and "Chinese grapefruit". The latter needs no entry: it contains no kind word, so it resolves to no kind, which is correct.
- **Considered, not added (unsourced here):** pumelo, jambura, robab tenga (Assamese), Bengali script বাতাবি লেবু (Q8).
- **How `citrus:Chakotra` resolves:** variety "Chakotra" → `chakotra` → pomelo. Species "pomelo" and name "Pomelo (Chakotra)" agree. No other entry's variety, species or display name contains a pomelo word.
- **Changes to §2 of the approved citrus doc (ambiguous words: pick NO kind):**
  - **move off:** pomelo, chakotra, चकोतरा;
  - **stay:** grapefruit, lebu, nimbu, and the rest.
  - `noKindWords` (`kaffir`, `makrut`) is unchanged.
- **Test impact (for the implementer):**
  - `citrus.seed.spec.ts` line 34 expects `'citrus:Chakotra': null`. It becomes `'pomelo'`.
  - `species-normalization.service.spec.ts` (`['Chakotra', 'citrus']`) is unaffected.
- **Search aliases (outside the care seed, Q8):** the citrus fruit type's `match_aliases` has pomelo and chakotra, but not batabi, pummelo or shaddock. So a tree typed only "batabi lebu" may not resolve to citrus at all.

---

## 2. Rules used

1. **Recipes (PAU pp.10–11, as in the approved citrus doc):**
   - **Bordeaux paste:** 200 g copper sulphate in 1.5 L water; 300 g quicklime slaked in 1.5 L water; mix the two. Brush it on cuts. Wear gloves.
   - **Bordeaux mixture 2:2:250:** 8 g copper sulphate and 8 g quicklime per litre. Dissolve each in half the water in non-metal vessels, then pour the copper into the lime while stirring. Not in rain or great heat. Wear gloves.
   - IH 2026 supports the paste: "Bordeaux paste should be applied immediately after pruning to prevent secondary infection" (p.20).
2. **Bordeaux exception (owner, 2026-11-12):**
   - Paste on cuts.
   - Spray only with no fruit on the tree. For a North pomelo that means after the Oct–Nov picking and before fruit set (March is safe).
   - **No soil drench at the stem base.** Neither PAU nor IH 2026 gives one. PAU's gummosis treatment is paste, then Bordeaux paint, then a spray (p.32). This follows the apple, peach, plum and cherry precedent.
3. **Dose (IH 2026 p.19, "Annual requirement of manure and fertilizers in pummelo", per tree per year):**

   | Year | FYM (kg) | N (g) | P (g) | K (g) | N as urea (g), N ÷ 0.46 |
   |---|---|---|---|---|---|
   | 1st | 10–15 | 80–100 | 60–80 | 80–100 | 175–220 |
   | 2nd | 20–25 | 160–200 | 160–180 | 160–200 | 350–435 |
   | 3rd | 30–35 | 300–350 | 260–280 | 300–350 | 650–760 |
   | 4th | 40–45 | 450–500 | 360–380 | 450–500 | 980–1090 |
   | 5th onwards | 50–55 | 600–650 | 460–480 | 600–650 | 1300–1410 |

   - **FYM:** the lower figure is exactly 10 kg × age up to 5 years. So it becomes a `Dose`: organic `[FYM 10000]`, `maxAgeYears: 5`.
     - This reads the table as given; nothing is fitted.
     - Q3 asks whether to use the upper figure instead.
   - **N** is not linear in age (80, 160, 300, 450, 600). It goes in the row text as urea, by year (citrus Q15 precedent: row text, no `Dose`).
   - **P and K are not converted** into SSP or MOP. The table says "P (g)" and "K (g)", not P₂O₅ and K₂O. If it means elemental P, the SSP amount changes by about 2.3 times. Held as Q4; the feeds carry urea only until the owner decides.
   - **Split:** IH 2026 says "Inorganic fertilizers should be applied in two split doses". The rows give half the urea at each feed; equal halves is my reading (Q4).
4. **Timing of feeds:**
   - **Manure:** IH 2026 says Dec–Jan; PAU says December for citrus. The window is Dec 1–Jan 31.
   - **First feed:** February. PAU gives February for citrus, and IH 2026's "first before flowering" agrees, since pomelo flowers in Mar–Apr.
   - **Second feed:** **Apr 1–May 31 (PAU, citrus: "second half in April–May after fruit set").** IH 2026 says only "the second 4–6 months later". Jun–Aug would be my own count from a February first dose, so it is not used (Q5).
5. **Chemicals:** only products with a "Citrus" claim in MUP, with a per-litre dose and a waiting period, exactly as in the approved citrus doc (§6 there). MUP lists the crop as "Citrus", never a species. No pomelo, pummelo, grapefruit or shaddock row exists in MUP-I, MUP-F or MUP-BI (searched). Whether "Citrus" covers pomelo is Q7.
6. **Neem products, *Trichoderma*, and other organics without a label claim** are dropped (approved citrus Q7 precedent).
7. **February windows end on the 29th** (house leap-day rule; citrus.seed.ts `month()`).
8. **Fertilisers** (urea, boric acid, zinc and manganese sulphate) have no waiting period.

---

## 3. NORTH_INDIA care table (IH 2026 + PAU)

**How each row reaches the seed** (column "Seed"):
- **A** = an existing citrus row with no `kinds` field. It already applies to every kind, so pomelo gets it unchanged.
- **K** = an existing row with a `kinds` list: add `'pomelo'` to it.
- **N** = a new pomelo-only row (`kinds: ['pomelo']`).
- **X** = an existing all-kinds row that must be narrowed to `kinds: ['lime', 'lemon', 'mandarin', 'sweet_orange']`, so pomelo doesn't get it as well as its own row.

### 3.1 Reminders (CALENDAR)

| # | Key | Seed | Reminder (≤60) | Window | Stages | Cat. | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | `manure` | N | Spread the year's manure under the tree | Dec 1–Jan 31 | young, bearing | FEEDING | All the year's FYM in the basin under the canopy, forked in lightly: **10 kg × age, up to 5 years (50 kg)**. `Dose` organic `[FYM 10000]`, `maxAgeYears: 5` | — | Manure goes in during the winter rest, before spring growth | OK. IH: "Organic manure should preferably be applied during December–January". The FYM figure is from the IH table (rule 2.3) | IH 2026 p.19; PAU p.21 |
| P2 | `prune` | K (the `OTHERS` variant, Jan–Feb) | Prune out dead and diseased twigs | Jan 1–Feb 29 | bearing | PRUNING | Cut dead, dried, diseased and criss-cross branches and water sprouts back to healthy wood, open up the centre and burn the prunings. Seal cuts with Bordeaux paste (rule 2.1). Wear gloves | — | Stops die-back spreading and lets light in | OK. IH gives the what ("dead, dry, crisscross branches and water sprouts", paste right after) but no month. PAU's citrus pruning is "January to February". Pomelo is picked by November, so the tree is bare of fruit | IH 2026 p.20; PAU p.21, p.25, p.33 |
| P3 | `first_feed` | N | Give the first feed before flowering | Feb 1–29 | young, bearing | FEEDING | — | Half the year's urea in the basin; water in. By year: 90–110 g (1st), 175–220 g (2nd), 325–380 g (3rd), 490–545 g (4th), 650–705 g (5th on). Wear gloves | Feeds the spring flush and the flowers | OK (urea = N ÷ 0.46, halved). P and K held (Q4) | IH 2026 p.19; PAU p.22 |
| P4 | `bordeaux_spray` | K (`['mandarin', 'sweet_orange']` → add pomelo) | Spray Bordeaux mixture after pruning | Mar 1–31 | bearing | PROTECTION | Bordeaux mixture 2:2:250 (rule 2.1). Skip it if fruit is still on the tree; not in rain or great heat. Wear gloves | — | Protects cuts and the new flush from die-back | OK. PAU: "Remove the infected twigs during February and then spray with Bordeaux mixture … during March" for citrus. Pomelo carries no fruit in March (picked Oct–Nov). PAU's July and September repeats fall on fruit and stay out (citrus precedent) | PAU p.33; IH 2026 p.19 |
| P5 | `psylla` | A | Spray against citrus psylla | Mar 1–31 + Sep 1–10 | young, bearing | PROTECTION | Pinch off and destroy curled new shoots carrying nymphs | Thiamethoxam 25 WG 0.1 g per litre (1 g in 10 L); spray in the evening, not on open flowers. Wear gloves; not within 20 days of picking | Psylla sucks new shoots and spreads greening | OK. IH lists psylla as a major pummelo pest and greening as a major disease. IH's dimethoate and imidacloprid were removed (dimethoate: no citrus claim; imidacloprid: no per-litre dose, citrus Q10) | IH 2026 p.20; PAU p.28; MUP-I p.53 (100 g in 1000 L, 20 days) |
| P6 | `summer_water_pomelo` | N, and the existing `summer_water` becomes X | Water every 7–10 days through the summer | Apr 1–Jun 30 | young, bearing | WATERING | Bearing tree: every 7–10 days. Young tree: twice a week. Use a ring basin so water doesn't touch the trunk; don't flood. Keep the basin weed-free | — | Steady water from flowering to harvest holds the fruit and stops splitting | OK. IH: "young trees twice a week during summer … Bearing trees … 7–10 day intervals in summer". "Summer" = Apr–Jun is PAU's citrus hot-weather window (p.23), as in the approved citrus `summer_water` row | IH 2026 p.19; PAU p.23 |
| P7 | `leaf_miner` | A | Spray young trees for leaf miner | Apr 1–May 31 + Aug 1–Sep 30 | young | PROTECTION | Pick off and burn leaves with silvery tunnels | Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC 0.3 ml per litre. Wear gloves; not within 10 days of picking | Tunnels curl young leaves and open the way for canker | OK. IH lists leaf miner for pummelo | IH 2026 p.20; PAU p.28; MUP-I p.87 (150 ml in 500 L, 10 days) |
| P8 | `second_feed` | N | Give the second feed after fruit set | Apr 1–May 31 | young, bearing | FEEDING | — | The other half of the year's urea (amounts as P3); water in. Wear gloves | Feeds the young fruit | **corrected:** the draft's Jun–Aug (my count from IH's "4–6 months later") was replaced by PAU's stated citrus months (Q5) | PAU p.22; IH 2026 p.19 |
| P9 | `fallen_fruit` | K (`['mandarin', 'sweet_orange']` → add pomelo) | Collect and bury fallen fruit | Aug 8–14 | bearing | GENERAL | From now until picking, collect stung or fallen fruit and bury it deep | — | Flies sting fruit at colour break; the fruit rots and drops | OK. PAU's citrus fruit fly control starts "second week of August". IH lists fruit fly for pummelo (its malathion bait was removed) | PAU p.31; IH 2026 p.20 |
| P10 | `pick_pomelo` | N | Pick pomelos when the rind turns bright yellow | Oct 1–Nov 30 | bearing | GENERAL | Pick at full eating ripeness: the oil glands on the rind grow larger and glossier, and the colour turns from dull to bright yellow. Clip with a short stalk; don't pull. Pick on time: fruit left too long goes dry and grainy inside | — | Pomelo doesn't ripen further once picked | OK. IH: "fruits mature from October to November in North India … non-climacteric … harvested at full eating maturity"; granulation: "Timely harvesting". "Clip, don't pull" is PAU's citrus picking rule (p.26) | IH 2026 pp.19–20; PAU p.26 |

**Month check, bearing tree (at most 3):**
- Jan: P1, P2 (2).
- Feb: P2, P3 (2).
- Mar: P4, P5 (2).
- Apr: P6, P8 (2).
- May: P6, P8 (2).
- Jun: P6 (1).
- Aug: P9 (1).
- Sep: P5 (1).
- Oct and Nov: P10 (1).
- Dec: P1 (1).
- Jul: none.

**Month check, young tree:**
- Feb: P3 (1). Mar: P5 (1).
- Apr and May: P6, P7, P8 (3).
- Aug: P7 (1). Sep: P5, P7 (2).
- Dec and Jan: P1 (1).

No month has more than 3.

### 3.2 Plant page only (conditional, never reminders)

| # | Key | Seed | Only if you see… | What to do (organic first) | Chemical alternative | Window kept from seed | Check | Source |
|---|---|---|---|---|---|---|---|---|
| C1 | `gummosis` | A | Gum oozing from the trunk base, cracked bark, pale leaves | Keep water off the trunk with a ring basin; don't flood or hoe deep. Scrape the lesion clean and cover it with Bordeaux paste. Wear gloves | Cymoxanil 8% + mancozeb 64% WP: drench 2.5 g per litre, 10 L per tree, or paint the lesion with 25 g per litre of linseed oil. Wear gloves; not within 82 days of picking | Feb–Mar, Jul–Aug | OK. IH lists foot rot and gummosis for pummelo. IH's Ridomil MZ 72 and Aliette (no citrus claim) and *Trichoderma* (precedent) were removed. Metalaxyl-M 3.3% + chlorothalonil 33.1% SC (2 ml/L drench, 51 days) stays a spare | IH 2026 p.20; PAU p.32; MUP-F p.60 |
| C2 | `zinc_manganese` | A | Mottled leaves, or small narrow "little leaf" | — | Zinc sulphate 4.7 g + manganese sulphate 3.3 g per litre on fully grown flush leaves; keep a week from any Bordeaux spray. A fertiliser, so no waiting days. Wear gloves | late Apr, mid-Aug | OK (PAU, citrus-wide) | PAU p.22 |
| C3 | `bark_caterpillar` | A | Webbing and chewed bark on the trunk | Pull off the webbing and push kerosene into the holes | — | Sep–Oct, Jan–Feb | OK | PAU p.30 |
| C4 | `mites` | A | Fine specks, dusty-looking leaves | — | Diafenthiuron 50 WP 2 g per litre. Wear gloves; not within 30 days of picking | May–Jun, Aug–Sep | OK | PAU p.30; MUP-I (citrus mites, 2 g/L, 30 days) |
| C5 | `mealybug` | A | White cottony clusters on shoots and fruit | Keep branches off the ground, prune and destroy infested shoots, destroy ant nests; or spray *Verticillium lecanii* 1.15% WP about 4.5 g per litre. Wear gloves | — | Jul–Oct | OK. PAU, citrus-wide; IH doesn't list mealybug for pummelo | PAU p.30; MUP-BI p.12 |
| C6 | `canker_spots` | K (`['lemon', 'mandarin', 'sweet_orange']` → add pomelo) | Corky raised spots on leaves, twigs or fruit | Cut out and burn spotted twigs before the monsoon | If it spreads: copper sulphate 47.15% + mancozeb 30% WDG 5 g per litre. Wear gloves; not within 10 days of picking | May–Jun | OK as a conditional. No routine spray (Q6) | PAU p.31; NIPHM p.26; MUP-F p.59 |
| C7 | `fruit_drop` | A | Fruit dropping before it ripens | Destroy dried fruit left on the tree, bury fallen fruit deep, prune and feed on schedule, and keep water from standing in the basin | — | all year | OK | PAU pp.25–26 |
| C8 | `fruit_fly_trap` | **N** (copy of the existing row, with pomelo's own window) | Fruit with sting marks, rotting at colour break | Hang a PAU fruit fly trap 1–1.5 m up in shade until picking; recharge it if fresh damage appears. PAU says traps work less well in home gardens than in orchards | — | **Aug 8–Nov 30** (the existing row runs to Mar 31 for Valencia; pomelo is picked by Nov) | OK. IH's "pheromone traps 4 to 6 per acre" agrees in kind | PAU p.31, pp.154–155; IH 2026 p.20 |
| C9 | `young_water` | A | A young tree, up to 3–4 years old | Water every week into a ring basin, off the trunk | — | all year | OK. Summer is twice a week (P6, IH). Winter: IH gives bearing trees 30–40 days; this weekly young-tree rule is PAU's | PAU p.23; IH 2026 p.19 |
| C10 | `fruit_split` | N | Fruit cracking lengthwise near the bottom end, juice sacs showing (title: "Water evenly to stop pomelo fruit splitting") | Water evenly from flowering to harvest; never let the basin dry hard and then flood it. Mulch the basin | Boric acid 1 g per litre (0.1%) on the leaves. A fertiliser, so no waiting days. Wear gloves | none (IH gives no month; `ALL_YEAR` as for `fruit_drop`) | **corrected:** IH's calcium chloride 0.5–1% was removed (not on the CIB&RC or fertiliser lists checked; same reasoning as pomegranate's liquid paraffin). Boric acid kept as a fertiliser (pomegranate C2 precedent), with IH's dose | IH 2026 pp.19–20 |
| C11 | `greening` | N | New leaves yellow and blotchy, fruit small, lopsided and staying green, with insipid juice (title: "Remove a tree with citrus greening") | Remove and destroy the infected tree. Replant only with disease-free nursery plants, and keep psylla down (P5) | — | none (`ALL_YEAR`) | OK. No spray cures it | IH 2026 p.20; PAU p.33 |

C1–C9 keep the seed's existing stages. C10 is bearing only; C11 is young and bearing.

**Plant-page notes (plain text, no reminder):**
- Pomelo starts flowering 4–5 years after planting (IH p.19).
- Mature trees bear about 70–100 fruits, 50–100 kg a year (IH p.19).
- Training: open centre, light pruning after planting to build the frame (IH p.20).

### 3.3 Phases, NORTH_INDIA (new; `PHASES(kind)` doesn't fit an Oct–Nov harvest)

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `winter_rest` | Dec–Feb | Heavy watering; a bearing tree needs water only every 30–40 days in winter | Bark-eating caterpillar (Jan–Feb) | IH 2026 p.19; PAU p.30 |
| `spring_flush_and_flowering` | Mar–Apr | Water stress once flowering starts; insecticide on open flowers | Psylla, thrips (Mar–Apr), leaf miner | IH 2026 p.19 (flowering Mar–Apr; "regular irrigation from flowering to harvest"); PAU pp.28–30 |
| `fruit_growth` | May–Sep | Letting the basin dry out, then flooding (splitting); water standing at the trunk | Mites (May–Jun), gummosis, mealybug (Jul–Oct), fruit fly (from Aug) | IH 2026 pp.19–20; PAU pp.30–33 |
| `harvest` | Oct–Nov | Leaving ripe fruit on the tree (dry, grainy segments) | Fruit fly | IH 2026 pp.19–20 |

Every month belongs to a phase.

---

## 4. Reuse, row by row (approved citrus seed → pomelo)

| Citrus seed row | Kinds today | For pomelo | Reason |
|---|---|---|---|
| `manure` (two variants) | mandarin / OTHERS | **not reused**: new P1 | IH gives a pomelo dose and Dec–Jan |
| `first_feed` (two variants) | mandarin / OTHERS | **not reused**: new P3 | IH dose; PAU's "other citrus" bands are about half (Q2) |
| `second_feed` (two variants) | mandarin / OTHERS | **not reused**: new P8 (same window as PAU) | IH dose |
| `prune` (OTHERS, Jan 1–Feb 29) | lime, lemon, sweet orange | **add pomelo** | PAU citrus months; IH confirms what to cut and the paste |
| `prune` (mandarin, Feb) | mandarin | no | Kinnow-specific month |
| `bordeaux_spray` | mandarin, sweet orange | **add pomelo** | No fruit in March |
| `summer_water` | all (no `kinds`) | **narrow to the four kinds**; pomelo gets P6 | IH: 7–10 days, not 2–3 weeks |
| `psylla` | all | unchanged (applies) | IH pest; PAU months |
| `leaf_miner` | all | unchanged (applies) | IH pest; PAU months |
| `canker` (routine Oct, Dec, Feb) | lime | no | Kagzi-only; Q6 |
| `fallen_fruit` | mandarin, sweet orange | **add pomelo** | PAU citrus fruit fly timing; IH lists fruit fly |
| `pick_kinnow`, `potassium_nitrate`, `thin_young` | mandarin | no | Kinnow-only (PAU) |
| `gummosis`, `zinc_manganese`, `bark_caterpillar`, `mites`, `mealybug`, `fruit_drop`, `young_water` | all | unchanged (apply) | PAU citrus-wide |
| `canker_spots` | lemon, mandarin, sweet orange | **add pomelo** | Conditional only |
| `fruit_fly_trap` | mandarin, sweet orange (Aug 8–Mar 31) | **not reused**: new C8 with Aug 8–Nov 30 | Pomelo is picked by Nov |
| SOUTH_DECCAN rows | lime, sweet orange | no | Pomelo is not grown there in the catalogue |

---

## 5. Pending regions

- **EAST_INDIA (in `grownIn`): pending.**
  - No eastern pomelo source was reached (table above).
  - IH 2026 names the East (North-East, eastern UP, Bihar, West Bengal) as where pummelo is grown in homesteads, but gives timing only for North India.
  - The AAU 2015 package covers Assam lemon and Khasi mandarin only.
  - Gardeners there keep the season pack.
  - The undated IH advice (watering intervals, pruning, splitting, greening) would apply there too, once the East has a calendar (Q9).
- **All other regions:** not in `grownIn`; pending by the seed convention.

## 6. Label claims checked (MUP to 30.09.2026; crop "Citrus", no pomelo row)

| Product | Claim | Dose on label → per litre | Waiting days | Used? |
|---|---|---|---|---|
| Thiamethoxam 25 WG (MUP-I p.53) | Citrus psylla | 100 g in 1000 L → **0.1 g/L** | 20 | yes (P5) |
| Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC (MUP-I p.87) | Citrus psyllids, thrips, leaf miner | 150 ml in 500 L → **0.3 ml/L** | 10 | yes (P7) |
| Cyantraniliprole 10.26% OD (MUP-I p.19) | Citrus psylla, thrips | 600 ml in 500 L → 1.2 ml/L | 5 | spare |
| Diafenthiuron 50 WP (MUP-I p.24) | Citrus mites | **2 g/L** | 30 | yes (C4) |
| *Verticillium lecanii* 1.15 WP (MUP-BI p.12) | Citrus mealybug | ~4.5 g/L | — (bio) | yes (C5) |
| Copper sulphate 47.15% + mancozeb 30% WDG (MUP-F p.59) | Citrus canker, Alternaria spot | 2.5 kg in 500 L → **5 g/L** | 10 | yes (C6) |
| Cymoxanil 8% + mancozeb 64% WP (MUP-F p.60) | Citrus gummosis (foot rot) | **2.5 g/L** drench, 10 L/tree; 25 g/L linseed-oil paint | 82 | yes (C1) |
| Metalaxyl-M 3.3% + chlorothalonil 33.1% SC (MUP-F p.74) | Citrus Phytophthora foot rot | 2 ml/L drench, 5 L/tree | 51 | spare |
| Sulphur 80% WP (MUP-F p.36) | Citrus powdery mildew | 2.5 kg/ha | **none given** | **no** (IH's "wettable sulphur 2 g/l" dropped; citrus precedent) |
| Copper oxychloride 50 WP (MUP-F p.8) | Citrus leaf spot, canker | 2.5 g/L | none given | no (citrus Q8 precedent) |
| IH's Ridomil MZ 72 (metalaxyl + mancozeb), Aliette (fosetyl-Al) | no citrus row in MUP-F | — | — | **removed** |
| IH's methyl parathion (scale) | banned in India | — | — | **removed** |
| IH's methomyl (scale), dimethoate (psylla) | no citrus row in MUP-I | — | — | **removed** |
| IH's imidacloprid 0.003% (psylla) | Citrus claim exists, but no per-litre dose (citrus Q10) | — | 15 | **removed** |
| IH's malathion + carbendazim bait (fruit fly) | no citrus bait claim | — | — | **removed** |

## 7. What the check changed

1. **Second feed:** IH's "4–6 months later" (would be Jun–Aug by my count) replaced by PAU's stated Apr–May (P8, Q5).
2. **P and K held:** urea only in the feeds until the P₂O₅/P reading is settled (Q4).
3. **No Bordeaux soil drench:** no source gives one for citrus (rule 2.2).
4. **Removed chemicals:** Ridomil MZ, Aliette, methyl parathion (banned), methomyl, dimethoate, imidacloprid, the malathion bait, wettable sulphur (no waiting period) and calcium chloride (not listed).
5. **Removed organics:** *Trichoderma harzianum* 100–150 g per pit (precedent).
6. **Removed items with no replacement:**
   - **Soft green scale:** IH's products are banned or have no claim. Quinalphos (citrus scale, MUP-I) has no waiting period. No sourced organic step.
   - **Powdery mildew and scab:** sulphur has no waiting period. PAU's scab copper sprays fall in Jun–Aug, when fruit is on the tree (citrus Q8 precedent).
7. **Not borrowed from grapefruit:** PAU's grapefruit lines (the "other citrus" dose, canker susceptibility) are not pomelo (§1.2).

**Row tally**

| Group | Rows | OK | Corrected | Held/open |
|---|---|---|---|---|
| NORTH reminders (P1–P10) | 10 | 9 | 1 (P8) | — (P and K amounts held, Q4) |
| NORTH plant page (C1–C11) | 11 | 10 | 1 (C10) | — |
| NORTH phases | 4 | 4 | — | — |
| EAST | — | — | — | pending |
| **Total** | **25** | **23** | **2** | — |

Of the 21 items:
- 9 reuse approved rows unchanged (A: psylla, leaf_miner, gummosis, zinc_manganese, bark_caterpillar, mites, mealybug, fruit_drop, young_water);
- 4 add `'pomelo'` to an existing kinds list (K: prune, bordeaux_spray, fallen_fruit, canker_spots);
- 8 are new pomelo rows (N: P1, P3, P6, P8, P10, C8, C10, C11; C8 copies an existing row with a new window).

One existing row is narrowed (X: `summer_water`).

## Source links
- IH 2026, "Pummelo: A future fruit for human health and wellness", *Indian Horticulture*, Mar–Apr 2026: https://epubs.icar.org.in/index.php/IndHort/article/download/168153/66064/526158 (dose table, manure timing, irrigation p.19; flowering and harvest p.19; pruning, diseases and pests p.20)
- PAU Package of Practices for Cultivation of Fruits: https://www.pau.edu/content/ccil/pf/pp_fruits.pdf (citrus pp.13–34; grapefruit varieties pp.15–16; "other than Kinnow" schedule p.21; feed timing pp.21–22; pests pp.28–31; diseases pp.31–33; botanical-names table at the back; Bordeaux pp.10–11)
- NIPHM AESA IPM, Citrus: https://niphm.gov.in/IPMPackages/Citrus.pdf
- MUP (CIB&RC): https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides
  - insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28insecticide%29%20%2030.09.2026.pdf
  - fungicides: https://ppqs.gov.in/sites/default/files/Fungicide%20MUP%20%20as%20on%2030.09.2026.pdf
  - bio-insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28bio%20insecticide%29%2030.09.2026.pdf
- AAU PoP Horticulture 2015 (read; no pomelo): https://kvkjorhat.aau.ac.in/docs/pop/POP-Horti2015.pdf
- Not reached (404): https://kvkkokrajhar.aau.ac.in/PoP/PoP_(Horticulture)_2023.pdf; https://kvkudalguri.aau.ac.in/pdf/PoP/PoP_(Horticulture)_2021.pdf; the Assam Directorate of Horticulture 2016 package
- BCKV pummelo germplasm (background only, not used for care): https://www.cropandweed.com/vol10issue2/pdf2005/30.pdf

---

## 8. Open questions for the owner

- **Q1. Is one ICAR magazine article enough to ship NORTH?** IH 2026 is a popular article by IIHR and IARI scientists, not a package of practices. It is the only pomelo-specific Indian source found.
  - Every dated row also leans on PAU's citrus chapter, except the pomelo dose, summer watering and the picking month.
  - Recommendation: **yes, ship NORTH.** The timing comes from an IARI (Delhi) co-author and matches PAU's citrus calendar. Re-check if a CCRI or SAU pomelo package appears.
- **Q2. Dose source: IH 2026 (pomelo) or PAU "other citrus" (lime, lemon, grapefruit)?**
  - At 4 years, IH gives 450–500 g N; PAU gives 200–250 g.
  - Recommendation: **IH 2026.** It is pomelo-specific, and pomelo is a much bigger tree than lime or lemon.
- **Q3. FYM: lower or upper figure?** IH gives ranges (10–15, 20–25 … 50–55 kg). Recommendation: **the lower figure, 10 kg × age up to 5 years.** It is exact for every year and matches PAU's 10 kg per year for Kinnow.
- **Q4. P and K, and the split.** IH's table says "P (g)" and "K (g)".
  - If these are P₂O₅ and K₂O (the usual Indian convention, and how TNAU and PAU write their tables), year 5 is about 2.9–3.0 kg SSP and 1.0–1.1 kg MOP.
  - If elemental P and K, SSP is about 2.3 times and MOP about 1.2 times those amounts.
  - "Two split doses" isn't said to be equal.
  - Recommendation: **ship urea only (in halves) now.** Add P and K (all P with the first feed, as PAU does) once the owner accepts the P₂O₅/K₂O reading.
- **Q5. Second feed month.** IH says "4–6 months" after the first (my count: Jun–Aug). PAU says Apr–May for citrus. Recommendation: **PAU's Apr–May**, which is stated rather than counted.
- **Q6. Canker on pomelo.** PAU calls grapefruit highly susceptible, but nothing found says so for pomelo. Recommendation: **conditional only (C6)**, no routine Oct/Dec/Feb spray.
- **Q7. Do the CIB&RC "Citrus" claims cover pomelo?** MUP lists the crop as "Citrus" with no species; pomelo is *Citrus maxima*. The approved citrus doc applied the same claims to lime, lemon, mandarin and sweet orange. Recommendation: **yes, read "Citrus" as the genus**, and say "labelled for citrus" in the text.
- **Q8. Extra words and aliases.**
  - Add jambura, robab tenga or Bengali বাতাবি to the kind words? All are unsourced here.
  - Add batabi, pummelo and shaddock to the citrus fruit type's `match_aliases`, so "batabi lebu" finds citrus?
  - Recommendation: **add the three aliases** (they are already sourced, above). Leave the unsourced words out.
- **Q9. EAST_INDIA.** Recommendation: **keep it pending.** Ask BCKV Mondouri, BAU Sabour or AAU Tinsukia (citrus station) for a pomelo schedule. Until then, East pomelo trees keep the season pack.
- **Q10. Narrowing `summer_water`** to the four existing kinds, so pomelo gets only its 7–10-day row. Recommendation: **yes.** It changes no existing kind's care.

Status: **approved by the owner on 2026-11-24 with every recommendation** (review doc "Ber, pomelo and shahtoot care — owner review"). Transcribed into `backend/src/modules/catalogue/seed/tree-care/citrus.seed.ts` as the `pomelo` kind; aliases pummelo, shaddock and batabi added to the citrus fruit type.
