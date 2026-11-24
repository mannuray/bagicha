# Ber care, CENTRAL_INDIA and COASTAL_HUMID: second source search (2026-11-24)

This follows `ber.md`, which the owner approved for NORTH, WEST, SOUTH_DECCAN and EAST. Conventions are the same: hard prune after harvest, calendar reminders, per-year doses only where a guide gives one, the existing conditionals (C1–C11) for every sourced region, and no chemical sprays.

**Result: neither region has a regional source. No rows and no phases are drafted. Both stay pending.**

Region coverage checked in `backend/src/modules/regions/domain/districts.ts`:
- **CENTRAL_INDIA** = Madhya Pradesh, Chhattisgarh, and Vidarbha (Akola, Amravati, Nagpur, Wardha, Yavatmal and the other eastern Maharashtra districts). So Dr PDKV Akola counts as a CENTRAL source.
- **COASTAL_HUMID** = Kerala, Goa, Konkan (Palghar, Thane, Raigad, Ratnagiri, Sindhudurg), coastal Karnataka (Dakshina Kannada, Udupi, Uttara Kannada), Puducherry, Lakshadweep, and Andaman and Nicobar.
- Panchmahal (Godhra, Gujarat) is WEST_INDIA.

## Sources reached and searched

How they were read: each PDF was streamed through `pdftotext` (or through in-memory OCR for scanned pages) and searched for `ber`, `Ber`, `Ziziphus`, `Zizyphus` and `jujube`. The KAU search also covered the Malayalam names `elanth` and `ilanth`. Nothing was saved to disk.

