# Pomegranate care: draft + source check (2026-11-23, approved)

The owner decided on 2026-11-23 that there is **no bahar choice**. A home gardener lets the tree flower naturally, season after season. This draft therefore has:
- no bahar steps: no withholding water, no defoliation, no ethrel;
- dated reminders (`CALENDAR`) only for steps the regional sources tie to the calendar;
- everything the gardener has to see first as `conditional` (plant page, never a reminder).

All three sources that describe an unregulated tree say it **flowers continuously and bears small crops at different times of the year** (NHB pom005; TNAU p.36; CIAH p.8). So no source gives a natural-tree calendar for fruit set, bagging or cracking. Those steps are conditional everywhere.

Kinds: none. The catalogue has the plain entry (NORTH, WEST), Ganesh (WEST), Kandhari (NORTH), and Bhagwa and Super Bhagwa (WEST, SOUTH_DECCAN). `grownIn` = NORTH_INDIA, WEST_INDIA, SOUTH_DECCAN.

Sources (full links at the end):
- **PAU** = Package of Practices for Cultivation of Fruits (2021). Pomegranate is on printed pp.119–121 (PDF pp.127–129). Bordeaux recipes are on pp.10–11; the fruit-garden frost list is on pp.138–139. Printed pages.
- **TNAU** = Crop Production Guide, Horticulture Crops 2020 (Directorate of Horticulture TN with TNAU). Pomegranate is on printed pp.36–38 (PDF pp.49–51). The "Season of flowering and fruiting" table is on p.343. Printed pages.
- **TNAU web** = TNAU Agritech pomegranate page (one page; backing only).
- **NRC 146** = ICAR-NRC Pomegranate, *IDIPM Schedule for Pomegranate Cultivation* (Sept 2023). PDF pages. Wayback copy (the NRC host does not resolve).
- **NRC 89** = ICAR-NRC Pomegranate, *Six Steps to Manage Bacterial Blight*. PDF pages. Wayback copy.
- **NRC 117** = ICAR-NRC Pomegranate, *Bimonthly advisory for bearing orchards, June–July 2022* (wilt section). PDF pages. Wayback copy.
- **CIAH** = ICAR-CIAH Bikaner, *Production Technology of Pomegranate in Arid Region*, Tech. Bull. 65 (2018). Printed pages (PDF = printed + 7). Bikaner is in Rajasthan, which the app maps to WEST_INDIA.
- **MPKV** = MPKV Rahuri, *Fruit crops: recommendations released in last 10 years* (2 pages, items 1–10 pomegranate).
- **NHB** = National Horticulture Board pomegranate sheets pom002–pom013, one page each. pom007's dose table is credited to the Dept. of Agriculture, Govt. of Maharashtra.
- **NIPHM** = AESA based IPM package, Pomegranate (NIPHM/DPPQS). PDF pages.
- **HP Shiva** = HPSHIVA *Package of Practices: Pomegranate*, by Dr YSP UHF Neri. Backing only: Himachal is the HILLS region, not NORTH_INDIA.
- **MUP** = CIB&RC Major Uses of Pesticides to 30.09.2026. MUP-I is insecticides, MUP-F fungicides, MUP-PGR plant growth regulators. PDF pages. The bio-insecticide and bio-fungicide lists have no pomegranate entry.

**Not reached:**
- **ICAR-NRC Pomegranate, Solapur.** `nrcpomegranate.icar.gov.in` and `krishi.icar.gov.in` do not resolve (NXDOMAIN) from here. Advisories 146, 89 and 117 were read from Wayback Machine copies. NRC's own package of practices and its crop calendar were not found. The "Pomegranate Bulletin No. 65" that search lists under krishi.icar.gov.in turned out to be the CIAH Bikaner bulletin (used above).
- **UHS Bagalkot, UAS Dharwad/Raichur:** no pomegranate package found; `uhsbagalkot.edu.in` did not answer. So SOUTH_DECCAN follows Tamil Nadu (TNAU) only.
- **MPKV:** no full package of practices in English was found; the Marathi *Krishi Darshani* was not fetched. Only MPKV's recommendation list and its Lakhmapur centre profile (one item: a 60 GSM white net cover, not used) were read.
- **Vikaspedia pomegranate package page:** JavaScript-only; no text came back.

---

## 1. Regions

