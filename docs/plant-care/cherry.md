# Cherry care: draft + source check (2026-11-23)

Sweet cherry (*Prunus avium*). The catalogue has the plain entry, Stella and Mishri, all in HILLS_COOL only. Kinds: none; the three entries share one care set. `grownIn` = HILLS_COOL.

**Main finding:** no regional package of practices for sweet cherry was found. The SKUAST-Kashmir, ICAR-CITH, Dr YSPUHF/HP Horticulture and GBPUAT guides the brief names are not covered here (see "Not reached"). The only crop-specific Indian guide read is the **national** NIPHM/DPPQS *AESA based IPM package: Cherry*. It gives two calendar months, December for manure and April for mulch, and no flowering, harvest, irrigation or pruning month. HILLS_COOL is therefore **drafted and kept in `pendingRegions`** (Q1), as pomegranate did for WEST. The conditionals are ready.

Sources (full links at the end):
- **NIPHM** = *AESA based IPM Package: Cherry*, NIPHM Hyderabad with DPPQS Faridabad (Ministry of Agriculture, GoI). PDF pages. Stage-wise IPM is on pp.22–28, pest and disease descriptions on pp.31–45, and Do's and Don'ts on p.47. Its "safety at harvest" text on p.46 is strawberry boilerplate ("berries… ever-bearers") and is **not used**. NIPHM is national, not a HILLS_COOL regional guide.
- **SKUAST-J** = SKUAST-Jammu, *Package of Practices for Sub-tropical and Temperate Fruits*. It has no cherry chapter: cherry appears only in seed tables (pp.5–7), and "cherry fruit fly" appears on p.108 inside the **apricot** section. Read only to confirm the absence. NIPHM's reference list cites this file under its older skuast.org path.
- **HP schedule** = Dept of Horticulture HP with Dr YSPUHF Nauni, *Spray Schedule 2022 (Peach, Plum, Apricot & Almond)*, 4 pages. **It does not cover cherry.** It is used only as a stone-fruit comparison for Bordeaux paint on wounds (p.3, notes 6–7), as a borrow from another crop (Q5).
- **Pomegranate rule 2.3** = the Bordeaux paste and 1% spray recipes approved in `pomegranate.md` (NRC 146 pp.7–8; PAU pp.10–11). Reused here as the recipe only.
- **SKUAST-K cracking studies** = research papers, not packages. One is a survey of rain cracking in Srinagar and Shopian (HortFlora Research Spectrum 2014), which found Mishri the most cracking-prone (>50% loss). The other is a SKUAST-K Fruit Science review noting that nets and rain covers reduce cracking. Backing only, and read through search abstracts, not the full papers.
- **MUP** = CIB&RC Major Uses of Pesticides to 30.09.2026: MUP-I insecticides, MUP-F fungicides, MUP-PGR plant growth regulators, and the bio-insecticide and bio-fungicide lists. PDF pages.

**Not reached:**
- **SKUAST-Kashmir:** no fruit or cherry package found. Its publications page lists floriculture, vegetable, rabi and kharif packages only. `hortikashmir.gov.in` (Dept of Horticulture, Kashmir) refused connections on https and returned nothing on http.
- **ICAR-CITH Srinagar:** `cith.icar.gov.in` answered once in search but then failed to resolve (ENOTFOUND). The Technology Inventory Bulletin and the 2015/2016 annual reports, which carry the cherry selection trials, were not read. `krishi.icar.gov.in` does not resolve either (as for pomegranate).
- **Dr YSPUHF / HP Shiva:** HP Shiva covers subtropical fruits only (citrus, guava, litchi, pomegranate) and has no cherry package. The HP Horticulture Development Society's *Stone fruit and walnut cultivation practices (English)* (37 MB) was streamed through `pdftotext`, but no text at all came out, only a page-offset warning. It looks image-only. Whether the download finished within the 580 s cap was not confirmed; an earlier byte count did reach the full 37,359,023 bytes. It needs OCR or a manual read for a cherry chapter. The eUdyan *Phytoplasma disease and management in cherry* (2023) was not read.
- **GBPUAT:** no cherry package found.
- **SKUAST-J fruit PoP 2020** (KVK portal copy): `kvk.icar.gov.in` does not resolve.
- **Vikaspedia "IPM strategies for cherry":** no body text came back. It appears to be a copy of NIPHM.

