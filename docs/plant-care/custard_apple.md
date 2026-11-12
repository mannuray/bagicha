# Custard apple (sitaphal) care — verified (source check 2026-11-12)

NOT SHIPPING: waits for per-tree (bahar) timing; kept as research.

Sources:
- **MPKV**: MPKV Rahuri, AICRP on Arid Zone Fruits (Fig and Custard apple), Jadhavwadi. Centre profile with recommendations; Joint Agresco 2022 custard apple recommendation on p.6. https://mpkv.ac.in/Uploads/Research/20260819_094300_33d47fd4e1237855bc4df95a846d9625.pdf
- **CIAH**: Yadav, Singh, Hiwale, Singh & Sharma (ICAR-CIAH / CHES Godhra), "Thar Amrit: a new high-yielding custard apple variety for dryland", *Indian Horticulture*, May–June 2023, pp. 11–13. Includes a production-technology section for rainfed semi-arid western India. https://epubs.icar.org.in/index.php/IndHort/article/download/126236/51042/472737
- **IIHR**: Chander, Kurian, Satisha, Upreti & Laxman (ICAR-IIHR Bengaluru), "Advancing fruiting season in Annona cv. Arka Sahan through pruning", *J. Hortl. Sci.* 17(2): 316–324, 2022. https://jhs.iihr.res.in/index.php/jhs/article/view/1434
- **IH20**: Choudhary & Meena, "Benefits of pruning in custard apple", *Indian Horticulture*, Jul–Aug 2020, pp. 38–40 (case study at College of Agriculture Dhule, MPKV). https://epubs.icar.org.in/index.php/IndHort/article/download/107289/42258/277995
- **NIPHM**: DPPQS/NIPHM, "AESA based IPM package – Custard apple". Printed page numbers. https://niphm.gov.in/IPMPackages/CustardApple.pdf. Caution: parts are pasted from other crops (its harvest section, p.45–46, is brinjal text) and its fertiliser tables contradict each other. Cited only where it is plainly about custard apple, and never for harvest.
- **TNAU**: TNAU Agritech, Minor fruits: Annona. https://agritech.tnau.ac.in/horticulture/horti_fruits_minorfruits.html
- **MUP**: CIB&RC Major Uses of Pesticides, up to 30.09.2026 (insecticides, fungicides, biopesticides). https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides

**MUP 30.09.2026: no label claim for custard apple / sitaphal / Annona** in any of the insecticide, fungicide or biopesticide lists. So there are **no chemical alternatives** in this file, and no copper, sulphur, neem or oil sprays either: these are all registered pesticides. Every pest and disease line is cultural or mechanical.

Groups: **M = WEST (base) · SOUTH_DECCAN sameAs WEST · CENTRAL sameAs WEST · EAST sameAs WEST.**
Why: an unregulated, rainfed custard apple runs on the monsoon, not on a regional calendar. In western India it sheds its leaves Apr–Jun. It flowers on new shoots once the rains come (Jul–Aug in semi-arid western India) and ripens 85–90 days after fruit set (CIAH p.11–13). The sources give monsoon-tied timing only; none gives region-specific months.
Caveats:
- SOUTH_DECCAN's only dated source is IIHR's Arka Sahan hybrid in Bengaluru, harvested Aug–Sep. That is a hybrid, so it is not used as the regional window.
- No Central (JNKVV) or East (BAU/OUAT) custard apple package was found.
- These three groupings are inferences. In particular, the start of the monsoon (Deccan early June, Central late June) is absorbed by the wide row-2 window.