| Region | Source | Status | Notes |
|---|---|---|---|
| NORTH_INDIA | PAU | **ships** | <ul><li>Follows Punjab. UP, Haryana and Delhi are not checked separately (as for citrus and papaya).</li><li>Five calendar rows. PAU gives real months for manure, urea, summer water and the black-spot sprays.</li><li>No pruning month and no frost step (see §5).</li></ul> |
| SOUTH_DECCAN | TNAU | **ships** (S1 + conditionals; S2 held, Q1) | <ul><li>Follows Tamil Nadu. Karnataka (Bagalkot, Vijayapura) is not checked: UHS was not reached (Q8).</li><li>One calendar row: TNAU's December pruning after harvest. A feed after it (S2) is held: no source gives a per-year bearing dose for the region (Q1).</li><li>TNAU's season table puts natural flowering in May–Jul and fruit in Oct–Jan (p.343), so December falls after the natural harvest.</li></ul> |
| WEST_INDIA | NHB (Maharashtra Govt), CIAH | **drafted, kept in `pendingRegions`** (Q3) | <ul><li>Every bearing-tree timing in NRC, MPKV, NHB and CIAH is counted from the bahar.</li><li>The only calendar rows are the young-tree feeds, and Maharashtra (NHB: Jul, Sep, Feb) and Rajasthan (CIAH: Jan, Jun, Sep) disagree on the months.</li><li>The conditionals are ready and apply here too.</li></ul> |

There is no `sameAs`. PAU and TNAU disagree on pruning, the dose and the season.

## 2. Rules used

1. **Placement of manure and fertiliser** (NIPHM pp.25–26): in a ring trench 15–20 cm wide and 8–10 cm deep, 45–60 cm from the stem. Cover it with soil and water lightly. Wear gloves.
2. **Doses per year of age, as the guides give them.** Banded tables are shown as conflicts; they are never turned into a per-year rule.
3. **Bordeaux (owner exception, 2026-11-12):** paste on cuts; a spray only when no fruit is on the tree.
   - **10% Bordeaux paste** (NRC 146 p.8): soak 100 g copper sulphate in 500 ml water and 100 g quicklime (or fresh hydrated lime) in another 500 ml overnight. Mix them in the morning to make 1 L of paste. Use a plastic or clay pot, never iron. Wear gloves.
   - **1% Bordeaux spray** (NRC 146 p.7): 10 g copper sulphate and 3–4 g quicklime per litre, each soaked separately overnight in plastic. Mix, strain, and check with an iron nail: a rusty coat means too much copper, so add lime. Use the same day. Mix nothing else in. Wear gloves.
4. **Fertilisers and boric acid** have no waiting period.
5. **Chemicals:** only rows with a pomegranate claim in MUP; the dose per litre comes from the label's water volume (§4).

---

## 3. Care tables

### 3N. NORTH_INDIA (PAU)