---

## 1. Regions

| Region | Source | Status | Notes |
|---|---|---|---|
| HILLS_COOL | NIPHM (national) | **drafted, kept in `pendingRegions`** (Q1) | <ul><li>Only two calendar rows are sourced: December manure (H1) and April mulch (H4). H1's dose is open (Q2).</li><li>The N splits are timed "2–3 weeks before flowering" and "a month later". No source gives a flowering month for the region, so they are held (Q3).</li><li>No source gives months for netting, harvest, irrigation or dormant pruning (Q4). Harvest months appear only in news reports (mid-May to early July).</li><li>The conditionals (C1–C9) are ready.</li></ul> |

There is no `sameAs`: cherry is grown in one region only.

## 2. Rules used

1. **Placement of manure and fertiliser** (NIPHM p.24): in a trench 20–30 cm deep and 30 cm wide along the drip line of the tree. N goes in the basin about 30 cm from the trunk, banded rather than broadcast (NIPHM pp.27–28). Cover the trench with soil and water lightly. Wear gloves.
2. **Doses per year of age, as the guides give them.** NIPHM's table is banded (§3H dose table). It is shown as a conflict and not silently turned into a per-year rule (Q2).
3. **Bordeaux (owner exception, 2026-11-12):** paste on cuts; a spray only when no fruit is on the tree. Recipes as approved for pomegranate (rule 2.3):
   - **10% Bordeaux paste:** soak 100 g copper sulphate in 500 ml water and 100 g quicklime (or fresh hydrated lime) in another 500 ml overnight. Mix them in the morning to make 1 L of paste. Use a plastic or clay pot, never iron. Wear gloves.
   - **1% Bordeaux spray:** 10 g copper sulphate and 3–4 g quicklime per litre, each soaked separately overnight in plastic. Mix, strain, and check with an iron nail: a rusty coat means too much copper, so add lime. Use the same day. Mix nothing else in. Wear gloves.
   - **No cherry guide** recommends Bordeaux. NIPHM says to cover cuts with "white lead paint" (p.23), which is lead and is **never used**. Its silver-leaf entry says "pruning sealer" on cuts over 1.5 cm (p.26). The HP stone-fruit schedule (peach, plum, apricot) uses Bordeaux paint on scraped collar and root wounds (p.3). Using the paste on cherry is a borrow (Q5).
4. **Fertilisers** have no waiting period.
5. **Chemicals:** only rows with a **cherry** claim in MUP, with a dose per litre and waiting days (§4). None qualifies, so this draft has **no chemical rows** (Q6).

---

## 3. Care tables

### 3H. HILLS_COOL (NIPHM), drafted and kept pending (Q1)