## NEEDS PER-TREE TIMING
Much of this crop's care depends on the grower's choice, not the calendar. These items need a per-tree anchor (`FROM_CHOICE`) and are **not** in the calendar rows below:
- **Feeding tied to bahar** (MPKV p.6, Joint Agresco 2022). Give half the N + all the P and K "at the time of bahar", and the other half of the N one month after bahar. In Maharashtra, growers who irrigate choose when to take bahar. → `FROM_CHOICE {choice: 'bahar', fromDays: 0}` and `{fromDays: 30}`.
- **Post-harvest pruning**: 45–60 days after the last fruit is picked. Light pruning takes 20–30 cm of tip, about 30% intensity (best in the Dhule trial). In subtropical areas where harvest ends late Nov–mid Dec, prune in the first week of Feb. Follow with feed and light irrigation. (IH20 p.38–40) → `FROM_CHOICE {choice: 'harvest_end', fromDays: 45, toDays: 60}`.
- **Pruning to shift the crop**: cutting back 75% of last season's growth in the first week of October brought the Arka Sahan harvest forward 8–9 weeks, to June. (IIHR p.316)
- **Manual defoliation in mid-summer** to bring on new growth early. (NIPHM p.23)
- **Irrigation of regulated trees**: follows the chosen bahar; no source gives calendar dates.

The calendar rows below are for a **rainfed home tree that is not regulated**, where the monsoon is the bahar.

## Bearing reminders
| # | Reminder | M (West; Deccan, Central, East sameAs) | Organic / cultural | Or | Why | Source |
|---|---|---|---|---|---|---|
| 1 | Remove dry, dead and crossing branches | May 1–Jun 15 | Cut out dry, dead, diseased and crossing branches and any dried fruit left on the tree; burn them. | — | Flowers come on new shoots; dead twigs and old fruit carry anthracnose | CIAH p.13; NIPHM p.24, 26 |
| 2 | Give the main feed as the rains start | Jun 1–Jul 10 | 6 kg vermicompost in a ring at the canopy edge, away from the trunk; water lightly; then mulch the basin 8 cm deep with dry leaves | Half the urea + all the SSP + all the MOP in the same ring | Feeds the new shoots that carry this year's flowers | MPKV p.6; NIPHM p.25, p.24 (mulch); IH20 p.40; CIAH p.12 |
| 3 | Give the second feed | Jul 1–Aug 31 | — | Other half of the urea in the ring, about a month after row 2 | Feeds fruit set. MPKV says one month after bahar; CIAH splits in early Jul and late Aug | MPKV p.6; CIAH p.12 |
| 4 | Bury fallen fruit and hang a fruit fly trap | Aug 15–Nov 30 | Pick up fallen and maggoty fruit every few days and bury it deep; hang a methyl eugenol trap in the tree (a lure in a trap, not sprayed on the tree) | — | Fruit fly maggots spoil semi-ripe fruit, worst when ripening meets the rains | NIPHM p.25; IIHR p.316 |
| 5 | Pick fruit as the bumps turn yellow | Sep 1–Dec 15 | Pick by hand when the bumps on the skin turn from green to yellow and spread apart; don't bruise or drop them. Fruit is ready 85–90 days after set | — | Mature fruit ripens off the tree in a few days; bruised fruit spoils fast | CIAH p.12–13; IH20 p.39 |

Dose (rows 2–3): **a flat dose for a full-grown tree, not per year of age.** No source found gives a per-year-of-age rate for custard apple.
- MPKV p.6 (Joint Agresco 2022) gives, per full-grown tree, N 250 g + P2O5 125 g + K2O 125 g + vermicompost 6 kg. NIPHM p.25 gives the same 250:125:125 g "before the rainy season". TNAU agrees on N and P (250:125:250 g with 10 kg FYM).
- Arithmetic: urea 250 ÷ 0.46 = 543 g; SSP 125 ÷ 0.16 = 781 g; MOP 125 ÷ 0.60 = 208 g.
  - **Row 2:** vermicompost 6 kg + urea 270 g + SSP 780 g + MOP 210 g.
  - **Row 3:** urea 270 g.
- Check: 540 g urea × 0.46 = 248 g N ✓; 780 × 0.16 = 125 g P2O5 ✓; 210 × 0.60 = 126 g K2O ✓.
- Encoding: no `dose` field (it is per year of age, and the plant page would print "per year of age (up to 1)"). Write the flat amounts straight into the row 2 and row 3 text, stage BEARING only. CIAH p.11 says trees reach full canopy at 4–5 years. A tree in its first bearing years gets the full dose, because the sources don't scale it down (owner to confirm).

