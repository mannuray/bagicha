# Papaya care, WEST_INDIA and CENTRAL_INDIA: draft + source check (2026-11-24)

This follows the conventions in `papaya.md`:
- Feeds are counted from the planting date (`FROM_PLANTING`). "At / from the Nth month" opens at day 30×N and runs for 30 days.
- Each feed is its own item, with the amount per plant per feed in the text and no age-scaled `dose`.
- Calendar rows are added only where a source gives the month.
- The conditionals C1–C9 already apply to every region.
- Chemicals are used only if they have a CIB&RC papaya label claim (§4 of `papaya.md`).
- Nutrients are converted to products with the same factors: urea = N ÷ 0.46, SSP = P₂O₅ ÷ 0.16, MOP = K₂O ÷ 0.60.

**Region map** (from `backend/src/modules/regions/domain/districts.ts`):
- WEST_INDIA = all of Gujarat, Rajasthan, Dadra and Nagar Haveli and Daman and Diu, and Maharashtra except Vidarbha and Konkan. Konkan is Palghar, Raigad, Ratnagiri, Sindhudurg and Thane, which map to COASTAL_HUMID.
- CENTRAL_INDIA = Madhya Pradesh, Chhattisgarh, and Maharashtra's Vidarbha districts (Akola, Amravati, Nagpur and others). So **Dr PDKV Akola counts as a CENTRAL source.**

## Sources (read)

- **NAU 2026** = Navsari Agricultural University, Fruit Research Station Gandevi, *Technology Developed 2026-27: Technologies of ICAR-AICRP on Fruits*. The papaya section is on PDF pp.8–9.
  - Crop Production item 2 (2026): "Apply 10 kg FYM at the time of planting and 75% RDF (150:150:187.5 N:P2O5:K2O g/plant) in four equal splits at 2nd, 4th, 6th and 8th month after planting and Arka Microbial Consortium (11 g/plant) along with 1 kg FYM in two equal splits (at the time of planting and 6 month after planting)."
  - This is the main WEST source.
  - https://nau.in/assets/uploads/3b6a5-8.-technology-developed-2026.pdf
- **NAU 2016-20** = NAU, *Research Recommendations 2016-2020*.
  - Item 17.4.1.20 is on printed p.45 (PDF p.57): Red Lady, 60% RDF "120-120-150 NPK g/plant" at 2, 4, 6 and 8 months after planting, 30 / 30 / 37.5 g per split, with liquid biofertilisers.
  - Item 14.4.1.13 is on p.13: an organic NADEP and Jeevamrut package.
  - https://nau.in/assets/uploads/e3055-18.10.2021_res_recommendation.pdf
- **NAU Ach** = NAU, *Research Recommendations* summary for fruit crops (2022), PDF pp.3, 4 and 7. It has three items:
  - 2011 (p.3): Madhubindu fertigation, "80% recommended dose of N and K2O (160 g N and 200 g K2O/plant)", 10 kg FYM per pit, P₂O₅ 100 g at 1½ and 3 months. Drip run times are given by month.
  - 2014 (p.4): a micronutrient spray at 60, 90 and 120 days after transplanting.
  - 2021 (p.7): the same Red Lady item as NAU 2016-20, but its table prints K as 30. The official compilation gives 37.5, which is what I used.
  - https://nau.in/assets/uploads/e4d7c-5.-achivements.pdf
- **PFDC** = NAU Precision Farming Development Centre, *Recommendations* (2018-19).
  - p.29, item 4: JAU 1998–2000, Madhubindu drip. "3 hrs daily during October to February and 5 hrs from March onward."
  - p.43, item 13: NAU 2009–10, Taiwan 786 drip. "Winter: 20–30 lit/plant, Summer: 30–50 lit/plant" on alternate days. The fertigation is 200:200:250 g per plant.
  - https://nau.in/assets/uploads/76c15-pfdc_recommendation.pdf
- **JAU** = Junagadh AU, horticulture recommendations, PDF p.3, papaya items 1–6. These are the same items as JAU in `papaya.md` and are used here only as corroboration.
  - https://www.jau.in/storage/document/dynamic_document//recommendationshorticulture_20260204_1136.pdf
- **MUP-F** = CIB&RC fungicide Major Uses list to 30.09.2026.
  - Its only papaya row is thiophanate-methyl for powdery mildew. That is p.39 by my count; `papaya.md` cites p.40.
  - Dimethomorph, mancozeb, hexaconazole, zineb and difenoconazole have no papaya row.
  - MUP-I has no papaya entry at all (`papaya.md` §4).

## Not reached, or reached with nothing usable

