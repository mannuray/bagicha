# Papaya care: draft + source check (2026-11-23, approved)

Papaya has no kinds. Most care is counted **from the planting date** (`FROM_PLANTING`, per `docs/superpowers/specs/2026-11-23-planting-timed-care-design.md`). Dated seasonal steps use `CALENDAR`, and "only if you see it" steps are `conditional`.

Sources (full links at the end):
- **TNAU** = Crop Production Guide, Horticulture Crops 2020 (Directorate of Horticulture TN with TNAU). Papaya is on pp.33–34 and papaya mealybug on p.141. Printed pages.
- **KAU** = Package of Practices Recommendations: Crops, 15th ed. 2016. Papaya is on pp.221–222 and mealybug biocontrol on p.332. Kerala's summer months are on p.106 (coconut). Printed pages.
- **Assam AU** = Assam Agricultural University, Package of Practices for Horticultural Crops of Assam, 2023, papaya pp.27–29. Printed "Page |" numbers.
  - This is not "AAU Anand" (Gujarat).
- **JAU** = Junagadh Agricultural University, fruit science recommendations 2004–2018, papaya items 11–16. PDF p.2.
- **PAU** = Package of Practices for Cultivation of Fruits (2021), papaya pp.115–118. Printed pages; these are PDF pp.123–126.
- **NHB** = National Horticulture Board papaya crop sheets pap002–pap007, one page each, plus the NHB papaya model project report.
- **NIPHM** = AESA based IPM package, Papaya (NIPHM/DPPQS). PDF pages.
- **MUP** = CIB&RC Major Uses of Pesticides to 30.09.2026. MUP-I is insecticides, MUP-F fungicides, MUP-BI bio-insecticides. PDF pages. The PGR and bio-fungicide lists have no papaya entry.

**Not reached:**
- ICAR-IIHR: `iihr.res.in/papaya` returns "Page not found". No IIHR papaya bulletin was found; its doses are known only through NHB's table (pap006).
- I found no papaya package from BAU Sabour, RPCAU Pusa, ICAR-RCER, BCKV or OUAT. So EAST follows Assam only.
- I found no papaya package from MPKV, Dr BSKKV, JNKVV or IGKV.
- NAU Navsari research-recommendation PDFs (fertigation for Madhu Bindu) were found in search but not fetched.
- The ICAR-NEH KIRAN papaya sheet did not resolve (host not found).
- The Assam AU 2021 PoP link returned 404. The 2023 edition was used.

---

## 1. Regions

| Region | Source | Status | Notes |
|---|---|---|---|
| SOUTH_DECCAN | TNAU | **ships** | <ul><li>Follows Tamil Nadu.</li><li>Karnataka, AP and Telangana are not checked separately (as for citrus).</li><li>Planting-timed only, with no calendar rows. Tamil Nadu and Karnataka get their monsoons in different months, so drainage stays on the plant page.</li></ul> |
| COASTAL_HUMID | KAU | **ships** | <ul><li>Follows Kerala. Konkan, Goa and coastal Karnataka are not checked.</li><li>Planting-timed feeds plus three calendar rows.</li></ul> |
| EAST_INDIA | Assam AU | **ships if Q3 = yes** | <ul><li>Follows Assam. Bihar, West Bengal, Odisha and Jharkhand are not checked.</li><li>Planting-timed only.</li></ul> |
| WEST_INDIA | JAU | **drafted, kept in `pendingRegions`** (Q4) | <ul><li>A single Saurashtra research recommendation. Its feeds stop at month 4.</li><li>Ready if the owner says yes (citrus Sathgudi pattern).</li></ul> |
| CENTRAL_INDIA | — | **PENDING** | No JNKVV or IGKV papaya source was reached. Keeps the season pack. |
| NORTH_INDIA *(proposed, Q1)* | PAU | ships if Q1 = yes | <ul><li>Not in `grownIn` today.</li><li>PAU's feeds are calendar dates (Feb and Aug), so this region has **no** planting-timed rows and never asks for the planting month.</li></ul> |

