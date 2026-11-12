# Checklist — fruit tree (keyed by `species_family`)

New family or improving an existing one — do each that applies, in order.

1. **Catalogue** — `backend/src/modules/plants/domain/fruit-catalogue.ts`:
   entry (or variety via `variety()`/`plain()`), Hindi names in `languages.hi`,
   `regions` (lower-case clusters where it is grown). Existing keys
   (family/species/variety) must never change: boot upserts on them.
2. **Aliases** — `backend/src/modules/plant-ledger/services/species-normalization.service.ts`
   `familyAliases` (whole words; check "ber" vs "mulberry"-style clashes).
3. **Life profile** — `backend/src/modules/plant-ledger/domain/species-life-profiles.ts`
   (first fruit, productive years, lifespan; `note_key` + `web/src/locales/en.json` note if needed).
4. **Cycle start month** (only if the fruiting year isn't Jan) —
   `backend/src/modules/plant-ledger/domain/species-config.ts`.
5. **Care** — after the owner's yes on the review table:
   - `backend/src/modules/plant-ledger/domain/care/<family>.ts` exporting a
     `FamilyCare` (types in `care/types.ts`): `grownIn` = the catalogue's
     regions (upper-case), one `RegionCare` per grown region or an explicit
     `{ sameAs }` with a comment why; `items` (reminders) and `phases`
     (Now/Next, avoid, watch) for YOUNG and BEARING.
   - Register it in `TREE_CARE` and remove it from `CARE_PENDING`
     (`care/index.ts`).
   - If the family still has a hand-written case in
     `backend/src/modules/plant-ledger/services/seasonal-intelligence.service.ts`,
     delete it.
   - Timing other than calendar dates (bahar, planting, pruning) needs the
     per-tree timing work first — until then those items show on the plant
     page only.
6. **Spot-check spec** — `care/<family>.spec.ts`: 3 checks copied from the
   approved table (one reminder per timing group: exact title and window).
7. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger src/modules/plants src/modules/seasonal`
   - `cd backend && npx jest -c test/jest-e2e.json tree-care catalogue`
   - `npm run lint` and `node scripts/check-module-imports.js`
8. **Commit** `feat(care): <family> care (reviewed)`.
