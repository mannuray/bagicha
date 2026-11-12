# Jackfruit care: final for owner review (2026-11-12)

Every row has been checked against the sources below. It still needs the owner's yes before it goes into `care/jackfruit.ts`.

## What changed in the final pass
- Pending regions named (below). E (East), K (coastal) and S (South Deccan) ship. Each has its own dated source: AAU and NIPHM for E, KAU for K, TNAU for S.
- **K (coastal) gets no feeding reminders**, following KAU's "jack is rarely manured". Rows 1–2 and Y1 are gone for K. K keeps row 5 (harvest) and the plant-page items.
- Removed Y2 (young-tree watering). Its windows were inferred from the monsoon, not quoted. The quoted advice moves to the plant page, with no dates.
- Removed the neem-garlic emulsion spray from three plant-page lines. It is a spray with no waiting days, and neem has no jackfruit claim. The cultural steps stay.
- Dose re-checked against the rule. No ICAR institute gives a jackfruit dose. TNAU and NIPHM agree on the per-age dose, so it is unchanged. AAU's flat bearing dose is now given as plant-page text, not dropped.

Pending regions (keep today's advice): NORTH_INDIA, CENTRAL_INDIA, WEST_INDIA (no jackfruit source with dates). HILLS_COOL is not listed as a growing region, as for mango.

Sources:
- **TNAU**: TNAU Agritech, jack: https://agritech.tnau.ac.in/horticulture/horti_fruits_jack.html
- **NIPHM**: DPPQS/NIPHM AESA-based IPM Package, Jackfruit: https://www.niphm.gov.in/IPMPackages/Jackfruit.pdf. Page numbers are the printed ones: p.8 pest list; p.22–26 crop stage-wise IPM.
- **KAU-n**: Kerala Agricultural University, Centre for e-Learning, jackfruit pages at https://celkau.in/crops/fruits/jackfruit/:
  - KAU-L, landplant.php (planting, manuring)
  - KAU-A, aftercultivation.php
  - KAU-H, harvesting.php
  - KAU-M, manuring.php
  - pest and disease pages: fruitborer.php, spittlebug.php, mealybug.php, stemborer.php, jackscale.php, aphid.php, fruitrot.php
- **AAU**: Assam Agricultural University, Package of Practices for Horticultural Crops of Assam 2021, Jackfruit, p.21: https://kvkchirang.aau.ac.in/pdf/package_of_practice/fruits/Jackfruit.pdf
- **MUP**: CIB&RC Major Uses of Pesticides, 30.09.2026, from https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides. All four lists were searched: insecticides (108 pp), fungicides (91 pp), bio-insecticides and bio-fungicides. None has an entry for jackfruit or jack, and none has a generic "fruit crops" claim.

Not reached:
- KAU's full package (pop.kau.in) failed on its certificate, and the intranet PDF returned 403; celkau.in is KAU's own site and was used instead.
- No readable NHB jackfruit pages.
- No BCKV or BAU Sabour jackfruit package found online; AAU is the eastern SAU source.

**No pesticide alternatives.** Jackfruit has no label claim in any MUP list, so every pest and disease row is organic or cultural only. That is also why no row gives waiting days before picking: there is no label to take them from. Every pesticide the sources name is listed under "Removed as not approved" at the end. Fertilisers (urea, SSP, MOP) aren't on the CIB&RC lists; they sit in the "Or" column of the feed rows, as in mango.

Groups:
- **E (EAST_INDIA)**: Bihar, Jharkhand, Odisha, West Bengal, Assam, Tripura, eastern UP.
- **K (COASTAL_HUMID)**: Kerala, coastal Karnataka, Konkan, Goa.
- **S (SOUTH_DECCAN)**: Tamil Nadu, Andhra Pradesh, Telangana, interior Karnataka.

Feeding: NIPHM (national) and TNAU both give May–June + Sep–Oct. E and S get it. K gets no feeding reminders (KAU, below).

Harvest splits the groups:
- S: TNAU, "harvest March–July".
- E and K: AAU and KAU-H both say "the fruit matures towards the end of summer in June".

E alone gets the mealybug trunk-band rows. Their dates are NIPHM's own (national). Limiting them to E follows mango's approved North+East-only band row (mango.md row 5, POP §8.2): NIPHM's jack mealybug is the same *Drosicha mangiferae*. KAU's jack mealybug is a different species (*Nipaecoccus viridis*), with no band advice.

K feeding: KAU says "jack is rarely manured; even without fertilizer the trees come up well under Kerala conditions" (KAU-L, KAU-M). So K has no feeding reminders (rows 1–2 and Y1 are "—" for K).

## NEEDS PER-TREE TIMING
- NIPHM p.25 says to bag fruits in paper bags 15 days before harvest (anthracnose), and to cover fruit with polythene bags against borer egg-laying. Both depend on each fruit.
- No readable source gives flowering months for any region, so care tied to flowering stays on the plant page: spittle bug at flowering (KAU), and no water stress at flowering and fruit set (KAU-A).
- No source gives a pruning month (only NIPHM p.24, "preferably during summer", for scale), so pruning is on the plant page.
- Only the calendar rows below are reminders.

## Bearing reminders
| # | Reminder | E | K | S | Organic | Or | Why | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Feed before the monsoon | May 1–Jun 30 | — | May 1–Jun 30 | Half the year's FYM in a ring under the canopy, mixed into the soil | Half the year's urea + SSP + MOP in the same ring; water in | Feeds the new season's growth; manures and fertilisers both go in two splits | NIPHM p.23; TNAU |
| 2 | Feed after the monsoon | Sep 1–Oct 31 | — | Sep 1–Oct 31 | The other half of the FYM, the same way | The other half of urea + SSP + MOP; water in if no rain | Last feed before the dry months and the next fruiting | NIPHM p.23; TNAU |
| 3 | Soak and rake soil round the trunk | Oct 1–Nov 30 | — | — | Flood the basin once in October; in November dig and rake the soil around the trunk to expose mealybug eggs; pull weeds | — | Kills the eggs before the young bugs climb in winter | NIPHM p.22, p.24 |
| 4 | Band the trunk against mealybug | Dec 1–Jan 15 | — | — | Mud-plaster a 25 cm ring on the trunk 30 cm above ground; tie a 25 cm wide polythene band (400 gauge) over it with twine by mid-December | — | Stops the young bugs climbing to the shoots and flowers | NIPHM p.22, p.24 |
| 5 | Cut ripe fruit off by the stalk | Jun 1–Jun 30 | Jun 1–Jun 30 | Mar 1–Jul 31 | Cut through the fruit stalk; pick up and destroy rotting fruit from the tree and ground | — | Rotting fruit carries fruit rot to the next crop | AAU p.21; KAU-H; TNAU; KAU fruitrot |

Dose (rows 1–2, and Y1; E and S only).

**The rule.** ICAR institute first; where equally authoritative sources differ, the lower dose. No ICAR institute jackfruit dose was reached. TNAU and NIPHM p.23 give the same per-age dose, so there is nothing to choose between. AAU p.21 gives only a flat bearing-tree dose (below). It can't be put per year of age, so it is plant-page text, not the app's dose.

Per year of age, up to 5 years (the cap age; TNAU and NIPHM p.23 give "6th year and above" = 5 × the yearly step):
- FYM 10 kg
- N 150 g → urea 150 ÷ 0.46 = **326 g**
- P 80 g → SSP 80 ÷ 0.16 = **500 g**
- K 100 g → MOP 100 ÷ 0.60 = **167 g**

TNAU and NIPHM write "P" and "K"; these are read as P₂O₅ and K₂O, the lower dose.

Per split (two splits): FYM 5 kg + urea 163 g + SSP 250 g + MOP 83 g × age.

Examples:
- A 3-year-old, per split: 15 kg FYM; urea 489 g + SSP 750 g + MOP 250 g.
- From age 5 (the cap), per split: 25 kg FYM; urea 815 g + SSP 1250 g + MOP 417 g.

Owner to note: AAU (Assam, an SAU) gives a bearing tree 20–30 kg FYM, N 200 g, P₂O₅ 320 g, K₂O 960 g and 5 kg ash, with no timing and no per-age steps. At the cap that is lower than TNAU/NIPHM on N (200 g against 750 g) and P (320 g against 400 g), and higher on K (960 g against 500 g). If AAU counts as equally authoritative for E, the lower-dose rule would cut E's N and P, but only as a flat bearing dose.

Plant page only (never reminders):
- K: KAU says jack is rarely manured, and Kerala trees do well with no fertiliser, so the app sends no feeding reminders on the coast. (KAU-L; KAU-M)
- E, flat bearing-tree dose from AAU (Assam), not per year of age: 20–30 kg FYM, N 200 g, P₂O₅ 320 g, K₂O 960 g and 5 kg ash a year. (AAU p.21)
- Watering a young tree: weekly until it is established, then whenever the soil dries; never let a young tree face drought. Mulch the basin with dry leaves. (TNAU; KAU-L; KAU-A)
- Water: never let the tree go dry at flowering and fruit set, but drain well; too much soil water makes the flakes insipid. (KAU-A)
- If you see frothy spit masses on young shoots at flowering (spittle bug): wipe off the froth, cut off affected shoots. (KAU spittlebug; NIPHM p.23–24)
- If fruits or shoots show tunnels and black patches (shoot and fruit borer): cut off and destroy attacked shoots and fruits. Covering young fruit with polythene bags stops egg-laying. (KAU fruitborer; NIPHM p.23)
- If flowers or young fruits rot with grey, then black velvety growth from the stalk (Rhizopus fruit rot): remove and destroy them from the tree and ground; prune for air; fix drainage. (KAU fruitrot; NIPHM p.26)
- If you see holes with sawdust on the trunk or branches (stem borer, bark-eating caterpillar): clean the tunnel with a wire, pour in a little kerosene, plug with cotton and seal with mud; cut out dead, badly bored branches. (KAU stemborer; NIPHM p.23–24)
- If leaves turn yellow with scales, aphids or black sooty coating: cut off affected parts. (KAU jackscale, aphid; NIPHM p.24)
- If you see dead, dried or diseased branches (dieback, pink disease, scale): cut them back into healthy wood, about 3 inches below the damage; thin crowding for air; seal cuts with cow-dung paste. NIPHM prefers summer for pruning scale-infested parts. (NIPHM p.24–25; KAU fruitrot)
- E, if mealybugs are still on shoots after banding: prune and burn the infested twigs. (NIPHM p.22–23)

## Young trees (first 4 years; grafts yield from year 5, TNAU)
| # | Reminder | E | K | S | What | Source |
|---|---|---|---|---|---|---|
| Y1 | Feed the young tree | May 1–Jun 30 + Sep 1–Oct 31 | — | May 1–Jun 30 + Sep 1–Oct 31 | Dose per year of age (above), half each time, in a ring under the canopy, mixed into the soil | NIPHM p.23; TNAU |

Rows per group: bearing E 5 (1–5), K 1 (5), S 3 (1, 2, 5); young E 1, K 0, S 1 (Y1).

Month check (at most 3 a month): E June has 1 and 5; E October has 2 and 3. S June has 1 and 5. Nothing passes 2, so the app's cap drops nothing.

Plant page (young): remove all side branches that come early, to build a clean trunk 1.5–2 m tall, where the fruit will form. Remove sprouts from below the graft joint as they appear. Keep the graft staked. (KAU-A; KAU-L; NIPHM p.22)

## Phases (bearing)
| Phase | E | K | S | Avoid | Watch |
|---|---|---|---|---|---|
| harvest | Jun | Jun | Mar–Jul | Leaving rotting fruit on tree or ground | Fruit rot, fruit borer, fruit fly (regional) |
| post_harvest_recovery | Jul–Oct | Jul–Oct | Aug–Oct | Waterlogging in the monsoon | Stem borer, dieback, pink disease on branches |
| before_harvest | Nov–May | Nov–May | Nov–Feb | Water stress at flowering and fruit set; heavy watering (insipid flakes) | Mealybug (E, Dec–Jan), spittle bug, shoot and fruit borer, Rhizopus rot of flowers and young fruit |

Sources: TNAU; AAU p.21; KAU-H; KAU-A; NIPHM p.8, p.22–26.

## Removed as not approved
- **No jackfruit label claim (MUP 30.09.2026), so out:**
  - carbaryl, methyl parathion (and 2% dust), methyl demeton, phosphamidon, quinalphos 1.5% dust, Bordeaux mixture 1%, copper oxychloride (TNAU)
  - thiamethoxam 25 WG, chlorothalonil 75 WP (AAU)
  - quinalphos 25 EC, copper oxychloride, carbendazim, thiophanate-methyl, wettable sulphur (KAU)
  - copper oxychloride paste on cuts (NIPHM p.25; cow-dung paste kept)
  - Some of these are also banned.
- **Registered bio-pesticides with no jackfruit claim in the bio-MUP:** *Lecanicillium lecanii*, *Beauveria bassiana* (KAU).
- **Final pass, removed as a spray with no waiting period:** the home-made neem-garlic emulsion (20 ml neem oil + 20 g garlic paste + 5 g bar soap per litre) for spittle bug, borer, scale and aphids (KAU; NIPHM p.23–24). Neem (azadirachtin) has no jackfruit claim; guava and litchi dropped neem for the same reason.
- **Not copied:** KAU leaf spot's "Bordeaux mixture 1% (1 ml in 1 litre)". 1% is 10 g per litre, so the page contradicts itself, and the spray is out anyway.

## Not used
- **Not sized for a home tree:** releases of Tetrastichus, Trichogramma, Cryptolaemus (10–15 grubs per tree) and ladybirds per tree; light traps per acre (NIPHM p.23–25). The sapota file treats Cryptolaemus the same way.

## Removed as unverified
- **Final pass:** Y2, "Water the young tree every week" (E Nov 1–May 31, K Dec 1–May 15, S Jan 1–May 31). The windows were inferred from the monsoon; the sources give only "weekly" and "never drought", which are on the plant page.
- **Final pass, owner decision:** K's feeding rows (rows 1–2 and Y1), following KAU's "rarely manured".
- **Pruning month:** no source gives one, so the Jul–Sep "after harvest" row was dropped. A cut at the height of the monsoon in E and K is when pink disease and dieback spread.
- On-season (Nov–Apr) vs off-season (Aug–Oct) flowering. This is an IIHR-area thesis seen only as a search snippet; the page wouldn't open.
- "120–140 days from fruit set to maturity", "ripe fruit June–August", "harvest February–June" (secondary sites).
- Flowering months for every region.
- Formalin, petrol or crude oil in borer holes (kerosene kept, as in mango).