There is no `sameAs`. The regional sources disagree on the feed start, the amount and the number of feeds, so each region carries its own rows.

## 2. Rules used for planting-timed rows

1. **Day 0 is the planting day.** A month-only date counts from the 15th (engine).
2. **Converting "months" to days:**
   - "N months after planting" (TNAU, KAU, Assam AU, NHB) opens at **day 30×N** and runs 30 days.
   - "During the Nth month" (JAU) is **days 30(N−1) to 30N−1**.
   - So TNAU's first feed "from the third month" is days 90–119, matching the owner's "about day 90".
   - TNAU's zinc and boron spray "at 4th and 8th MAP" is days 120–149 and 240–269.
3. **Windows are 30 days wide**, so the ±2-week error from a month-only date doesn't matter.
4. **Stages are `[YOUNG, BEARING]` on every planting-timed row.** Papaya flowers at 3–7 months, so a row tagged YOUNG would be lost once the gardener marks the plant as flowering.
5. **No negative days.**
   - Pit filling and TNAU's "maize border a month before transplanting" go on the plant page.
   - "At planting" rows use days 0–29.
6. **Where feeds stop:**
   - TNAU and KAU say "bimonthly" with no end. I stop at about **month 24**: TNAU gives a crop duration of 24–30 months, and KAU and Assam AU both say to replant after 2.5–3 years.
   - Assam AU gives its own count: 10 splits from day 0.
7. **Nutrients become products** with the citrus factors: urea = N ÷ 0.46, SSP = P₂O₅ ÷ 0.16, MOP = K₂O ÷ 0.60. Amounts are per plant per feed, in the text, with no `dose`.
   - 50 g each of N, P₂O₅ and K₂O = urea 110 g + SSP 310 g + MOP 85 g.
8. **Placement** (NHB pap006): in a ring 10 cm deep, 15–20 cm from the stem; cover it and water lightly. Wear gloves.
9. Fertilisers and micronutrients have no waiting period.

**Feeding agrees across sources** on roughly 40–50 g each of N, P₂O₅ and K₂O per feed, every 2 months:
- TNAU 50/50/50 g from month 3; NIPHM p.24 says the same;
- KAU 40/40/80 g;
- Assam AU 50/50/50 g from day 0;
- NHB 200 g a year in 5 splits from month 2.

The sources differ on the start day and on the number of feeds.

---

## 3. Care tables

### 3S. SOUTH_DECCAN (TNAU)

**Planting-timed**

| # | Key(s) | Reminder (≤60) | Days from planting | Cat. | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| S1 | `planting_mix` | Mix manure and microbes in at planting | 0–29 | FEEDING | <ul><li>10 kg FYM in the pit.</li><li>Around the roots: arbuscular mycorrhiza 50 g, phosphate-solubilising bacteria 25 g and *Azospirillum* 50 g.</li></ul> | — | Feeds the roots and helps them take up phosphorus from the start | corrected: TNAU's *Trichoderma harzianum* 50 g removed. It is a biopesticide, and its papaya label is a different rate (Q6) | TNAU p.33 |
| S2 | `water_new_plant` | Water the new plant weekly, off the stem | 0–29 | WATERING | <ul><li>Soak well after planting, then water once a week.</li><li>Use a ring basin so water never touches the stem, and let no water stand.</li></ul> | — | The roots settle; wet stems get collar rot | OK | TNAU p.33; NHB pap005 (ring system) |
| S3–S13 | `feed_1` … `feed_11` | Give feed N: 50 g each of N, P and K | <ul><li>90–119</li><li>150–179</li><li>210–239</li><li>270–299</li><li>330–359</li><li>390–419</li><li>450–479</li><li>510–539</li><li>570–599</li><li>630–659</li><li>690–719</li></ul> | FEEDING | — | Urea 110 g + SSP 310 g + MOP 85 g (50 g each of N, P₂O₅, K₂O), placed as in rule 8. Wear gloves | Papaya flowers and fruits non-stop and needs small, regular feeds | OK. The end at month 24 is my reading (rule 6). NHB's table credits TNAU with 4 splits a year instead of 6 (pap006); TNAU's own text says bimonthly | TNAU p.33; NIPHM p.24 |
| S14 | `zinc_boron_1` | Spray zinc and boron on the leaves | 120–149 | FEEDING | — | Zinc sulphate 5 g + boric acid 1 g per litre (0.5% + 0.1%), sprayed on the leaves. It is a fertiliser, so there is no waiting period. Wear gloves | Better growth and fruit set | OK. TNAU's virus section says "4th and 7th" months; I used "4th and 8th" from the main text, which the TNAU expert page also gives | TNAU p.34; TNAU Agritech |
| S15 | `zinc_boron_2` | Spray zinc and boron again | 240–269 | FEEDING | — | as S14 | as S14 | OK | TNAU p.34 |
| S16 | `microbe_booster` | Add Azospirillum and phosphobacteria | 180–209 | FEEDING | 20 g each of *Azospirillum* and phosphobacteria, mixed into a handful of FYM around the plant | — | Tops up the soil microbes at six months | OK | TNAU p.33; NIPHM p.24 |