| Source | Region | What it holds for ber | Link |
|---|---|---|---|
| KAU *Package of Practices Recommendations: Crops*, 15th ed. (2016), the Kerala Agriculture Department copy of the PoP hosted at intranet.kau.in | COASTAL | **No ber entry.** The only hits are the line-broken "Septem-ber" and "Octo-ber", plus *Ailanthus* and *Strobilanthes*. The full text came through: about 400 form feeds against 392 pages, with the agroforestry chapter on p.274 present. | https://keralaagriculture.gov.in/wp-content/uploads/2021/04/pop2016.pdf |
| KAU *Ad-hoc Package of Practices for Organic Farming* (2015/2017) | COASTAL | **No ber entry** (about 74,000 words searched) | https://www.keralaagriculture.gov.in/agriculture/wp-content/uploads/2018/12/package_2015.pdf |
| Dr BSKKV Dapoli, Joint Agresco recommendations 2018–2023 (English) | COASTAL (Konkan) | **No ber entry** in any year. The text layer works: "mango" hits | https://www.dbskkv.org/assets/pdf/recommendations/ (the 2018, 2019, 2020, 2021, 2022 and 2023 files) |
| Dr PDKV Akola, *Technology Inventory* II, III and IV, and *Research accomplishments 2013–18* | CENTRAL (Vidarbha) | **No ber entry** (about 20,000–26,000 words each). Its pruning items are for citrus | https://www.pdkv.ac.in/pdf/technology-inventory-II.pdf, https://www.pdkv.ac.in/pdf/technology-inventory-III.pdf, https://www.pdkv.ac.in/pdf/technology-inventory-IV.pdf, https://www.pdkv.ac.in/Circulars/researchaccomplish-13-18.pdf |
| RVSKVV Gwalior, *Agriculture volume* (history of research) | CENTRAL (MP) | Three ber mentions, all research history: tussock moth on ber, a "Madhya Bharat" spray trial that killed ber shrubs, and a fruit-fly (*Carpomyia*) study. **No care recommendation** | https://www.rvskvv.net/images/PDF/Publication/Agriculture-volume.pdf |
| ICAR-CIAH Bikaner, technical bulletin list (now reachable at `www.icar-ciah.org`; `ciah.icar.gov.in` still gives ENOTFOUND) | national / arid | It lists four ber files: `Ber_Ki_Kheti.pdf`, `2018/ber_ki_unnat_baagwani.pdf`, `Ber_Orchard_Insitu.pdf` and `Swasthanic_kalikayan_tech_ber_bagh_sthapna_1999.pdf`. See "Not read" below | https://www.icar-ciah.org/index.php?do=downlds_TechBuletin&mod=downlds&page=2 |
| CIAH file `Ber_Fruit_Dryland.pdf` (53 pages, OCR'd in memory) | — | **Mislabelled.** It is a CHES Godhra (Vejalpur, Panchmahal, Gujarat) bulletin on **bael**, not ber. Not used | https://www.icar-ciah.org/include/pdf/technical_bulletin/Ber_Fruit_Dryland.pdf |

Web searches (English, Hindi and Marathi) for JNKVV Jabalpur, RVSKVV, IGKV Raipur (including "Krishi Darshika"), the MP and Chhattisgarh horticulture departments (mpkrishi, agriportal.cg.nic.in), MP and CG KVK leaflets, Dr PDKV, Dr BSKKV, KAU, ICAR-CCARI Goa and coastal Karnataka found **no regional ber package**. The results were national reviews, a CRC textbook, agrifarming and Krishi Jagran articles, Vikaspedia snippets, slide decks, and the Bagalkot (northern dry zone, SOUTH) cultivar trials. As in `ber.md`, none of these counts as a regional source.

## Not reached or not read

- **CIAH Hindi ber bulletins** (`Ber_Ki_Kheti.pdf`, 4 MB; `2018/ber_ki_unnat_baagwani.pdf`, 17 MB). They download (HTTP 200), but they are scanned images with no text layer. Tesseract has no Hindi model here, and WebFetch fails on the host's certificate. **Not read.** Both are from Bikaner, which is arid Rajasthan (WEST). They would matter for CENTRAL only if a table in them names Madhya Pradesh or central India. Links: https://www.icar-ciah.org/include/pdf/technical_bulletin/Ber_Ki_Kheti.pdf and https://www.icar-ciah.org/include/pdf/technical_bulletin/2018/ber_ki_unnat_baagwani.pdf
- **KAU 2024 PoP (Crops):** listed for sale only; no online copy found.
- **intranet.kau.in PoP 2016 and pop.kau.in:** still give a certificate error. The keralaagriculture.gov.in copy of the same 15th edition was read instead.
- **kvk.icar.gov.in KVK leaflets** (for example `k0704_45.pdf`): the host gives ENOTFOUND.
- **krishi.icar.gov.in** (CAZRI *Ber 2018* and other records): not retried. It is CAZRI (WEST) in any case.
- **JNKVV, IGKV, MP Horticulture Department, CG Horticulture Department:** no ber publication found online.

## Per-region rows

### CENTRAL_INDIA: no rows, no phases

No source supports any calendar row, dose or phase for Madhya Pradesh, Chhattisgarh or Vidarbha. The generic "prune late April to May" line in the national reviews is not regional, and it is not used.

### COASTAL_HUMID: no rows, no phases

No coastal source mentions ber. The KAU PoP, which covers Kerala's fruit crops in full, leaves ber out altogether. That fits the other guides: PAU (p.65) and NHB both name high humidity as unsuitable for ber.

| Group | Rows | OK | Corrected | Removed |
|---|---|---|---|---|
| CENTRAL calendar | 0 | — | — | — |
| COASTAL calendar | 0 | — | — | — |
| Phases | 0 | — | — | — |

The conditionals C1–C11 stay limited to the four sourced regions, as in `ber.md`.

## What the check changed (compared with ber.md's "Not reached" list)

1. **KAU reached** through the Kerala Agriculture Department mirror. It is confirmed to have **no ber entry**, so this is now a checked negative rather than "not reached".
2. **CIAH reachable** at `www.icar-ciah.org` (ber.md had ENOTFOUND for `ciah.icar.gov.in`). Its ber bulletins are scanned Hindi and were not read. One file named for ber is actually a bael bulletin.
3. **Dr PDKV Akola moves to CENTRAL** (Vidarbha maps to CENTRAL, not WEST). Its technology inventories are confirmed to have no ber entry.
4. **Dr BSKKV Dapoli (Konkan) and RVSKVV Gwalior checked:** no ber recommendation.
5. No rows were added, corrected or removed. Nothing is drafted.

## Open questions for the owner

- **Q1. CENTRAL_INDIA.** Should it borrow a neighbour's calendar? Western MP borders Rajasthan (CAZRI, May pruning), and the national reviews say late April to May. Recommendation: **keep it pending.** No MP, CG or Vidarbha source gives a month, and borrowing would break the "regional source only" rule. Gardeners keep the season pack. Revisit if a JNKVV, IGKV or RVSKVV ber leaflet turns up, or if someone can read the CIAH Hindi bulletins and finds a central-India table in them.
- **Q2. COASTAL_HUMID.** Recommendation: **keep it pending.** KAU, KAU organic and Dr BSKKV have no ber at all, and the guides call humidity unsuitable. A light plant-page note such as "ber struggles in very humid coastal gardens" could be shown instead, backed by PAU p.65 and NHB. That is a separate decision; this draft does not add it.
- **Q3. CIAH Hindi bulletins.** Should someone read them by hand? Recommendation: **yes, if the owner or a Hindi reader has 15 minutes.** Check only the contents page and the pruning and calendar pages of `ber_ki_unnat_baagwani.pdf` for any Madhya Pradesh or central-India line. If there is none, CENTRAL stays pending.
- **Q4. WEST Q4 lead.** The CHES Godhra (Gujarat) station could hold a Gujarat ber calendar, but the file found is about bael. Recommendation: **no change to WEST.** Note CHES Godhra as the place to look when WEST is re-checked for Gujarat.

Status: Draft + source check, awaiting owner review — nothing written to data.