| # | Key | Reminder (≤60) | Window | Stages | Cat. | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| N1 | `manure_dec` | Spread the yearly manure in December | Dec 1–31 | young, bearing | FEEDING | Well-rotted FYM, **5 kg × age**, up to 5 years (25 kg). Placed as in rule 2.1 | — | The year's organic feed, given while the tree is bare | OK. PAU says "5–6 kg per plant per year of age during December"; I took the lower figure. PAU gives no cap for FYM, so it uses the urea cap of 5 years (Q2) | PAU p.120 |
| N2 | `urea_feb` | Give half the year's urea in February | Feb 1–29 | young, bearing | FEEDING | — | Urea **25 g × age**, up to 5 years (125 g), placed as in rule 2.1. Wear gloves | Feeds the spring flush and the flowers | OK. PAU: "20 g N (50 g urea) for each year … stabilized after five years (urea 250 g) … one half in February" | PAU p.120 |
| N3 | `urea_apr` | Give the other half of the urea in April | Apr 1–30 | young, bearing | FEEDING | — | as N2 | Feeds the setting fruit | OK ("other half in April") | PAU p.120 |
| N4 | `summer_water` | Water every 10–15 days through the summer | Apr 1–Jun 30 | young, bearing | WATERING | Water the basin every 10–15 days. Keep it steady once fruit has set: dry soil followed by a flood cracks fruit | — | Fruit drops or cracks when the soil dries out | OK. PAU's pomegranate text gives "summer" without months. Apr–Jun is borrowed from PAU's **mango** chapter ("fruit development period between April to end June", p.50) and the approved papaya NORTH phase | PAU p.120; PAU p.50 (mango); NHB pom003 |
| N5 | `black_spot_rains` | Guard fruit against black spot as rains near | May 1–Jul 31 | bearing | PROTECTION | <ul><li>Pick up and burn or bury fallen leaves and any fruit with dark, oily spots.</li><li>Keep weeds down under the tree.</li><li>Water at the base, never over the leaves.</li></ul> | Kasugamycin 5% + copper oxychloride 45% WP, 1 g per litre, once each in May, June and July (PAU's months). Wear gloves; never within 10 days of picking | Black spot (bacterial blight) spreads with rain splash onto the ripening fruit | **corrected:** PAU's Bordeaux spray in May, June and July falls on a tree carrying fruit, which is outside the Bordeaux exception. It is replaced by the labelled product (Q6) | PAU p.121; NIPHM p.27, p.41; MUP-F p.69 |
| *N6* | *`deblossom`* | *Pick off new flowers from late April* | *Apr 22–Jun 30* | *bearing* | *PRUNING* | *Remove flower buds and flowers that open from 22 April (Kandhari) or 15 April (Ganesh)* | — | *Fewer, larger fruit* | **held (Q4):** PAU gives this for well-sized fruit, but it trims natural flowering. Not counted | *PAU pp.119–120; HP Shiva p.5* |

**Month check:**
- Apr: N3 and N4 (2).
- May and Jun: N4 and N5 (2).
- Feb, Jul and Dec: 1 each.
- No month has more than 2.

**Phases:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `winter_bare` | Dec–Feb | Heavy watering; water lightly only in a long dry spell | Branches with dark cankers (cut them out, C3) | PAU p.119 (deciduous in cold winters), p.120 (irrigation) |
| `hot_dry` | Apr–Jun | Letting the basin dry out | Fruit borer on young fruit (May–Jun); aphids on new shoots | PAU p.120, p.121 |
| `monsoon` | Jul–Sep | Water standing in the basin | Black spots on fruit once the rains start; ripe fruit cracking (pick on time) | PAU p.119 (Bhagwa ripens mid-Aug to mid-Sep), p.121 |

Mar, Oct and Nov belong to no phase: PAU gives no season for them.

### 3S. SOUTH_DECCAN (TNAU)

| # | Key | Reminder | Window | Stages | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | `prune_dec` | Prune last season's shoots back by a third | Dec 1–31 | bearing | PRUNING | <ul><li>After the last fruit is picked, shorten each of last season's shoots by one third.</li><li>Cut out dried, diseased and crossing branches, root suckers and water shoots.</li><li>Paste every cut with 10% Bordeaux paste (rule 2.3).</li><li>With no fruit left, spray 1% Bordeaux the same evening (rule 2.3). Wear gloves.</li></ul> | — | New shoots carry next season's flowers; clean cuts keep blight out | OK. TNAU: "annual pruning is done after harvest is completed during December". The paste and spray come from NRC 146, rest-period sprays | TNAU p.36; NRC 146 p.7, p.8 |
| *S2* | *`feed_after_prune`* | *Feed the tree after the December pruning* | Dec 1–31 | bearing | FEEDING | Well-rotted FYM, **10 kg × age**, up to 5 years (50 kg), placed as in rule 2.1 | Ammonium sulphate **200 g × age**, up to 5 years (1 kg), in the same trench. Wear gloves | The tree is spent after fruiting; the feed builds next season's shoots | **held (Q1), not counted:** <ul><li>NIPHM's per-year rule (10 kg FYM + 150–200 g ammonium sulphate × age, 50 kg + 1 kg at 5 years) is in its *planting* section. The next sentence (p.24) gives the **adult bearing tree a flat 675 g N + 250 g P + 250 g K**. The cap of 1 kg ammonium sulphate is only about 205 g N, a third of that, with no P or K.</li><li>TNAU's own table is banded with no month (bearing: 20–30 kg FYM, 400–600 g N, 250–500 g P, 800–1200 g K).</li><li>Using either would mean inventing a per-year bearing dose.</li></ul> | NIPHM pp.23–24; TNAU p.36; CIAH p.12; NRC 89 p.1 |

Young trees in SOUTH get no calendar feed: TNAU gives no month, and NIPHM gives none either (Q1).

TNAU's training rule ("single stem up to 60 cm with 3 or 4 scaffold branches", p.36) has no month and goes on the plant page with C8 and C10.

**Month check:** Dec has 1 (S1; 2 if S2 is added). All other months have 0.

**Phases:**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `flowering` | May–Jul | Letting the soil dry out | Fruit borer eggs on flowers and young fruit; aphids; thrips | TNAU p.343 (flowering May–Jul), p.36 (copious irrigation in fruiting), pp.37–38 |
| `fruit_growth` | Aug–Sep | Uneven watering (cracking) | Oily spots on leaves and fruit in wet spells | NHB pom004 (5–6 months from flower to ripe fruit); NHB pom003 |
| `harvest` | Oct–Jan | Leaving ripe fruit on the tree (it cracks) | Fruit fly and fruit-piercing moth on ripening fruit | TNAU p.343 (fruiting Oct–Jan); NHB pom004, pom008 |

Feb–Apr belongs to no phase: TNAU gives no season for it. Monsoon timing differs across the region (south-west in Karnataka and Telangana, north-east in Tamil Nadu), so blight sits under "watch" rather than in a dated phase, as for papaya.

### 3W. WEST_INDIA, drafted and kept pending (Q3)

| # | Key | Reminder | Window | Stages | Cat. | Organic | Chemical | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| W1–W3 | `feed_young_1` … `_3` | Feed the young tree (feed N of 3) | <ul><li>Jul 1–31</li><li>Sep 1–30</li><li>Feb 1–29</li></ul> | young | FEEDING | (dose open, Q1/Q3) | (dose open) | Three small feeds in the first three years | **open:** NHB (Maharashtra Govt) says "during first three years … three equal doses in July, September and February". CIAH (Rajasthan) gives Jan, Jun and Sep. NHB's dose table is banded (2 yr: 5 kg FYM, 250 g N, 125 g P, 125 g K; 3 yr: 10 kg, 500, 125, 250). No per-year rule other than NIPHM's | NHB pom007; CIAH p.12 |

No bearing-tree calendar rows:
- NHB pom005, TNAU p.36 and CIAH p.8 say a regularly watered tree flowers continuously.
- MPKV's pruning (item 3: "light pruning of terminal twigs … before onset of bahar") and every NRC timing are counted from a bahar the gardener won't set.
- A post-harvest prune-and-feed step would need a harvest month, and an unregulated Maharashtra tree has none in any source.

**Phases (draft):** `year_round` Jan–Dec. Avoid waterlogging (wilt). Watch oily spots after rain, wilt, thrips and mites (Apr–Oct, CIAH p.18). Sources: NIPHM p.41, CIAH pp.15–18.

### 3C. Plant page only (conditional, never reminders), all three regions

| # | Key | Only if you see… | What to do (organic first) | Chemical alternative | Check | Source |
|---|---|---|---|---|---|---|
| C1 | `bag_fruit` | **Small fruits have set** (title: "Bag young fruits against the anar butterfly") | <ul><li>Slip a paper, white non-woven or polythene bag over each fruit as soon as it sets, and no later than 5 cm across. Tie it loosely at the stalk.</li><li>Pick off and destroy any fruit with a hole and dark droppings.</li><li>Pull up flowering weeds of the daisy family nearby.</li><li>The bags also keep off fruit fly, fruit-piercing moth and birds.</li><li>NORTH: the borer attacks in May–June (PAU).</li></ul> | Cyantraniliprole 10.26% OD, 0.75 ml per litre, from flowering onwards. Wear gloves; never within 5 days of picking | OK. TNAU's neem oil and NSKE, NHB's carbaryl, MPKV's emamectin and deltamethrin, CIAH's deltamethrin and malathion, and TNAU's chlorpyriphos removed (no pomegranate claim) | NIPHM p.25, p.28; HP Shiva p.18; TNAU p.37; PAU p.121; NRC 146 p.6; CIAH p.19; MUP-I p.18 |
| C2 | `even_water` | **Fruit is forming** (title: "Water evenly while fruit grows to stop cracking") | <ul><li>Water regularly from fruit set to harvest. Never let the soil dry hard and then flood it.</li><li>Mulch the basin; manure helps the soil hold water.</li><li>Pick fruit as soon as it is ripe.</li></ul> | Young trees (cracking from lack of boron): boric acid 0.5 g per litre on the leaves before bloom and at fruit set, never near ripening. It is a fertiliser, so there is no waiting period. Wear gloves | **corrected:** NHB's GA 40 ppm and HP Shiva's GA₃ removed (MUP-PGR has no pomegranate cracking claim); TNAU's liquid paraffin removed (not on any list). NHB's "boron 50 ppm" uses CIAH's boric acid dose | NHB pom003, pom004, pom006; CIAH p.11, p.13, p.14; HP Shiva p.21 |
| C3 | `blight` | **Dark, oily, water-soaked spots on leaves or fruit; fruit splitting in an L shape; dark cankers on twigs** (title: "Cut out and treat oily-spot blight") | <ul><li>Cut affected twigs 5–10 cm below the canker. Paste each cut with 10% Bordeaux paste (rule 2.3).</li><li>Pick and burn or bury spotted fruit and fallen leaves.</li><li>Wipe the secateurs in bleach (sodium hypochlorite 2–3 ml per litre) between cuts.</li><li>Water at the base only.</li><li>Only when no fruit is on the tree: spray 1% Bordeaux (rule 2.3).</li></ul> | Kasugamycin 5% + copper oxychloride 45% WP, 1 g per litre. Wear gloves; never within 10 days of picking | OK. Streptocycline removed (banned from 1 Jan 2024, NRC 146 p.1). Bronopol, copper oxychloride alone and copper hydroxide removed (no pomegranate claim). Copper sulphate pentahydrate 6% SC (2.5 ml/L, 33 days) is also labelled but not used (longer wait) | NRC 89 p.1 (2–4 in. below); CIAH p.15 (5–8 cm); NIPHM p.27, p.40; HP Shiva p.5, p.14; MUP-F p.69 |
| C4 | `wilt` | **Leaves yellow and dry on one branch, then the whole tree; the wood inside is dark brown** (title: "Remove a wilting tree with its roots") | <ul><li>Dig out the whole tree with its roots once a whole branch is affected, and burn it.</li><li>Don't replant in that spot until the soil has been sun-baked (solarised) under clear plastic.</li><li>Never let water stand in the basin.</li></ul> | — | OK. No chemical: chlorpyriphos, propiconazole, carbendazim, fosetyl-Al, tebuconazole drenches and *Aspergillus niger* have no pomegranate wilt claim | NRC 117 p.10; CIAH p.11, p.16; NIPHM p.43 |
| C5 | `thrips` | **Scabby, scraped marks on buds and fruit, or new leaves curled and tips dried** (title: "Check thrips on buds and young fruit") | <ul><li>Snip off and destroy affected shoots.</li><li>Hang blue sticky traps.</li><li>Don't grow chilli, onion, garlic, brinjal or tomato beside the tree.</li></ul> | Cyantraniliprole 10.26% OD, 0.75 ml per litre. Wear gloves; never within 5 days of picking | OK. MPKV's spinosad and neem + karanj oil, CIAH's imidacloprid and acephate, and HP Shiva's acetamiprid removed (no claim). Tolfenpyrad 15 EC (2 ml/L, 7 days) and broflanilide 20 SC are also labelled but not used | CIAH p.18; NIPHM p.26; MUP-I p.18 |
| C6 | `aphids_whitefly` | **Sticky leaves, black sooty mould, or clusters of small insects on new shoots and under leaves** (title: "Wash off aphids and whitefly") | <ul><li>Hose the undersides of the leaves with a strong jet of water.</li><li>Hang yellow sticky traps.</li><li>Ask the KVK for green lacewing (*Chrysoperla*) larvae to release when flowers begin.</li><li>Don't grow roses beside the tree.</li></ul> | Cyantraniliprole 10.26% OD, 0.9 ml per litre. Wear gloves; never within 5 days of picking | OK. MPKV's imidacloprid, NHB's dimethoate, monocrotophos and dichlorvos, and CIAH's thiamethoxam removed (no pomegranate claim) | NHB pom008; NIPHM p.27; TNAU p.37; CIAH p.19; MUP-I p.18 |
| C7 | `mites` | **Shiny white or brown patches under leaves; leaves curl and fall, and a pressed leaf stains red** (title: "Water regularly to keep mites down") | Keep watering regularly through dry spells; mites are worst from April to October in dry weather | — | OK. No chemical: propargite and spiromesifen have no pomegranate claim, and dicofol is banned | CIAH p.18 |
| C8 | `suckers` | **Shoots coming up from the base or roots** (title: "Pull out suckers from the base") | Remove them as soon as they appear. Keep the trunk clear of shoots to 30 cm (PAU) or 60 cm (TNAU), with 3–4 main branches above | — | OK | NHB pom005; CIAH p.10; NIPHM p.26; PAU pp.119–120; TNAU p.36 |
| C9 | `fungal_spots` | **Dry, dark, round spots on leaves or fruit that are not oily or sticky** (title: "Treat dark fungal spots on leaves and fruit") | <ul><li>Pick off and destroy spotted fruit, leaves and twigs.</li><li>Thin crowded branches to let air in.</li></ul> | Propineb 70% WP, 3 g per litre. Wear gloves; never within 10 days of picking | OK. NHB's Dithane M-45, captan, Bavistin, Difolatan and Sulfex, and CIAH's carbendazim and mancozeb, removed (no claim or banned). Garlic/onion extract (NIPHM) removed (no claim; neem precedent) | CIAH p.16 (spot types); NIPHM p.27; MUP-F p.25 |
| C10 | `deadwood` | **Dead, broken or crossing branches, or shoots on the trunk** (title: "Cut out dead, crossing and trunk shoots") | Cut them out. Paste cuts thicker than 1 cm with 10% Bordeaux paste (rule 2.3). Wear gloves | — | OK. This is PAU's pruning, which has no month (Q5) | PAU p.119 (box), p.120; HP Shiva p.5 (>10 mm) |
| C11 | `bark_caterpillar` | **Webbing of chewed wood and droppings on the bark, with holes** (title: "Clear bark-eating caterpillar from the trunk") | Clear the webbing. Push a cotton swab wet with kerosene into each hole and seal it with wet mud | — | OK. NHB's carbaryl, quinalphos and methomyl removed (no claim) | NHB pom008 |

All C rows: stages young + bearing, except C1, C2 (boric acid part young only), C5 and C9, which are bearing.

**Removed lines with no replacement:**
- **Scales:** quinalphos 25 EC does carry a pomegranate claim (MUP-I p.46), but the per-litre dose isn't clear from the row, and TNAU (4 ml/L) and TNAU web (2.5 ml/L) disagree. Not a common home-garden problem; left out.
- **Mealybug:** NHB's dichlorvos, malathion and phorate and MPKV's *Verticillium lecanii* have no pomegranate claim. NIPHM's *Cryptolaemus* release is orchard-scale.
- **Nematodes:** fluensulfone 2% GR is labelled (MUP-I p.33, 91 days) but is a dripper-placed granular, not for a home garden. CIAH's neem cake 1–2 kg per plant is a manure and could go into C4 if the owner wants a nematode item.
- **Stem-pasting up to 2 ft and red-soil paste** (NRC 146, NRC 89) are not cuts (Q7).

## 4. Label claims checked (MUP to 30.09.2026), pomegranate only

| Product | Claim | Dose on label → per litre | Waiting days | Used? |
|---|---|---|---|---|
| Cyantraniliprole 10.26% OD (MUP-I p.18) | thrips, pomegranate butterfly | 750 ml in 1000 L → **0.75 ml/L** | 5 | yes (C1, C5) |
| same | whitefly, aphids | 900 ml in 1000 L → **0.9 ml/L** | 5 | yes (C6) |
| Kasugamycin 5% + copper oxychloride 45% WP (MUP-F p.69) | bacterial blight, leaf spot, fruit rot, anthracnose | 0.1% formulation → **1 g/L** | 10 | yes (N5, C3) |
| Propineb 70% WP (MUP-F p.25) | leaf and fruit spots | 0.30% → **3 g/L** | 10 | yes (C9) |
| Copper sulphate pentahydrate 6% SC (MUP-F p.9) | bacterial blight | 2.5 ml/L | 33 | no (longer wait than kasugamycin + COC) |
| Copper sulphate 47.15% + mancozeb 30% WDG (MUP-F p.59) | bacterial blight, Alternaria and Cercospora spots | 2.5 kg in 500 L → 5 g/L | 44 | no (44-day wait) |
| Tolfenpyrad 15% EC (MUP-I p.53) | thrips | 1000 ml in 500 L → 2 ml/L | 7 | no (one thrips product is enough) |
| Broflanilide 20% SC (MUP-I p.8) | thrips, fruit borer | 125 ml in 500 L → 0.25 ml/L | 1 | no (newer and costlier; owner may prefer it for the 1-day wait) |
| Others with a pomegranate row: azoxystrobin, difenoconazole, kitazin, metiram, tebuconazole, lambda-cyhalothrin 4.9 CS, chlorantraniliprole + lambda-cyhalothrin ZC, quinalphos, fluensulfone, several mixtures | various | — | — | not needed |
| MUP-PGR: ethephon (defoliation) and a flowering inducer | bahar | — | — | no (owner: no bahar) |
| Bio-insecticides, bio-fungicides | no pomegranate entry | | | — |

Banned/restricted check: cyantraniliprole, kasugamycin, copper oxychloride, propineb and copper sulphate are not on India's banned, refused or restricted lists as of 31 March 2024 (Wikipedia's summary of S.O. 4294(E), 3 Oct 2023). The official CIB&RC list itself was not fetched: the state copies tried returned nothing. On that summary, dicofol is banned, and monocrotophos and quinalphos are restricted.