Calendar rows: none. TNAU gives no months for papaya care beyond planting: Jun–Sep, avoiding peak summer and peak rains.

**Phases:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `year_round` | Jan–Dec | Water standing in the basin or touching the stem | Mottled or curled leaves (virus), white cottony clusters (mealybug), rot at the stem base | TNAU pp.33–34, p.141 |

### 3K. COASTAL_HUMID (KAU)

**Planting-timed**

| # | Key(s) | Reminder | Days | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| K1 | `shade_new_plant` | Shade and water the new seedling | 0–29 | WATERING | Shade the seedling until it settles. Water in a ring basin, not on the stem, if no rain falls | — | Young seedlings scorch; wet stems rot | OK | KAU p.221–222 |
| K2–K13 | `feed_1` … `feed_12` | Give feed N: 40 g N, 40 g P, 80 g K | <ul><li>60–89</li><li>120–149</li><li>180–209</li><li>240–269</li><li>300–329</li><li>360–389</li><li>420–449</li><li>480–509</li><li>540–569</li><li>600–629</li><li>660–689</li><li>720–749</li></ul> | FEEDING | — | Urea 87 g + SSP 250 g + MOP 135 g (40 g N, 40 g P₂O₅, 80 g K₂O), placed as in rule 8. Wear gloves | Regular feeding, potash-heavy for fruit | corrected: KAU gives "bimonthly" with no start. I start at 2 months, one interval after planting (Q5) | KAU p.222 |

**Calendar**

| # | Key | Reminder | Window | Stages | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| K14 | `monsoon_manure` | Spread manure as the monsoon starts | Jun 1–30 | young, bearing | FEEDING | <ul><li>10–25 kg FYM or compost a year, in the basin around the plant.</li><li>Hand-dig and weed at the same time.</li></ul> | — | The yearly organic feed, given when rain wets it in | OK. KAU says "at the onset of southwest monsoon", and KAU's black pepper chapter gives that onset as June–July | KAU p.222 |
| K15 | `winter_digging` | Dig around the plant and pull weeds | Jan 1–Feb 28 | young, bearing | GENERAL | Hand-dig the basin lightly and pull the weeds | — | Papaya roots are shallow; weeds take their food | OK | KAU p.222 ("two hand diggings… beginning of the rainy season and… January–February") |
| K16 | `summer_water` | Water in a ring through the dry months | Jan 1–May 31 | young, bearing | WATERING | Water grown plants every 4–5 days in a ring basin, never on the stem | — | Dry soil turns flowers male and drops fruit | OK, with two sources combined: <ul><li>KAU: "irrigate in summer"; Kerala's summer is Jan–May (KAU p.106, coconut).</li><li>Frequency from NHB.</li></ul> | KAU p.222, p.106; NHB pap005 |