| # | Key | Reminder (≤60) | Window | Stages | Cat. | Organic (first) | Chemical alternative | Why | Check | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| H1 | `manure_dec` | Spread the yearly manure and feed in December | Dec 1–31 | young, bearing | FEEDING | Well-rotted FYM **(dose open, Q2)**, placed as in rule 2.1 | In the same trench, the full year's single super phosphate and muriate of potash: SSP **160 g × age** and MOP **100 g × age**, up to 10 years (1.6 kg and 1 kg). **(Proposed, Q2.)** Wear gloves | The year's manure, phosphate and potash go in while the tree is bare | **open (Q2):** <ul><li>NIPHM: "Farmyard manure should be applied in December along with a full dose of super phosphate and muriate of potash."</li><li>The dose table is banded. If Q2 is accepted, the `dose` is SSP 160 + MOP 100 per year, `maxAgeYears` 10, `together: true` with the FYM.</li></ul> | NIPHM p.24 |
| *H2* | *`can_before_bloom`* | *Give half the year's CAN before the flowers open* | *none sourced* | *young, bearing* | *FEEDING* | — | *CAN 100 g × age, up to 10 years (1 kg). Wear gloves* | *Feeds the spring flush and the flowers* | **held (Q3), not counted:** NIPHM: "first half at 2–3 weeks before flowering" (p.24) and "in spring before flowering" (p.27). No source gives a HILLS_COOL flowering month | NIPHM p.24, p.27 |
| *H3* | *`can_after_bloom`* | *Give the other half of the CAN* | *none sourced* | *young, bearing* | *FEEDING* | — | *as H2* | *Feeds the setting fruit* | **held (Q3):** "the remaining half a month later" (NIPHM p.24) | NIPHM p.24 |
| H4 | `mulch_apr` | Mulch the basin with dry grass in April | Apr 1–30 | young, bearing | WATERING | Spread dry grass or hay 10–15 cm thick over the tree basin | — | Keeps the soil moist through the dry spring and keeps weeds down | **corrected:** NIPHM says "Mulch the tree basin in April with 10 to 15 cm thick dry grass or hay to reduce weeds and conserve the soil moisture". A draft clause, "keep it a hand's width off the trunk", is not in NIPHM and was dropped | NIPHM p.24, p.28 |
| *H5* | *`net_ripening`* | *Net the tree against birds as fruit colours* | *none sourced* | *bearing* | *PROTECTION* | *Throw a bird net over the tree as the fruit turns colour; the same net cuts rain cracking (C1)* | — | *Birds can strip a small tree of ripe cherries* | **held (Q4), not counted:** no guide gives a month. Mid-May to early July appears only in news reports. NIPHM mentions birds only as bird perches for predatory birds (p.23) | SKUAST-K review (nets); news only for months |

