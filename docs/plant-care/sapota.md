# Sapota care: final for owner review (2026-11-12)

Sapota is also called chikoo. Every row has been checked against the sources below. It still needs the owner's yes before it goes into `care/sapota.ts`.

## What changed in the final pass
- Pending regions named (below). West, K (coastal) and S (South Deccan) ship. Each has its own dated source: NAU and NHB-6 for West, NHB-6 and DBSKKV-22 for K (Konkan), TNAU for S. No shipping region is a copy of another.
- **Dose re-checked and cut.** TNAU's per-age P and K reach 1 kg P₂O₅ and 1.5 kg K₂O at the cap. NHB-6 gives 500 g of each at maturity. No ICAR institute gives a usable dose, so the lower dose is used. NHB-6 isn't per year of age, so P and K are now row text (a flat mature-tree amount). N stays per year of age from TNAU, which agrees with NHB-6 at maturity. FYM stays per year of age from TNAU.
- Removed Y2 (young-tree watering). Its windows were inferred from the monsoon, not quoted. The intervals move to the plant page, with no dates.
- "Wear gloves" added to the zinc sulphate + boric acid spray.
- Removed the neem seed kernel extract (NSKE 5%) spray from rows 3 and 4 and the plant page. It is a spray with no waiting days, and neem (azadirachtin) has no sapota claim; guava and litchi dropped neem for the same reason. The hand-picking stays.