## 5. What the check changed
1. **No bahar steps.** Removed water stress, ethrel and DAP defoliation, salicylic acid and micronutrient sprays timed from the bahar, the NAA flower spray (TNAU, NRC 146), and MPKV's pre-bahar pruning.
2. **No frost item for NORTH.** The owner suggested one, but PAU calls pomegranate deciduous in cold winters (p.119) and leaves it off the fruit-garden frost list (papaya, banana, mango, litchi, amla, guava; pp.138–139).
3. **No dated pruning for NORTH.** PAU gives no month. HP Shiva's "winter months" is the HILLS region, so pruning goes on the plant page (C10, Q5).
4. **PAU's May–July Bordeaux sprays** replaced by kasugamycin + COC, because fruit is on the tree (N5, Q6).
5. **Kandhari/Ganesh deblossoming** (PAU) held for the owner (N6, Q4).
6. **Bagging, cracking, blight, wilt, thrips, aphids, mites and suckers** are conditional in every region, as the owner asked.
7. **Chemicals dropped (no CIB&RC pomegranate claim, or banned):**
   - insecticides: carbaryl, deltamethrin, malathion, chlorpyriphos, quinalphos (as used by NHB), methomyl, triazophos, monocrotophos, dichlorvos, dimethoate, phorate, BHC, imidacloprid, thiamethoxam, acetamiprid, acephate, spinosad, spinetoram, emamectin benzoate, indoxacarb, flonicamid, buprofezin, cypermethrin;
   - acaricides: propargite, spiromesifen, dicofol;
   - fungicides and bactericides: streptocycline (banned), bronopol, copper oxychloride alone, copper hydroxide, carbendazim, mancozeb, captan, Dithane Z-78, Difolatan, Sulfex, hexaconazole, propiconazole, metalaxyl, fosetyl-Al;
   - PGRs: ethephon, GA₃, NAA, Lihosin, 6-BA (bahar, or no claim).