Conflicts, not used:
- CIAH p.12: 50 kg FYM + 1.0 kg N + 500 g P + 500 g K + 200 g micronutrient mix for a 5-year-old Thar Amrit tree, a 4× higher N rate from a variety article.
- IH20 p.40: an age-banded table (1–2 yr, 3–5 yr, full bearing up to 600 g N); age bands may not be hand-written.
- NIPHM p.23/25: tables of 400–600 g N that contradict its own 250 g line.

Plant page only (never reminders):
- If white mealybugs cover fruit and shoots: pick off and destroy the infested fruit, twigs and leaves; dig the soil under the canopy in November to expose the eggs. (NIPHM p.24–25)
- If fruits have holes with droppings at the entry (fruit-boring caterpillar): pick and destroy them. Bag young fruits on a small tree. (NIPHM p.25, p.35–36)
- If fruit gets dark sunken spots that spread from the blossom end (anthracnose), or leaves get brown ringed spots: remove and burn the spotted fruit, leaves and dead twigs; keep the canopy open and the lowest branches about 50 cm off the ground; mulch to stop soil splash. No fungicide has a custard apple label claim. (NIPHM p.24, 26, 40–41; IIHR p.316)


## Young trees (first 3 years)
| # | Reminder | M (West; Deccan, Central, East sameAs) | What | Source |
|---|---|---|---|---|
| Y1 | Water the young tree through summer | Mar 1–Jun 15 | Years 0–2: water through the hot dry months until the rains (CIAH gives no interval); keep the basin mulched 8 cm deep with dry leaves | CIAH p.12; NIPHM p.24 |
| Y2 | Train to one straight stem | May 1–Jun 15 | Keep a single straight stem; remove crossing branches and extra stems so it doesn't bend into a multi-stem bush in the monsoon | CIAH p.12–13 |

Young-tree feeding: **removed**. No source gives a young-tree or per-year-of-age dose (NIPHM p.22's 300 g mix is for the planting pit only).

## Phases (bearing, rainfed and unregulated)
| Phase | M | Avoid | Watch |
|---|---|---|---|
| leaf_fall | Apr–Jun | Feeding before the rains start (rows 2–3 are timed to the rains) | Dead twigs and dried fruit left on the tree |
| flowering | Jul–Aug | Waterlogging round the trunk | Mealybug on new shoots, leaf spot in humid spells |
| fruit_development | Aug–Oct | Letting fruit touch the ground | Fruit-boring caterpillar, mealybug on fruit |
| harvest | Sep–Dec | Leaving ripe or fallen fruit lying around | Fruit fly, anthracnose when ripening meets rain |
| post_harvest | Dec–Mar | Heavy pruning (see NEEDS PER-TREE TIMING) | — |

Phase sources: CIAH p.11–13; IIHR p.316; IH20 p.39; NIPHM p.24–26.

Removed as unverified:
- Region-specific months for any group (see caveats).
- Harvest windows from NIPHM (brinjal text).
- Irrigation intervals for bearing trees: CIAH says it grows "without irrigation" in semi-arid conditions, and no source gives an interval.
- Flooding the orchard in October against mealybug eggs (NIPHM p.24): single source, not practical for a home tree.
- Ladybird (Cryptolaemus) and parasitoid releases: orchard scale.
- Hot-water dip of fruit (NIPHM p.25). Foliar micronutrient mix for leaf yellowing (zinc sulphate + manganese sulphate + boric acid + urea + lime, NIPHM p.23): single, unreliable source.
- Young-tree fertiliser.

Removed as not approved (no custard apple label claim, MUP 30.09.2026):
- Blitox (copper oxychloride) and Bordeaux mixture on pruning cuts (IH20 p.40). Copper sulphate is a registered fungicide (MUP fungicides p.9, "Copper Sulphate 2.62% SC"). Mango's Bordeaux paste stands only because mango has a copper label claim.
- Dormant or horticultural oil against scale (NIPHM p.24, 26).
- Neem/azadirachtin, any insecticide or fungicide spray, and GA3 (used with pruning in the Bagalkot trial).