Pending regions (keep today's advice): NORTH_INDIA, EAST_INDIA, CENTRAL_INDIA (no sapota source with dates). HILLS_COOL is not listed as a growing region, as for mango.

Sources:
- **TNAU**: TNAU Agritech, sapota: https://agritech.tnau.ac.in/horticulture/horti_fruits_sapota.html
- **NHB-n**: NHB sapota pages, https://nhb.gov.in/pdf/fruits/sapota/sap00n.pdf (each one page): NHB-2 diseases, NHB-3 harvesting, NHB-4 intercultural and pruning, NHB-5 irrigation, NHB-6 manuring (Maharashtra Dept. of Agriculture schedule), NHB-7 pests, NHB-8 post-harvest, NHB-9 planting, NHB-11 soil and climate. NHB-12 varieties is at https://nhb.gov.in/pdf/fruits/sapota/sap012.pdf.
- **NIPHM**: DPPQS/NIPHM AESA-based IPM Package, Sapota (IIHR and Dapoli among the reviewers): https://www.niphm.gov.in/IPMPackages/Sapota.pdf. Page numbers are the printed ones.
- **NAU-1 / NAU-2 / NAU-5**: Navsari Agricultural University, ICAR-AICRP (Fruits), FRS Gandevi, Sapota Pest Fact Sheets (2022):
  - NAU-1, bud borer: https://nau.in/assets/uploads/cef8a-1.-bud-borer.pdf
  - NAU-2, chiku moth: https://nau.in/assets/uploads/c474f-2.-chiku-moth-leaf-webber.pdf
  - NAU-5, fruit fly: https://nau.in/assets/uploads/04a6a-5.-fruit-fly.pdf
- **DBSKKV-22**: Dr BSKKV Dapoli, Research Recommendations 2022, p.1–2, sapota cv. Kalipatti, North Konkan: https://www.dbskkv.org/assets/pdf/recommendations/Joint%20Agresco-2022%20English%20Recommendations.pdf
- **MUP**: CIB&RC Major Uses of Pesticides, 30.09.2026, from https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides. All four lists were searched: insecticides (108 pp), fungicides (91 pp), bio-insecticides and bio-fungicides. None has an entry for sapota, sapodilla or chiku, and none has a generic "fruit crops" claim.
- KAU's package (pop.kau.in) failed on its certificate, and the intranet PDF returned 403. KAU's celkau.in site has no sapota pages.

**No pesticide alternatives.** Sapota has no label claim in any MUP list, so every pest and disease row is organic or cultural only. That is also why no row gives waiting days before picking: there is no label to take them from. Every pesticide the sources name is listed under "Removed as not approved" at the end. Fertilisers (urea, SSP, MOP) aren't on the CIB&RC lists; they sit in the "Or" column of the feed rows, as in mango.

Groups:
- **West (WEST_INDIA)**: Gujarat, inland Maharashtra, Rajasthan.
- **K (COASTAL_HUMID)**: Konkan (Palghar/Dahanu chikoo belt, Thane, Raigad, Ratnagiri, Sindhudurg), Goa, coastal Karnataka, Kerala.
- **S (SOUTH_DECCAN)**: Tamil Nadu, Andhra Pradesh, Telangana, interior Karnataka.

West and K share the feeding timing. The NHB-6 schedule comes from Maharashtra's Dept. of Agriculture, which covers both inland Maharashtra and Konkan, and it is tied to monsoon onset. DBSKKV-22 (a North Konkan SAU) also feeds in June and September. K is not `sameAs` West, though: pest-peak months exist only for South Gujarat (NAU), so the bud borer and moth rows are West-only. For K and S they are plant-page items.

S gets its own feeding timing, because TNAU feeds once, in September–October. Kerala, Goa and coastal Karnataka windows are carried over from the Maharashtra and Konkan sources; no Kerala source was readable. K still ships: its windows are dated by Konkan sources (NHB-6, DBSKKV-22), as mango's coastal group ships on Konkan and coastal AP/TN sources. Owner to note: Kerala, Goa and coastal Karnataka gardeners get Konkan dates.

## NEEDS PER-TREE TIMING
- Sapota flowers and fruits almost all year (NHB-11). NAU ties its sprays to each orchard's "peak flowering" (NAU-1, NAU-2) and its traps to "fruit-set to harvest" (NAU-5).
- Picking depends on each fruit's maturity: the scurf turns dull brown, the skin shows no green under a scratch, and there is no latex (NHB-3, TNAU). No source gives region harvest months, only "Kalipatti: main picking season winter" (NHB-12).
- Shading a newly planted graft from heat (NHB-9) is timed from planting, so it waits for per-tree timing and isn't a reminder yet.
- So harvest has no reminder, and only West, the one region with published pest months, gets calendar pest rows.

## Bearing reminders
| # | Reminder | West | K | S | Organic | Or | Why | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Feed at the start of the monsoon | Jun 15–Jul 15 | Jun 1–Jul 15 | — | All the year's FYM, spread under the canopy and mixed into the top 30 cm | Half the year's urea in the same place; for a bearing tree also SSP 1560 g + MOP 415 g; water in | The tree grows and fruits non-stop and needs a lot of food; most feeder roots are in the top 30 cm | NHB-6; DBSKKV-22 p.1 (June) |
| 2 | Feed after the monsoon | Sep 1–Oct 31 | Sep 1–Oct 31 | Sep 1–Oct 31 | S only: the whole year's FYM, in a band from 45 cm off the trunk out to the drip line, mixed into the soil | West/K: the other half of the urea; for a bearing tree also SSP 1560 g + MOP 415 g. S: the whole year's urea, same band; for a bearing tree also SSP 3125 g + MOP 833 g. Water in | Last feed before the dry months | NHB-6; TNAU; DBSKKV-22 p.1 (September) |
| 3 | Pick off bored buds and webbed shoots | Mar 1–Jun 30 | — | — | Pick and destroy webbed clusters and bored buds (milky tip, droppings on top), caterpillars inside | — | Bud borer and chiku moth peak in April–June and can kill 20–30% of buds | NAU-1; NAU-2; NIPHM p.24 |
| 4 | Clear webbed leaves on the new flush | Nov 1–Dec 31 | — | — | Pull off and destroy fresh webbed leaf clusters with caterpillars, and dried old webs | — | Chiku moth's second peak is on the winter flush and fruit | NAU-2 |
| 5 | Hang a fruit fly trap, bag fallen fruit | Apr 1–Jun 30 | Mar 1–Jul 31 | Mar 1–Jul 31 | One methyl eugenol trap per tree, 5–6 ft up. Pick up fallen fruit, tie it in a polythene bag for 4–5 days, then discard. Don't dump it on soil | — | Maggots rot the ripe fruit; the fly peaks March–July (April–June in South Gujarat) | NAU-5; NHB-7; NIPHM p.25 |
| 6 | Thin crowded and crossing branches | Dec 1–Jan 31 | Dec 1–Jan 31 | Dec 1–Jan 31 | Cut out crowded, crossing and low branches, water shoots and any rootstock sprouts | — | Flowers and fruit form on branches that get the most light and air | NHB-4 ("winter"); TNAU; NAU-2 |

Dose (rows 1–2, and Y1).

**The rule.** ICAR institute first; where equally authoritative sources differ, the lower dose. No ICAR institute dose was reached: NIPHM (DPPQS, IIHR among the reviewers) gives age bands only. TNAU and NHB-6 (Maharashtra Dept. of Agriculture) are compared:
- N: TNAU 200 g per year of age to 1 kg at 5 years; NHB-6 reaches 1 kg at maturity. They agree at maturity, and TNAU is the lower of the two in the early years (NHB-6 starts at 300 g, then 450 g, 600 g). TNAU's per-age N is used.
- P and K: TNAU reaches 1 kg P₂O₅ and 1.5 kg K₂O at 5 years. NHB-6 gives 500 g of each at maturity. NHB-6 is lower, so it is used. It gives no per-age figure, so P and K are a flat mature-tree amount given as row text, not a per-age dose.
- FYM: TNAU's 10 kg per year of age (no lower figure in the sources).

Per year of age, up to 5 years (the cap age; TNAU's "6th year onwards" = 5 × the yearly step):
- FYM 10 kg
- N 200 g → urea 200 ÷ 0.46 = **435 g**

Flat, for a bearing tree (row text; NHB-6 at maturity):
- P₂O₅ 500 g → SSP 500 ÷ 0.16 = **3125 g** a year
- K₂O 500 g → MOP 500 ÷ 0.60 = **833 g** a year

TNAU writes "P" and "K"; NHB-6's figures are also read as P₂O₅ and K₂O.

| Region | When | What |
|---|---|---|
| S | Sep–Oct, one dose | All FYM + urea 435 g × age. Bearing tree: also SSP 3125 g + MOP 833 g |
| West/K | June | All FYM + urea 217 g × age. Bearing tree: also SSP 1560 g + MOP 415 g |
| West/K | Sep–Oct | Urea 217 g × age. Bearing tree: also SSP 1560 g + MOP 415 g |

Examples:
- A 3-year-old: 30 kg FYM; urea 1305 g for the year.
- From age 5 (the cap): 50 kg FYM; urea 2175 g for the year; plus SSP 3125 g + MOP 833 g for a bearing tree.

The old cap (SSP 6250 g + MOP 2500 g a year) is gone. It was 2× NHB-6's P and 3× its K.

Owner to note: with P and K flat, young trees (Y1) get no P or K figure. Neither source gives a per-age P and K that passes the lower-dose rule.

Plant page only (never reminders):
- K and S, if you see webbed leaves, or buds with a hole, a milky tip and droppings (bud borer, chiku moth): do row 3 (pick off and destroy). (NIPHM p.24; NAU-1; NAU-2)
- If leaves and fruit get a black coating (sooty mould, which grows on honeydew from mealybugs and scales): boil 1 kg maida or starch in 5 L water, cool, dilute with 20 L water and spray. Not in cloudy weather. (TNAU; NHB-2)
- If you see white mealybug colonies under leaves or at fruit stalks, or green scales: cut off and destroy the infested twigs. (NIPHM p.24; NHB-7)
- If branches turn flat, ridged and twisted at the tip (fasciation): cut off and destroy those shoots. (NHB-2)
- If young leaves show deficiency signs at flowering: spray zinc sulphate 5 g + boric acid 1 g per litre. Wear gloves; it is a nutrient spray, so there is no waiting period. (NIPHM p.24)
- Watering a young tree: every 6–7 days in summer, every 8–10 days in winter. Widen the basin as the canopy grows; mulch. (NHB-5; TNAU)
- Picking: pick when the brown scurf turns dull yellowish-brown, a scratch shows no green, and there is little latex at the stalk. Wash off latex, dry in shade. Fruit picked too early stays poor; picked late, it softens fast. (NHB-3; NHB-8; TNAU)
- Above 43°C flowers drop. (NHB-11)
- Newly planted graft: shade it from the sun with grass or a plastic sheet, and keep it staked. (NHB-9; timed from planting, see NEEDS PER-TREE TIMING)

## Young trees (first 3 years; fruiting starts from year 3, NHB-3)
| # | Reminder | West | K | S | What | Source |
|---|---|---|---|---|---|---|
| Y1 | Feed the young tree | Jun 15–Jul 15 + Sep 1–Oct 31 | Jun 1–Jul 15 + Sep 1–Oct 31 | Sep 1–Oct 31 | FYM and urea per year of age (above), in a band 45 cm from the trunk out to the drip line | TNAU; NHB-6 |
| Y3 | Shape the young tree, remove sprouts | Dec 1–Jan 31 | Dec 1–Jan 31 | Dec 1–Jan 31 | Remove sprouts from below the graft joint, water shoots, crossing and low branches; thin overcrowding | NHB-4; NHB-9; TNAU |

Rows per group: bearing West 6 (1–6), K 4 (1, 2, 5, 6), S 3 (2, 5, 6); young 2 in each group (Y1, Y3). Y2 was removed (see "Removed as unverified"), so Y3 keeps its number.

Month check (at most 3 a month): West June has 1, 3 and 5; West Dec has 4 and 6. K and S never pass 2. The app's cap drops nothing.

## Phases (bearing)
| Phase | West | K | S | Avoid | Watch |
|---|---|---|---|---|---|
| peak_flowering_and_summer_fruit | Mar–Jun | — | — | Letting the soil dry out (above 43°C flowers drop) | Bud borer, chiku moth on buds, fruit fly (peak Apr–Jun) |
| monsoon_growth | Jul–Oct | — | — | Waterlogging | Leaf miner (rainy season), leaf spot |
| winter_flush_and_picking | Nov–Feb | — | — | Leaving ripe fruit to soften on the tree | Chiku moth on the new flush (Nov–Dec), mealybug, sooty mould |
| year_round_bearing | — | Jan–Dec | Jan–Dec | Picking unripe fruit (green under a scratch, much latex) | Leaf webber, bud worm, fruit fly (peak Mar–Jul), mealybug, sooty mould |

Sources: NAU-1, NAU-2, NAU-5 (West); NHB-7, NHB-11, NHB-12 (Kalipatti main picking in winter); NHB-3.

## Removed as not approved
- **No sapota label claim (MUP 30.09.2026), so out:**
  - phosalone, chlorpyriphos, quinalphos, phosphamidon, carbaryl (TNAU)
  - monocrotophos, Metasystox (methyl demeton), malathion, Dithane Z-78 (zineb), Topsin, Bavistin (NHB-2, NHB-7)
  - lambda-cyhalothrin, profenophos + cypermethrin, and the azadirachtin brands neemazol and nimbecidine (NAU)
  - copper oxychloride, Bordeaux paste, endosulfan (Vikaspedia calendar)
  - Some of these are also banned or restricted.
- **Recipes with a pesticide inside:** NAU's tulsi-leaf bud borer trap (2 ml dichlorvos) and NHB-7's tulsi/dichlorvos bait trap; NAU's "Nauroji-Stonehouse" plywood block (malathion or deltamethrin in the lure). Row 5 uses a plain methyl eugenol trap instead.

## Not used
- **Not used for the dose:**
  - NIPHM p.23–24 gives age bands (1–3, 4–6, 7–10, 11+ years), which the content standard forbids.
  - DBSKKV-22's "80% RDF (3:3:3 kg NPK/tree)" in four splits is ambiguous and about 3 × TNAU's N; it conflicts and is used for timing only.
  - NHB-6's table isn't proportional to age (above).
- **Not sized for a home tree:** releasing 20 Cryptolaemus beetles per tree (NIPHM p.24); light traps per acre (NAU, NIPHM).
- **NAU's 20-day spray interval:** it spaces a sequence of three products (neem, then two insecticides), so it was never used. Row 3 now has no spray.
- **Lure-change interval:** NAU's "2–3 months" is for its pesticide-loaded plywood block, so row 5 gives none. Mango's "every 2–3 weeks" is for mango; not checked for sapota.

## Removed as unverified
- **Final pass, removed as a spray with no waiting period:** neem seed kernel extract 5% (TNAU) in rows 3 and 4 and the K/S plant-page line. There is no azadirachtin claim for sapota.
- **Final pass:** Y2, "Water the young tree" (West Nov 1–Jun 15, K Dec 1–May 31, S Jan 1–May 31). The windows were inferred from the monsoon and hot months; the sources give only the intervals, which are on the plant page.
- **Final pass:** TNAU's per-age P and K (200 g P₂O₅ and 300 g K₂O × age; cap SSP 6250 g + MOP 2500 g a year). They are above NHB-6's mature-tree dose, so the lower-dose rule drops them.
- The "two harvest seasons" (Jan–Feb + May–Jun, or Mar–May + Sep–Oct, or Feb–Apr + Aug–Oct), from agrifarming, krishijagran, Scribd and similar. Not from an ICAR or SAU source.
- NIPHM p.25's "harvest in January" (no region, contradicts year-round bearing).
- Pest peak months for Kerala, Tamil Nadu and Karnataka.
- Seed borer clean-up "till November" (NIPHM p.25, no start month).
- The Vikaspedia month-by-month calendar (secondary; recommends endosulfan).
- All KAU sapota content (site unreachable).