8. **Neem oil, NSKE, azadirachtin, karanj oil, garlic extract, *Verticillium*, *Trichoderma*, *Aspergillus niger* and *Pseudomonas* removed:** no pomegranate claim (papaya and citrus precedent).
9. **Doses:** NORTH uses PAU's per-year rule. SOUTH's feed (S2) is held: NIPHM's per-year rule is a young-tree rule, a third of its own adult N, and TNAU's table is banded (Q1). TNAU's, NHB's and CIAH's tables are shown, not converted.
10. **Pending:** WEST (Q3).

**Row tally**

| Group | Rows | OK | Corrected | Open/held |
|---|---|---|---|---|
| NORTH calendar (N1–N6) | 6 | 4 | 1 (N5) | 1 held (N6) |
| SOUTH calendar (S1–S2) | 2 | 1 | — | 1 held (S2, Q1) |
| WEST calendar (W1–W3, pending) | 3 | — | — | 3 (Q3) |
| Conditionals (C1–C11) | 11 | 10 | 1 (C2) | — |
| **Total** | **22** | **15** | **2** | **5** |

Phases: 7 rows (NORTH 3, SOUTH 3, WEST 1), all sourced.

## Source links
- PAU Package of Practices for Cultivation of Fruits: https://www.pau.edu/content/ccil/pf/pp_fruits.pdf (pomegranate pp.119–121; Bordeaux pp.10–11; irrigation p.50; frost list pp.138–139)
- TNAU Crop Production Guide, Horticulture 2020: https://agritech.tnau.ac.in/pdf/HORTICULTURE.pdf (pomegranate pp.36–38: fertiliser and pruning p.36, bahar and borer p.37, thrips and diseases p.38; season table p.343)
- TNAU Agritech pomegranate: https://agritech.tnau.ac.in/horticulture/horti_fruits_pomegranate.html
- NRC 146 IDIPM schedule (Sept 2023): https://web.archive.org/web/20240813060126id_/https://nrcpomegranate.icar.gov.in/files/Advisory/146.pdf
- NRC 89 Six Steps for bacterial blight: https://web.archive.org/web/20220619071029id_/https://nrcpomegranate.icar.gov.in/files/Advisory/89.pdf
- NRC 117 bimonthly advisory, June–July 2022: https://web.archive.org/web/20220619070512id_/https://nrcpomegranate.icar.gov.in/files/Advisory/117.pdf
- CIAH Tech. Bull. 65 (2018): https://web.archive.org/web/2025id_/https://krishi.icar.gov.in/jspui/bitstream/123456789/19334/1/Pomegranate%20Bulletin%20No%2065%202018%20%2832pg%29.pdf
- MPKV fruit crop recommendations: https://mpkv.ac.in/Uploads/Research/13.%20Fruit%20crops_20200110060006.pdf
- MPKV Lakhmapur centre: https://mpkv.ac.in/Uploads/Research/20260819_105921_d30ab2f31031e2031da814a521bfe6de.pdf
- NHB pomegranate sheets: https://www.nhb.gov.in/pdf/fruits/pomegranate/pom002.pdf (diseases), pom003 (disorders), pom004 (harvest), pom005 (intercultural, bahar, training), pom006 (irrigation), pom007 (manuring), pom008 (pests), pom010 (planting)
- NIPHM AESA IPM Pomegranate: https://niphm.gov.in/IPMPackages/Pomegranate.pdf (pp.23–28, 30, 40–43)
- HP Shiva pomegranate PoP: https://hpshiva.hp.gov.in/cms/media/ggojam4f/pomegranate.pdf
- MUP (CIB&RC): https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides
  - insecticides: https://ppqs.gov.in/sites/default/files/MUP%20%28insecticide%29%20%2030.09.2026.pdf (pp.8, 18, 33, 46, 53)
  - fungicides: https://ppqs.gov.in/sites/default/files/Fungicide%20MUP%20%20as%20on%2030.09.2026.pdf (pp.9, 25, 59, 69)
  - PGR: https://ppqs.gov.in/sites/default/files/5.%20PGR%20MUP%20as%20on%2030.09.2026.pdf (pp.4, 11)
  - bio-insecticides and bio-fungicides: no pomegranate entry