**Phases:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `summer_dry` | Jan–May | Letting the basin dry out; water on the stem | Mealybug | KAU p.106, p.222, p.332 |
| `monsoon` | Jun–Sep | Water standing around the trunk | Collar rot; virus-infected plants | KAU p.221–222 |
| `post_monsoon` | Oct–Dec | Water standing around the trunk | Collar rot; anthracnose on fruit | KAU p.222 |

### 3E. EAST_INDIA (Assam AU)

| # | Key(s) | Reminder | Days | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| E1–E10 | `feed_1` … `feed_10` | Give feed N of 10: 50 g each of N, P, K | <ul><li>0–29</li><li>60–89</li><li>120–149</li><li>180–209</li><li>240–269</li><li>300–329</li><li>360–389</li><li>420–449</li><li>480–509</li><li>540–569</li></ul> | FEEDING | — | Urea 110 g + SSP 310 g + MOP 85 g, placed as in rule 8. Wear gloves | Small, regular feeds for a plant that fruits all year | OK: 500 g each in "10 equal splits at 2-month intervals starting from planting" | Assam AU p.28 |

Calendar rows: none. Assam AU gives only planting (Apr–Jun) and nursery (Feb–Mar) months.

**Phases:** `year_round` (Jan–Dec). Avoid poor drainage; watch for mosaic, leaf curl, ringspot and mealybug (Assam AU pp.28–29).

### 3W. WEST_INDIA (JAU), drafted and kept pending (Q4)

| # | Key | Reminder | Days | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| W1 | `planting_mix` | Mix manure into the pit at planting | 0–29 | FEEDING | 12 kg vermicompost per plant. JAU: an organic papaya needs only this. Or 6 kg FYM, used with the three feeds W2–W4 | — | Organic papaya gave the better return in JAU's trial | OK | JAU items 11 and 14 |
| W2–W4 | `feed_1` … `feed_3` | Give feed N of 3: N, P and K | <ul><li>30–59</li><li>60–89</li><li>90–119</li></ul> | FEEDING | — | Each feed: urea 110 g + SSP 415 g + MOP 140 g (50 g N, 67 g P₂O₅, 83 g K₂O). Wear gloves | Feeds early growth before flowering | OK. JAU writes "200 g P, 250 g K"; I read these as P₂O₅ and K₂O (Q4) | JAU item 14 |
| W5–W6 | `zinc_boron_1`, `zinc_boron_2` | Spray zinc and boron on the leaves | <ul><li>30–59</li><li>90–119</li></ul> | FEEDING | — | Zinc sulphate 5 g + boric acid 1 g per litre. It is a fertiliser, so there is no waiting period. Wear gloves | Better yield | corrected: JAU's 24 g zinc sulphate + 10 g borax per litre (on an element basis) is about 5× the national dose. TNAU's 0.5% / 0.1% is used instead (Q4) | JAU item 15; TNAU p.34; NHB model report |

Phases: `year_round`, the same as East.

### 3N. NORTH_INDIA (PAU), only if Q1 = yes

| # | Key | Reminder | Window | Stages | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| N1 | `frost_cover` | Cover young papaya against frost | Nov 1–Feb 28 | young | PROTECTION | Cover the plant with clear plastic, sarkanda, a straw thatch or similar. Take it off when frost is over | Papaya is very sensitive to frost | OK. The window crosses New Year; the engine handles this (amla precedent) | PAU p.115 |
| N2 | `feed_feb` | Give the February manure and fertiliser | Feb 1–28 | young, bearing | FEEDING | 20 kg well-rotted FYM in the basin | Plus 1.25 kg of a mixture of urea, SSP and MOP at 1 : 2 : ⅓ (about urea 375 g, SSP 750 g, MOP 125 g), placed as in rule 8. Wear gloves | Feeds the spring growth and fruit | OK. Reading: 1.25 kg of mixture and 20 kg FYM at **each** feed (Q2) | PAU p.117 |
| N3 | `feed_aug` | Give the August manure and fertiliser | Aug 1–31 | young, bearing | FEEDING | as N2 | as N2 | Feeds the monsoon flush and fruit | OK (as N2) | PAU p.117 |