Rows with no source, so not drafted: irrigation in dry months (NIPHM says only "proper irrigation… neither forced to drought nor water logging", p.23), dormant pruning month (Q4), dormant-season sprays (none for cherry in any source read; the HP schedule's white-bud dormant oil + copper oxychloride is for peach and plum), and harvest timing (Q4).

**NIPHM dose table (p.24), per plant, shown as given:**

| Age (years) | FYM (kg) | CAN (g) | SSP (g) | MOP (g) |
|---|---|---|---|---|
| 1–3 | 10–20 | 200–600 | 160–480 | 100–300 |
| 4–6 | 25–35 | 800–1200 | 640–960 | 400–600 |
| 7–9 | 35–50 | 1400–1800 | 1120–1440 | 700–900 |
| 10 and above | 60 | 2000 | 1600 | 1000 |

- Every band endpoint fits **CAN 200 g, SSP 160 g and MOP 100 g × age**, capped at 10 years. For example, CAN at age 4 is 800 g and at age 9 is 1800 g; SSP at age 7 is 1120 g; MOP at 10 is 1000 g. So the fertiliser columns read as a per-year rule written in bands.
- **FYM does not fit.** It runs 10, 15, 20 (5 kg × age + 5) for years 1–3, but then gives 35–50 for years 7–9 (the rule gives 40–50) and 60 at 10 years (the rule gives 55).
- An unsourced web copy (agrifarming.in) prints per-year rows 1/2/3 = 10/15/20 kg FYM and 200/400/600 g CAN, consistent with this reading. It is not a source.

**Month check:** Dec has 1 (H1), Apr has 1 (H4). All other months have 0, or 2–3 if H2, H3 and H5 get months.

**Phases (draft):**

| Phase | Months | Avoid | Watch | Source |
|---|---|---|---|---|
| `winter_bare` | Dec 1–Jan 31 | Leaving pruning cuts and broken limbs unsealed; leaving prunings stacked near the tree (borers breed in them) | Amber gum oozing from cankers on twigs, bud bases and old cuts (C2) | **Inferred** (no source names the bare months): NIPHM p.22 (planting Dec–Jan), p.24 (December manure), p.25 (prunings), p.40 (cankers spread and sink in winter) |

There is no spring, fruiting or harvest phase: no source gives months for them (Q4). Feb and Mar would belong to no phase.

### 3C. Plant page only (conditional, never reminders)

| # | Key | Only if you see… | What to do (organic first) | Chemical alternative | Check | Source |
|---|---|---|---|---|---|---|
| C1 | `cracking` | **Ripe or nearly ripe fruit splitting after rain** (title: "Cover ripening fruit against rain cracking") | <ul><li>Before rain is forecast near picking time, cover the tree with a net or a polythene rain cover.</li><li>Pick ripe fruit promptly and remove split fruit, which rots and draws pests.</li><li>Water evenly through fruit growth: never let the soil dry hard and then flood it.</li><li>Mishri cracks most.</li></ul> | — | **corrected:** GA₃ 50–100 ppm and calcium chloride 1% (SKUAST-K trials) dropped, as neither has a cherry cracking claim. MUP-PGR's GA₃ sweet-cherry claim is a spray at 60% bloom, not for cracking. "Water evenly" rests on NIPHM's "neither drought nor water logging" | SKUAST-K cracking survey and review; NIPHM p.23; MUP-PGR p.5 |
| C2 | `gummosis` | **Amber gum oozing from sunken cankers on twigs, at bud bases, at spur bases or in pruning wounds; buds that open and then collapse** (title: "Cut out cankers that ooze amber gum") | <ul><li>Cut the cankered twig back into healthy wood.</li><li>Paste each cut with 10% Bordeaux paste (rule 2.3, Q5).</li><li>Burn or bin the cut wood; never leave it near the tree.</li><li>Keep the tree unstressed: no waterlogging, no drought, sound bark.</li><li>Young trees of 2–8 years are hit hardest.</li></ul> | — | OK as sanitation. NIPHM's gummosis entry gives only variety and rootstock choice; the cut-into-healthy-wood step is from its silver-leaf canker entry (p.26). No chemical: the HP schedule's copper oxychloride + streptocycline is for peach and plum, streptocycline is banned, and copper oxychloride has no cherry claim. NIPHM gives only variety and rootstock choice | NIPHM p.23, p.26, pp.40–41; HP schedule p.2 (other crops) |
| C3 | `leaf_spot` | **Small brown or purple spots on leaves that fall out, leaving shot holes; spotted fruit** (title: "Clear spotted leaves and twigs against shot hole") | <ul><li>Rake up and burn or bury fallen spotted leaves and fruit.</li><li>Water at the base, never over the leaves.</li><li>After leaf fall, cut out twigs and buds with spots and paste the cuts (Q5).</li></ul> A 1% Bordeaux dormant spray is **held (Q5)**: no cherry source gives one. | **(held, Q6)** Captan 50% WP 2.5 g per litre (brown rot) or zineb 75% WP 2 g per litre (leaf spot). Labelled for cherry, but the label gives no waiting days | **open (Q6)** | NIPHM p.26, p.27, p.28, p.39, p.42; MUP-F p.4, p.43 |
| C4 | `aphids` | **Curled new leaves with clusters of small green insects underneath; sticky leaves** (title: "Bring in ladybirds against aphids") | <ul><li>Hang yellow sticky traps in the tree.</li><li>Ask the KVK for ladybird beetles (30–50 adults per infested tree) or lacewing larvae (10–20 per tree) to release.</li><li>Don't spray, so that the ladybirds and parasites survive.</li></ul> | — | OK. No chemical: MUP-I has no cherry row. NSKE (neem) dropped (no claim, neem precedent). SKUAST-J's chlorpyriphos, dimethoate, methyl demeton and formothion dropped | NIPHM p.23 (4–5 traps per acre), p.24, p.34 |
| C5 | `stem_borer` | **Holes in the trunk or main branches with sawdust-like frass, gum or dieback** (title: "Clean out stem borer holes and plug them") | <ul><li>Clean each hole with a flexible wire to kill the grub.</li><li>Plug the hole with mud or cow dung.</li><li>Wrap the exposed trunk in dry grass or a gunny bag from March to October.</li></ul> | — | OK. NIPHM's "once a month from March to October" for the wrap is unclear as a month rule, so it is kept here rather than as a reminder. NSKE dropped. SKUAST-J's lindane and endosulfan (banned) dropped | NIPHM pp.24–25, p.31 |
| C6 | `shot_hole_borer` | **Many pin-sized holes in the bark of weak or old limbs** (title: "Remove wood riddled with pin-hole borer") | <ul><li>Cut out and burn infested limbs before growth starts in spring.</li><li>Never stack prunings or logs near the tree; beetles fly from them.</li><li>Remove a tree that is badly infested.</li><li>Keep the tree vigorous: feed, water and guard against sunburn.</li></ul> | — | OK | NIPHM p.25, p.32 |
| C7 | `hairy_caterpillar` | **Hairy caterpillars on the trunk or eating leaves** (title: "Trap hairy caterpillars under a sacking band") | Tie a band of sacking (burlap) round the trunk. From May to the end of June, collect the caterpillars and cocoons that gather under it and destroy them in kerosene water | — | OK. It is a regional pest (Kashmir willow defoliator) | NIPHM p.8, p.25 |
| C8 | `deadwood` | **Dead, broken, crossing or silvered branches, or leaves with a silvery sheen** (title: "Cut out dead, silvered and crossing branches") | <ul><li>Cut close to the branch with no stub, into healthy wood below any silvering.</li><li>Paste cuts over 1.5 cm across with 10% Bordeaux paste (rule 2.3, Q5).</li><li>Burn or bury what you cut.</li><li>Wear gloves.</li></ul> | — | OK. This stands in for dormant pruning, which has no month in any source (Q4). NIPHM's "white lead paint" is replaced by Bordeaux paste (Q5) | NIPHM p.23, p.26 |
| C9 | `collar_rot` | **Bark at the trunk base dark, soft or peeling; the tree yellows and declines** (title: "Keep water off the trunk base against collar rot") | <ul><li>Keep water from standing at the trunk; give shorter, more frequent waterings.</li><li>Scrape out the rotten bark at the collar and paint the wound with Bordeaux paste (Q5).</li></ul> | — | **open (Q5)** for the paste: Bordeaux paint on collar wounds is from the HP schedule for **peach and plum**. No source gives a Bordeaux **drench** for cherry, so none is drafted. The HP schedule's mancozeb drench has no cherry claim | NIPHM pp.26–27; HP schedule p.3, note 7 (other crops) |

All C rows: stages young + bearing, except C1, which is bearing only.

**Removed with no replacement:**
- **Fruit fly:** NIPHM's cherry pest list (pp.8–9) does not include it. The only Indian "cherry fruit fly" line found sits in SKUAST-J's apricot section, with endosulfan, dimethoate, chlorpyriphos, malathion and dichlorvos (banned or no claim). Not drafted (Q7).
- **Whitewash on the trunk** against sunburn and winter injury (NIPHM p.23): no month, and not something the gardener sees first. It could go on the plant page as a general note.
- **Bee colonies at bloom** and **bird perches** (NIPHM p.23): orchard scale.
- **Root borer, white root rot, powdery mildew, crown gall, ringspot virus:** NIPHM gives only orchard-scale or nursery steps, so they are not needed for a home tree.

## 4. Label claims checked (MUP to 30.09.2026), cherry only

| Product | Claim | Dose on label → per litre | Waiting days | Used? |
|---|---|---|---|---|
| Captan 50% WP (MUP-F p.4) | brown rot | 2.5 kg in 750–1000 L → **2.5–3.3 g/L** | "–" (none given) | no, held (Q6) |
| Captan 75% WP (MUP-F p.4) | brown rot | 0.12% → **1.6 g/L** (15–20 L per tree) | NA | no, held (Q6) |
| Zineb 75% WP (MUP-F p.43) | leaf spot | 1.5–2 kg in 750–1000 L → **2 g/L** | none given | no, held (Q6) |
| Lime sulphur 22% SC (MUP-F p.17) | leaf spot | 2–5 L/ha, no water volume → no per-litre dose | none given (3 sprays: petal fall, 2 weeks later, after harvest) | no (no per-litre dose) |
| Gibberellic acid technical 90% (MUP-PGR p.5) | sweet cherry, spray when >60% of buds have opened | 40–80 ppm | – | no (fruit-set PGR, not a home step) |
| MUP-I insecticides; bio-insecticides; bio-fungicides | **no cherry entry** | | | — |

Banned check (unresolved, but it doesn't matter while Q6 holds these products):
- Captan and zineb are among eight older pesticides left out of the 2023 draft prohibition order (S.O. 701(E), countercurrents.org).
- No source seen lists them among the final S.O. 4294(E) (3 Oct 2023) bans.
- The HP schedule's 2022 note calls captan "proposed to be banned" under the 2020 draft.
- Neither the official CIB&RC list nor the Wikipedia list was read. Confirm both before any of these products ships.

## 5. What the check changed
1. **HILLS_COOL kept pending.** No SKUAST-K, CITH, YSPUHF or GBPUAT cherry package was reached. The national NIPHM package gives only December and April.
2. **N splits, netting and harvest held.** Each depends on a flowering or ripening month that no guide gives (Q3, Q4).
3. **Dose open.** NIPHM's table is banded. Its fertiliser columns are exactly linear, but its FYM column is not (Q2).
4. **"White lead paint" on cuts removed** (NIPHM p.23). It is lead. Bordeaux paste is proposed instead (Q5).
5. **NIPHM p.46 harvest text not used.** It describes strawberries.
6. **Cracking chemicals dropped:** GA₃ and CaCl₂ (SKUAST-K trials) have no cracking claim.
7. **Chemicals dropped:**
   - no cherry claim, or banned: chlorpyriphos, dimethoate, methyl demeton, formothion, malathion, endosulfan, dichlorvos, lindane (SKUAST-J apricot section); copper oxychloride, streptocycline (banned), mancozeb, carbendazim, oxydemeton-methyl and dormant oil (HP schedule, other crops);
   - labelled but held: captan, zineb and lime sulphur, which have no waiting days or no per-litre dose (Q6).
8. **NSKE (neem) removed** from borer and aphid rows: no claim (neem precedent).
9. **H4 trunk-gap clause dropped:** not in the source.
10. **Fruit fly** not drafted: not in NIPHM's cherry pest list (Q7).

**Row tally**

| Group | Rows | OK | Corrected | Open/held |
|---|---|---|---|---|
| HILLS_COOL calendar (H1–H5, pending) | 5 | — | 1 (H4) | 4 (H1 dose Q2; H2, H3 Q3; H5 Q4) |
| Conditionals (C1–C9) | 9 | 6 | 1 (C1) | 2 (C3 chemical Q6, C9 paste Q5) |
| **Total** | **14** | **6** | **2** | **6** |

Phases: 1 row (`winter_bare`), sourced.

## Source links
- NIPHM AESA IPM Cherry: https://niphm.gov.in/IPMPackages/Cherry.pdf (pp.8–9 pests; pp.22–28 stage-wise IPM; p.24 dose table; pp.31–42 descriptions; p.46 strawberry text, not used)
- SKUAST-J PoP Sub-tropical and Temperate Fruits: https://skuast.org/newsite/pdf/1646993736package.pdf.pdf (returns HTTP 500; read from the Wayback copy https://web.archive.org/web/2024id_/https://skuast.org/newsite/pdf/1646993736package.pdf.pdf; pp.5–7, apricot pp.104–108)
- HP/YSPUHF Spray Schedule 2022, Peach, Plum, Apricot & Almond: https://eudyan.hp.gov.in/UploadedFiles/sprayshedule/new-spray-schedules-for-stone-fruits.pdf (pp.2–4)
- HP Horticulture Development Society, package of practice list: https://hds.hp.gov.in/Package_of_Practice.aspx (Stone fruit and walnut, English: https://hds.hp.gov.in/UploadedImages/TenderDocument/StoneFruitEnglish.pdf, no cherry text extracted)
- eUdyan publications (cherry phytoplasma leaflet, not read): https://eudyan.hp.gov.in/cms/en/publication
- SKUAST-K cracking survey (HortFlora Research Spectrum 2014): https://www.semanticscholar.org/paper/Rain-induced-fruit-cracking-in-sweet-cherry-(Prunus-Khan-Rather/69cdf2833d2fb297610eb9ef681e8a2f384768d0
- SKUAST-K cracking review: https://www.researchgate.net/publication/284291438_Review_on_rain_induced_fruit_cracking_of_sweet_cherries_Prunus_avium_L_its_causes_and_the_possibilities_of_prevention
- Ban status of captan and zineb (draft-order note, from search only): https://countercurrents.org/2023/03/draft-notification-on-insecticides-unsatisfactory; to confirm: https://en.wikipedia.org/wiki/List_of_banned_and_restricted_pesticides_in_India
- MUP (CIB&RC): https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides
  - fungicides: https://ppqs.gov.in/sites/default/files/Fungicide%20MUP%20%20as%20on%2030.09.2026.pdf (pp.4, 17, 43)
  - PGR: https://ppqs.gov.in/sites/default/files/5.%20PGR%20MUP%20as%20on%2030.09.2026.pdf (p.5)
  - insecticides, bio-insecticides, bio-fungicides: no cherry entry
- Not reached: https://cith.icar.gov.in (ENOTFOUND); https://krishi.icar.gov.in and https://kvk.icar.gov.in (NXDOMAIN or ENOTFOUND); http://hortikashmir.gov.in (refused); Vikaspedia cherry IPM (no text)

## 6. Open questions for the owner
- **Q1. Keep HILLS_COOL in `pendingRegions`?** No regional cherry package was reached, and the national NIPHM package gives two months only.
  - Recommendation: **keep it pending.** Ship C1–C9 if the engine shows conditionals for a pending region. Retry CITH and SKUAST-K (or the J&K horticulture spray schedule) when they are reachable.
- **Q2. Dose for H1 (and the CAN splits):** NIPHM's table is banded.
  - Its CAN, SSP and MOP columns are exactly 200, 160 and 100 g × age, capped at 10 years.
  - Its FYM column is not linear (10–20, 25–35, 35–50, then 60 kg).
  - Recommendation: **accept the linear fertiliser rule** (SSP 160 g + MOP 100 g × age in December, `together: true`; CAN 100 g × age per split; cap 10 years). **Hold FYM** as a per-year dose. Either take 5 kg × age capped at 10 years (50 kg, below NIPHM's 60), or give the FYM in the text without a `dose` until a regional rule is found.
- **Q3. N split timing:** "2–3 weeks before flowering, and a month later" needs a bloom month. Recommendation: **hold H2 and H3** until CITH or SKUAST-K gives a flowering month. Don't guess March or April from news reports.
- **Q4. Netting, harvest and dormant pruning months:** no guide gives them. News reports put picking from mid-May (Makhmali, Double) to early June (Mishri), running into early July.
  - Recommendation: **hold H5 and any harvest or pruning reminder**. Keep pruning on the plant page (C8). Revisit with CITH variety maturity data.
- **Q5. Bordeaux on cherry:** no cherry guide recommends it. NIPHM's own cut dressing is white lead paint, which is unsafe and must go. The HP/YSPUHF schedule uses Bordeaux paint on wounds for peach and plum. No source gives a 1% dormant Bordeaux spray or a Bordeaux soil drench for cherry.
  - Recommendation:
    - **allow the 10% paste on cuts and scraped cankers** (C2, C3, C8, C9) as the stone-fruit borrow, citing the HP schedule and pomegranate rule 2.3;
    - **leave out the dormant spray and the drench** until a cherry source gives them.
- **Q6. Labelled fungicides without waiting days:** captan 50% WP (2.5 g/L) and zineb 75% WP (2 g/L) carry cherry claims, but their labels give no waiting period. Lime sulphur gives no per-litre dose.
  - Recommendation: **don't ship them.** The standard requires waiting days. If the owner wants a chemical for leaf spot, allow zineb only when no fruit is on the tree (after harvest).
- **Q7. Fruit fly:** the brief lists it, but NIPHM's cherry pest list does not, and the only Indian line (SKUAST-J, apricot section) uses banned or unlabelled chemicals. Recommendation: **leave it out.** C1's "pick ripe fruit promptly and remove split fruit" covers the sanitation.
- **Q8. Kinds:** Stella and Mishri share one care set; no source gives either its own calendar. Mishri is the most cracking-prone (SKUAST-K survey). Recommendation: no kinds. Mention Mishri's cracking in C1, as drafted.

Status: Draft + source check, awaiting owner review — nothing written to data.