- Not reached: https://nrcpomegranate.icar.gov.in (NXDOMAIN; Wayback used); https://krishi.icar.gov.in (NXDOMAIN); https://uhsbagalkot.edu.in (no answer); Vikaspedia pomegranate package (JavaScript-only)

## 6. Open questions for the owner
- **Q1. Feed dose for SOUTH (and WEST):** no source gives a per-year **bearing** dose outside Punjab.
  - NIPHM's per-year rule (10 kg FYM + 150–200 g ammonium sulphate × age, reaching 50 kg + 1 kg at 5 years, pp.23–24) is a young-tree rule. The same page gives a grown tree a flat 675 g N + 250 g P + 250 g K. The 1 kg ammonium sulphate cap is only about 205 g N, with no P or K.
  - TNAU's table is banded with no month: FYM 10 / 20 / 30 kg, N 200 / 400 / 600 g, P 100 / 250 / 500 g and K 400 / 800 / 1200 g for year 1 / years 2–5 / year 6+. NHB and CIAH are banded too.
  - Recommendation: **hold S2.** SOUTH ships with S1 plus the conditionals. Revisit if the owner accepts a flat bearing dose (e.g. TNAU's 6th-year figure, as the amla doc noted for TNAU) or a UHS/UAS per-year rule is found.
- **Q2. NORTH FYM figure and cap:** PAU says 5–6 kg per year of age with no cap for FYM. Recommendation: 5 kg × age, capped at 5 years with the urea (25 kg). NHB's 30–40 kg for a grown tree suggests the cap is not too low.
- **Q3. WEST:** keep it in `pendingRegions`? Every bearing timing is bahar-based, and the young-tree feed months conflict (Maharashtra Jul/Sep/Feb against Rajasthan Jan/Jun/Sep). Recommendation: **keep it pending**. Ship the conditionals (C1–C11) for WEST if the engine shows conditionals for a pending region; otherwise wait for an MPKV package.
- **Q4. Deblossoming in NORTH** (PAU: remove flowers from 22 April for Kandhari, 15 April for Ganesh, for well-sized fruit). Recommendation: **leave it out**, following the "flower naturally" decision. Revisit if gardeners report small fruit.
- **Q5. NORTH pruning month:** PAU gives none; HP Shiva (hills) says winter. Recommendation: keep pruning as C10 (plant page) until a PAU or Punjab KVK month is found.
- **Q6. PAU's Bordeaux sprays in May–July** fall on a fruiting tree. Recommendation: accept the replacement with kasugamycin 5% + COC 45% WP (labelled, 10-day wait) and keep sanitation as the organic step.
- **Q7. Bordeaux paste on the stem** up to 1.5–2 ft and on main-stem cankers (NRC 89, NRC 146). Recommendation:
  - allow it on a **scraped canker** on the main stem, as a wound;
  - don't add the preventive whole-stem paste, which is a bahar-season orchard step.
- **Q8. SOUTH = Tamil Nadu:** Karnataka's Bagalkot and Vijayapura are the main pomegranate districts in this region, and UHS Bagalkot was not reached. Recommendation: accept TNAU for now (citrus and papaya precedent) and re-check when a UHS source is found.
- **Q9. Broflanilide instead of cyantraniliprole** for borer and thrips (1-day wait against 5)? Recommendation: keep cyantraniliprole. One product covers borer, thrips, aphids and whitefly, which is simpler for a home gardener.

Status: **approved by the owner on 2026-11-23 with every recommendation** (review doc "Pomegranate care — owner review"). Transcribed into `backend/src/modules/catalogue/seed/tree-care/pomegranate.seed.ts` without the held rows (N6 deblossoming, S2 feed). Feb and winter windows end on the 29th (house leap-day rule).