Month check: Feb has 2 rows (N1, N2), Nov–Jan 1, Aug 1.

**Phases:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `frost_season` | Nov–Feb | Leaving young plants uncovered; wet soil | Frost damage | PAU p.115 |
| `dry_heat` | Apr–Jun | Letting the soil dry out (stress turns flowers male) | Whitefly, which is active in dry weather and spreads leaf curl | PAU p.117; NHB pap005 |
| `monsoon` | Jul–Sep | Irrigation water touching the stem; standing water | Collar and stem rot | PAU p.118 |
| `autumn` | Oct | Transplanting after Oct 15 | Collar rot in wet soil | PAU p.117 (planting Sep 1–Oct 15) |

March belongs to no phase: PAU gives no March season for papaya.

The season months for Punjab come from PAU's citrus chapter (hot months Apr–Jun p.23; monsoon Jul–Sep p.25), as in `citrus.md`.

### 3C. Plant page only (conditional, never reminders)

| # | Only if you see… | What to do | Regions | Check | Source |
|---|---|---|---|---|---|
| C1 | **Flowers open on seed-grown plants** | <ul><li>Hermaphrodite and gynodioecious varieties need no male: Red Lady, Pusa Delicious, CO 3, CO 7, Coorg Honey Dew, Surya.</li><li>PAU's Honey Dew ("Madhu Bindu") does have a few males, so check it.</li><li>In CO 3 and CO 7, keep the hermaphrodite plant in each pit and remove the females (TNAU).</li><li>For dioecious plants: keep one plant per pit and pull out extra males, keeping **1 male for every 10 females** (**1 per 20** in SOUTH_DECCAN, per TNAU), spread around the garden.</li><li>With only a few plants, keep one male.</li></ul> | all | corrected: the ratio is set per region. **Ratio chosen:** 1:10 (PAU about 10%, NHB 10:1, KAU 1:10) everywhere except SOUTH, which keeps TNAU's 1:20. Assam AU says 2:10, outside the owner's approved range (Q3). "Keep one male" for a few plants is my scale-down (Q7) | PAU p.117; NHB pap004; KAU p.221; TNAU p.33; Assam AU p.28 |
| C2 | **Mottled, blistered, curled or shrunken top leaves, or ring spots on fruit** (mosaic, ringspot, leaf curl) | <ul><li>Uproot and burn the plant at once.</li><li>Don't grow tomato, chilli, tobacco or cucurbits next to papaya.</li><li>Knock aphids off young plants with a strong jet of water.</li></ul> | all | OK. No chemical: dimethoate, imidacloprid, thiamethoxam, phosphamidon and carbofuran have no papaya claim | PAU p.118; KAU p.222; Assam AU p.29; NIPHM pp.25–26; NHB pap002 |
| C3 | **Wet, dark rot at the stem base, with yellowing leaves** (collar or stem rot) | <ul><li>Stop water touching the stem (ring basin) and drain the basin.</li><li>Mild: scrape the rotten patch and cover it with Bordeaux paste. Recipe: 100 g copper sulphate in 1 L water, 100 g lime in another 1 L, then mix. Wear gloves.</li><li>Rotting right round the stem: uproot the plant (PAU).</li></ul> | all | corrected: TNAU's and KAU's 1% Bordeaux soil drench and Assam AU's collar spray are outside the owner's Bordeaux exception (Q8). Metalaxyl, chlorothalonil, copper oxychloride and mancozeb removed (no papaya claim) | PAU p.116, p.118; KAU p.222; NHB pap002 (paste recipe); TNAU p.34 |
| C4 | **White cottony clusters under leaves or on fruit** (papaya mealybug) | <ul><li>Pick off and burn infested leaves.</li><li>Pull up hibiscus and weeds nearby (all regions; NIPHM).</li><li>SOUTH, COASTAL and EAST only: tie a sticky band or polythene sheet round the stem, destroy ant nests, and ask the KVK or the agriculture office for the parasitoid *Acerophagus papayae*. KAU releases 25–50 per plant.</li></ul> | all (band and parasitoid: SOUTH, COASTAL, EAST) | OK. No chemical: profenofos, chlorpyriphos, malathion, thiamethoxam and imidacloprid (Assam AU) have no papaya claim. Neem oil and NSKE removed (no claim; citrus precedent) | KAU p.332; TNAU p.141; Assam AU p.29; NIPHM p.24 |
| C5 | **White powder on leaves** (powdery mildew) | <ul><li>Remove badly affected leaves and keep the plants spaced.</li><li>Chemical: thiophanate-methyl 70 WP, 0.7–0.95 g per litre. Wear gloves; never within 8 days of picking.</li></ul> | all | OK. The label's waiting period is 4–8 days; I took 8. NHB's sulphur and Calixin removed (no papaya claim) | NIPHM p.25; MUP-F p.40 (715 g in 750–1000 L); NHB pap002 |
| C6 | **Stunted, yellowing plants with knotted roots** (nematodes) | <ul><li>Neem cake 250 g per plant, worked into the basin.</li><li>Or 2 kg of FYM enriched with *Trichoderma harzianum* 1% WP per plant, now and every 3 months for a year (label).</li></ul> | SOUTH | OK, with an open point: the enrichment ratio is in Q6. TNAU's *Pseudomonas* 4 g and carbofuran removed (no papaya claim) | TNAU p.34; MUP-BI p.11 |
| C7 | **Sunken dark spots on fruit** (anthracnose) | <ul><li>Pick off and destroy spotted fruit, and avoid bruising.</li><li>Keep the basin drained.</li><li>Bag fruit in paper about 15 days before picking.</li></ul> | NORTH, COASTAL | corrected: KAU's 1% Bordeaux spray removed (fruit on the tree); carbendazim and copper oxychloride removed (no claim) | PAU p.118; KAU p.222; NIPHM p.25 |
| C8 | **Small, pale or misshapen new leaves** | Zinc sulphate 5 g + boric acid 1 g per litre on the leaves. It is a fertiliser, so there is no waiting period. Wear gloves | NORTH, COASTAL, EAST | OK | NIPHM p.26; NHB model report |
| C9 | **A yellow streak on a full-size fruit, or watery latex** | Pick by twisting, in the morning. Collect fallen and over-ripe fruit, which draws fruit fly | all | OK | TNAU p.34; KAU p.222; NHB pap003, pap007 |