**WEST**
- **MPKV Rahuri:**
  - The fruit-crop list *Recommendation released in last 10 years* was read and has no papaya item: https://mpkv.ac.in/Uploads/Research/13.%20Fruit%20crops_20200110060006.pdf
  - The 2025 Marathi recommendations were read. The font extracts partly garbled, but they contain no papaya or fruit-crop section that I could find: https://mpkv.ac.in/Uploads/Research/2025-Marathi_20250808051343.pdf
  - A Rahuri drip trial (RDF 250:250:500 g, epubs JISCAR 92292) is research, not a recommendation.
- **VNMKV Parbhani:** nothing found.
- **Dr BSKKV Dapoli:** only a fertigation trial, which is research. Dapoli is in Konkan, so it would count for COASTAL anyway.
- **AAU Anand:** the papaya research page lists aims only, with no recommendation (https://www.aau.in/college-menu/23433/252).
- **SDAU:** nothing found.
- **Rajasthan:** no state department, SKRAU or SKNAU papaya schedule found. An ICAR-CAZRI KVK (Pali) front-line demonstration came up as a search snippet only.
- **NAU 2022 research booklet:** only its title page came up.

**CENTRAL**
- **JNKVV Jabalpur:** no package found. A JNKVV Rewa paper (epubs AAR 168780) is research.
- **RVSKVV Gwalior:** the Khargone KVK article in *Indian Horticulture* 58(2) has an abstract with no doses, and its PDF returned 404 (https://epubs.icar.org.in/index.php/IndHort/article/download/90378/36843).
- **IGKV Raipur:**
  - A net-house INM trial (phytojournal 2020) uses an RDF of 200:250:250 g, but it is research.
  - A 2022 thesis on organic manures came up as front matter only.
- **MP horticulture department (mphorticulture.gov.in) and the Chhattisgarh agriportal:** no papaya page surfaced. The news about Raipur as the papaya district in the one-district-one-product scheme gives no care advice.
- **Dr PDKV Akola:** the Recommendation circulars for 2023 and 2025 were read. Papaya appears only as an ingredient of Dashparni extract (https://www.pdkv.ac.in/Circulars/Recom-2023English.pdf, https://www.pdkv.ac.in/Circulars/Recom-2025English.pdf).
- **Chitrakoot (MGCGV, Satna) trial:** RDF 250:250:250, research and not a state university recommendation.

**National**
- The IIHR technology page (Coorg Honey Dew, 250:250:500 g a year in 6 bimonthly splits) came up as a search snippet only. It is national, and Karnataka-derived.
- NHB pap006 is already used in `papaya.md`.
- Neither is a regional source, so neither is used for CENTRAL.

---

## 1. Regions

| Region | Source | Status | Notes |
|---|---|---|---|
| WEST_INDIA | NAU 2026 (South Gujarat, AICRP on Fruits) | **drafted; recommend ship (QW1)** | <ul><li>Gujarat only. Maharashtra and Rajasthan are not checked, as with EAST = Assam.</li><li>Replaces the JAU draft W1–W6 in `papaya.md` §3W (QW2).</li><li>Feeds stop at month 8 (QW3).</li></ul> |
| CENTRAL_INDIA | — | **keep PENDING (QC1)** | No JNKVV, RVSKVV, IGKV, PDKV or state-department papaya schedule reached. Keeps the season pack. |

## 2. Rules applied

1. "At 2nd, 4th, 6th and 8th month after planting" means days 60–89, 120–149, 180–209 and 240–269, by the "N months after planting" rule. NAU 2016-20's table writes "Two months after planting", which confirms this reading.
2. "At the time of planting" is days 0–29, and "6 month after planting" is days 180–209.
3. **Units.** NAU 2026 states N:P₂O₅:K₂O outright. The full dose (100% RDF) of 200:200:250 g per plant is implied by three sources:
   - NAU 2026 (75% = 150:150:187.5);
   - NAU 2016-20 (60% = 120:120:150);
   - NAU Ach 2011 (80% of N and K₂O = 160 and 200).

   PFDC 2009-10 also gives 200:200:250. This also settles the old Q4 reading of JAU's "200 g P, 250 g K" as P₂O₅ and K₂O.
4. **Per feed:** 37.5 g N, 37.5 g P₂O₅ and 46.9 g K₂O. That is urea 82 g, SSP 234 g and MOP 78 g, rounded to **urea 80 g + SSP 235 g + MOP 80 g**.
5. Feeds go in a ring 10 cm deep, 15–20 cm from the stem, then covered and watered (`papaya.md` rule 8, NHB pap006). Wear gloves.
6. Stages are `[YOUNG, BEARING]` on every planting-timed row (`papaya.md` rule 4).
7. **Arka Microbial Consortium** (ICAR-IIHR) is a biofertiliser of N-fixing, P- and Zn-solubilising and growth-promoting bacteria. It is not a pesticide, so no CIB&RC claim is needed. This is the same treatment as TNAU's microbes in S1 and S16.

## 3W. WEST_INDIA (NAU 2026)

**Planting-timed**

| # | Key(s) | Reminder (≤60) | Days from planting | Cat. | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|
| W1 | `planting_mix` | Mix manure and microbes in at planting | 0–29 | FEEDING | <ul><li>10 kg FYM in the pit.</li><li>Also mix 5.5 g Arka Microbial Consortium into 0.5 kg FYM and put it around the roots (the first of two halves).</li><li>The KVK or IIHR sells the consortium.</li></ul> | — | Feeds the roots, and the microbes make the smaller fertiliser feeds go further | OK. The 5.5 g / 0.5 kg split is my reading of "11 g/plant along with 1 kg FYM in two equal splits" (QW4) | NAU 2026 p.8, item 2 |
| W2–W5 | `feed_1` … `feed_4` | Give feed N of 4: N, P and K | <ul><li>60–89</li><li>120–149</li><li>180–209</li><li>240–269</li></ul> | FEEDING | — | Each feed: urea 80 g + SSP 235 g + MOP 80 g (37.5 g N, 37.5 g P₂O₅, 47 g K₂O), placed as in rule 5. Wear gloves | Small feeds through growth and the first flowering | OK. The conversion is in rule 4. The 75% dose is NAU's figure **with** the consortium, so W1, W6 and W2–W5 ship together (QW4). Feeds end at month 8 (QW3) | NAU 2026 p.8, item 2; NAU 2016-20 p.45 (same months) |
| W6 | `microbe_booster` | Add the second half of the microbe mix | 180–209 | FEEDING | 5.5 g Arka Microbial Consortium mixed into 0.5 kg FYM, worked into the basin | — | Tops up the soil microbes at six months | OK (split reading as W1, QW4) | NAU 2026 p.8, item 2 |

**Calendar**

| # | Key | Reminder | Window | Stages | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| W7 | `summer_water` | Water more often as the heat starts | Mar 1–May 31 | young, bearing | WATERING | <ul><li>From March, water grown plants every other day, about 30–50 L per plant, in a ring basin and never on the stem.</li><li>Keep this up until the monsoon rains start.</li></ul> | — | Dry soil in the heat turns flowers male and drops fruit | OK, with two readings of mine (QW5): <ul><li>All three Gujarat sources step watering up "from March": NAU Ach 2011, JAU 1998 (5 h vs 3 h a day), PFDC 2009-10 (summer 30–50 L vs winter 20–30 L).</li><li>Their figures are for drip, given here for a ring basin.</li><li>The May 31 end is mine; the sources give no end and say "onward".</li></ul> | NAU Ach p.3; PFDC p.29, p.43 |

**Phases**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `year_round` | Jan–Dec | Water touching the stem or standing in the basin; letting the soil dry out from March | Mottled, curled leaves or ring spots (ringspot virus, NAU's "key constraint"); whitefly | NAU 2026 pp.8–9; JAU item 6 (whitefly); PFDC p.43 |

I made no split season phases: the sources give drip run-times by month but no monsoon months for papaya.

**Plant page (not reminders), from NAU:**
- Raise seedlings under 40–60 mesh nylon net.
- Sow two rows of maize as a border 15 days before planting. That is a negative day, so it goes on the plant page.
- For the net-house option: gynodioecious varieties under 40-mesh insect net (NAU 2026 p.8, item 1; p.9, item 1).

**Month check (cap 3)**

| Point | Rows | Count |
|---|---|---|
| Days 0–29 | W1 (+ W7 if planted Mar–May) | 2 |
| Days 180–209 | W4 + W6 (+ W7 if day 180 falls Mar–May) | 3, at the cap. Merging W6 into W4's text would make it 2 (owner call, not needed) |
| Other feed windows | one feed (+ W7) | 2 |

**Conditionals:** C1, C2, C3, C5 and C9 already cover WEST as "all", and C4 covers it except for the band and parasitoid. Adding WEST to C8 is QW6.

## 3C. CENTRAL_INDIA

No rows. No regional source supports any feed, calendar or phase row (see Not reached). **Recommend keeping CENTRAL in `pendingRegions`.**

## 4. What the check changed

1. **WEST's base changed from JAU (2015) to NAU 2026.** NAU 2026 is newer and the AICRP centre's current recommendation. It states oxides outright and runs feeds to month 8 instead of month 4. JAU W1–W6 are superseded and kept as corroboration of the same full dose (QW2).
2. **NAU 2016-20 / Ach 2021 (60% RDF + liquid Azotobacter, PSB and KMB) not used.** NAU 2026's 75% + consortium replaces it on the same months. The Ach table's K = 30 is a typo; the compilation says 37.5.
3. **Chemicals and sprays removed (no CIB&RC papaya claim):**
   - from NAU 2026 p.9: acephate 75 SP, dimethomorph 50 WP + mancozeb 75 WP drench, hexaconazole 5 EC + zineb 75 WP, difenoconazole 25 EC, and captan seed treatment (nursery);
   - neem oil 1–2% and the sticker sprays;
   - from NAU 2016-20 p.13: cow urine 2%, neem extract, and the *Trichoderma* + *Pseudomonas* drench (not the labelled nematode use).
4. **NAU 2026's foliar spray removed:** urea 10 g + zinc sulphate 15 g + "boron" 10 g per litre. That is about 3× the national zinc sulphate dose (0.5%) and 10× the boric acid dose (0.1%).
5. **Drip-only packages not used as reminders:** Ach 2011 and PFDC fertigation, and system specs. Only their "water more from March" signal is used, in W7.
6. **NAU 2016-20's organic NADEP, Jeevamrut and Amritpani package not used** (a farm system with the alternate-row banana layout).
7. **NAU 2014's micronutrient spray not adopted** (QW6). Its dose (zinc sulphate 0.2 g/L, borax 0.03 g/L, plus calcium nitrate 1 g/L and ferrous sulphate 0.2 g/L at 60, 90 and 120 days) is about 25× weaker in zinc than TNAU's, and 0.03 g per litre can't be measured at home.
8. **CENTRAL:** nothing drafted.

**Row tally**

| Group | Rows | OK | Corrected | Removed lines |
|---|---|---|---|---|
| WEST planting-timed (W1–W6) | 6 | 6 (two with a reading, QW4) | — | — |
| WEST calendar (W7) | 1 | 1 (with readings, QW5) | — | — |
| WEST phases | 1 | 1 | — | — |
| NAU / JAU lines not used | — | — | — | about 14 (items 2–7) |
| CENTRAL | 0 | — | — | — |

## 5. Open questions for the owner

- **QW1. Ship WEST on NAU 2026 for all of WEST?** That means South Gujarat standing for the rest of Gujarat, Rajasthan, and Maharashtra outside Vidarbha and Konkan.
  - **Recommendation: yes.** It matches the precedents of SOUTH = Tamil Nadu and EAST = Assam.
  - The old Q4 condition ("until an MPKV or NAU package is reached") is now met.
  - Two Gujarat universities (NAU and JAU) agree on the full dose of 200:200:250.
  - Re-check if an MPKV or Rajasthan package appears.
- **QW2. Replace the JAU draft (`papaya.md` §3W, W1–W6) with these rows?** Recommendation: **yes.** Don't mix JAU's month-3 feed with NAU's schedule; no source gives the combination.
- **QW3. Feeds stop at month 8 (day 269).** Recommendation: **accept**, the same as the approved Q9 (no feed reminders after the last sourced feed). Add no extra feeds that no source gives.
- **QW4. Arka Microbial Consortium.**
  - "11 g/plant along with 1 kg FYM in two equal splits" is read as 5.5 g + 0.5 kg FYM each time (literal). The other reading is 11 g each time.
  - NAU's 75% dose depends on the consortium.
  - Recommendation: **ship W1, W6 and W2–W5 together** with the literal reading, and name the product with "ask your KVK". If the owner judges it unobtainable, keep WEST pending instead: don't raise the feed to 100% on my own.
- **QW5. W7 summer watering:** Mar 1–May 31 with "until the rains" in the text, and the drip figure of 30–50 L every other day given for a ring basin. Recommendation: **accept.**
- **QW6. Micronutrients in WEST.** Recommendation: no routine spray (NAU 2014's dose is impractical, and NAU 2026's foliar mix is far too strong). **Add WEST to conditional C8** (zinc sulphate 5 g + boric acid 1 g per litre if new leaves are small or pale; national NIPHM/NHB source).
- **QC1. CENTRAL_INDIA.** No regional source was reached after searching JNKVV, RVSKVV, IGKV, Dr PDKV, the MP and Chhattisgarh horticulture departments and KVKs, in English and Hindi. Recommendation: **keep pending** with the season pack. Don't borrow NAU, NHB or IIHR. Re-search when a JNKVV or IGKV package of practices is published online.

Status: **WEST_INDIA approved by the owner on 2026-11-24 with every recommendation** and transcribed into `papaya.seed.ts` (with Hindi); CENTRAL_INDIA kept pending.