**Removed lines with no replacement:**
- **Mites:** the only actions given were NSKE (no claim) and NHB's phosphamidon or methyl parathion, both banned.
- **Whitefly sprays:** JAU's acetamiprid and thiamethoxam have no papaya claim.

### 3M. Month check (cap: 3 reminders a month)

| Region | Busiest point | Count | Over 3? |
|---|---|---|---|
| SOUTH | Days 0–29 (S1, S2) | 2 | No. The zinc windows (120, 240) never meet a feed window |
| COASTAL | Jan–Feb: K15 + K16 + a feed | 3 | No, but a seedling planted in Jan (+K1) makes 4. The engine then drops K15 (GENERAL) first |
| EAST | One feed at a time | 1 | No |
| WEST | Days 30–59 and 90–119: a feed + zinc | 2 | No |
| NORTH | Feb (N1, N2) | 2 | No |

## 4. Label claims checked (MUP to 30.09.2026), papaya only

| Product | Claim | Dose | Waiting days | Used? |
|---|---|---|---|---|
| Thiophanate-methyl 70 WP (MUP-F p.40) | powdery mildew | 715 g in 750–1000 L per ha, about 0.7–0.95 g/L (NIPHM: 0.1%) | 4–8, so 8 is used | yes (C5) |
| *Trichoderma harzianum* 1.0% WP, IIHR-TH-2 (MUP-BI p.11; trade name "Nemastin" in the row) | root-knot and reniform nematodes | 2 kg enriched FYM per plant at planting and every 3 months for a year | — (bio) | yes (C6), ratio in Q6 |
| No papaya entry at all | MUP-I (insecticides), MUP-PGR, MUP bio-fungicides | | | — |

## 5. What the check changed
1. **Chemicals dropped (no CIB&RC papaya claim):**
   - dimethoate, methyl demeton, phosphamidon, methyl parathion, Nuvacron (monocrotophos);
   - carbofuran, imidacloprid, thiamethoxam, acetamiprid, profenofos, chlorpyriphos, malathion, deltamethrin bait, fluensulfone;
   - metalaxyl, chlorothalonil, copper oxychloride, mancozeb, carbendazim, Calixin (tridemorph), wettable sulphur;
   - methoxyethyl mercuric chloride and phenyl mercuric acetate (banned);
   - GA₃ fruit dip (no PGR claim);
   - nursery-only treatments: captan, formaldehyde;
   - diuron and glyphosate weed killers.
2. **Neem oil, NSKE, *Pseudomonas* and tobacco decoction removed:** they have no papaya claim, following the citrus precedent. Mites are left without an item.
3. **TNAU's *Trichoderma* 50 g removed from the planting mix.** It is a biopesticide, so the label rate applies (C6, Q6).
4. **JAU's zinc and borax dose** replaced by the national 0.5% zinc sulphate + 0.1% boric acid.
5. **Bordeaux** kept as a paste on scraped collar lesions only. Drench, collar-spray and fruit-spray uses removed (Q8).
6. **Male ratio** set per region: 1:10, or TNAU's 1:20 in SOUTH. Assam AU's 2:10 goes to the owner.
7. **KAU feeds** given a start day (60), which KAU doesn't state.
8. **Feeds capped at about 24 months** for TNAU and KAU (rule 6).
9. **Drainage and monsoon rows:** no dated reminder in SOUTH (two monsoon regimes) or EAST (no months in the source). They stay on the plant page and in phases.
10. **Aphids:** no calendar reminder, because no source gives papaya aphid months. Aphids are covered by C2.
11. **Pending:** CENTRAL, and WEST until Q4.

**Row tally**

| Group | Rows | OK | Corrected |
|---|---|---|---|
| SOUTH planting-timed (S1–S16) | 16 | 15 | 1 (S1) |
| COASTAL planting-timed + calendar (K1–K16) | 16 | 4 | 12 (K2–K13, start day) |
| EAST planting-timed (E1–E10) | 10 | 10 | — |
| WEST planting-timed (W1–W6, pending) | 6 | 4 | 2 (W5–W6) |
| NORTH calendar (N1–N3, proposed) | 3 | 3 | — |
| Conditionals (C1–C9) | 9 | 6 | 3 (C1, C3, C7) |
| **Total** | **60** | **42** | **18** |

Removed: about 30 chemical lines (item 1) plus the mite and whitefly items. Phases: 10 rows, all sourced.

## Source links
- TNAU Crop Production Guide, Horticulture 2020: https://agritech.tnau.ac.in/pdf/HORTICULTURE.pdf (papaya pp.33–34; mealybug p.141)
- TNAU Agritech papaya page: https://agritech.tnau.ac.in/horticulture/horti_fruits_papaya.html
- KAU PoP Crops 2016: https://intranet.kau.in/sites/default/files/documents/pop2016.pdf (papaya pp.221–222; mealybug p.332; coconut p.106)
- Assam AU PoP Horticultural Crops 2023: https://kvkkokrajhar.aau.ac.in/uploads/package_of_practices/pop_20260809_035324_680506072ef2c30b.pdf (papaya pp.27–29)
- JAU fruit science recommendations: https://www.jau.in/storage/document/dynamic_document//fruit_science_recommendations_20260620_1720.pdf (PDF p.2)
- PAU Package of Practices for Cultivation of Fruits: https://www.pau.edu/content/ccil/pf/pp_fruits.pdf (papaya pp.115–118)
- NHB papaya sheets: https://nhb.gov.in/pdf/fruits/papaya/pap002.pdf (diseases), pap003 (harvest), pap004 (thinning), pap005 (irrigation), pap006 (manuring), pap007 (pests)
- NHB papaya model project: https://nhb.gov.in/model-project-reports/Horticulture%20Crops/Papaya/Papaya1.htm
- NIPHM AESA IPM Papaya: https://niphm.gov.in/IPMPackages/Papaya.pdf (pp.24–26)
- MUP (CIB&RC): https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides
  - fungicides: https://ppqs.gov.in/sites/default/files/Fungicide%20MUP%20%20as%20on%2030.09.2026.pdf (p.40)
  - bio-insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28bio%20insecticide%29%2030.09.2026.pdf (p.11)
  - insecticides (no papaya entry): https://ppqs.gov.in/sites/default/files/MUP%20%28insecticide%29%20%2030.09.2026.pdf
- Not reached: https://www.iihr.res.in/papaya (404); https://kvkudalguri.aau.ac.in/pdf/PoP/PoP_(Horticulture)_2021.pdf (404); https://www.kiran.nic.in/pdf/Agri-Kaleidoscope/Horticulture-resources/PAPAYA.pdf (host not found)

## 6. Open questions for the owner
- **Q1. Add `north_india` to papaya's `grownIn`, with PAU as its source?** Recommendation: **yes.**
  - PAU calls papaya "ideal for kitchen gardens" in Punjab, and NHB lists Uttar Pradesh among the main papaya states.
  - The rows are calendar-only: frost cover, plus feeds in Feb and Aug.
  - As for citrus, NORTH = Punjab.
- **Q2. PAU feed reading:** 1.25 kg of mixture **and** 20 kg FYM at each of the two feeds? The sentence can also be read as 20 kg FYM a year. Recommendation: accept "each feed", which is the literal reading.
- **Q3. EAST from Assam AU:** does Assam stand for Bihar, West Bengal, Odisha and Jharkhand? Assam AU also keeps **2 males per 10 females**, against the 1:10 used here. Recommendation:
  - ship EAST, because the feed amount matches TNAU and NHB;
  - keep 1:10 (NHB);
  - re-check when a BAU Sabour or BCKV source is found.
- **Q4. WEST from JAU:** a single Saurashtra research recommendation, with feeds only to month 4. The P and K amounts are read as P₂O₅ and K₂O, and the zinc dose is replaced. Recommendation: **keep WEST pending** until an MPKV or NAU package is reached.
- **Q5. KAU feed start:** KAU says "bimonthly" with no start. I start at day 60. Recommendation: accept.
- **Q6. *Trichoderma harzianum* enrichment** (MUP-BI papaya row: "2 kg enriched FYM per plant"):
  - The ratio of product to FYM comes from the tuberose row (2 kg in 2 t FYM, i.e. 1 g per kg FYM).
  - Should it also replace TNAU's 50 g at planting as a routine step?
  - Recommendation: conditional only (C6), with 1 g per kg FYM stated.
- **Q7. Home-garden scale-down:** "with only a few plants, keep one male" (C1). Recommendation: accept, because otherwise a 2–3 plant dioecious garden sets no fruit.
- **Q8. Bordeaux beyond paste:**
  - TNAU and KAU drench the soil with 1% Bordeaux; Assam AU sprays the collar.
  - Neither use touches fruit, but both are outside the 2026-11-12 exception (paste on cuts; spray only with no fruit).
  - Recommendation: allow a collar drench, 1% (10 g copper sulphate + 10 g lime per litre, 2–3 L per plant, the drench volume in NHB pap002), for collar rot only.
- **Q9. Papayas kept past the last feed** (month 24, or day 540 in EAST) get no feed reminders. Add a calendar fallback (e.g. KAU's monsoon manure), or accept? Recommendation: accept. All three guides say to replant after 2.5–3 years.

Status: **approved by the owner on 2026-11-23 with every recommendation** (review doc "Papaya care — owner review"). Transcribed into `backend/src/modules/catalogue/seed/tree-care/papaya.seed.ts`. Transcription notes: Feb windows end on the 29th (the house leap-day rule from citrus); the extra-males check is shown from day 90 to day 239 for a tree with a planting date (flowering at 3–7 months), always for one without.
