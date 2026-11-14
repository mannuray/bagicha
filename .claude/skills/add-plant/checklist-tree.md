# Checklist — fruit tree (keyed by `species_family`)

New family or improving an existing one — do each that applies, in order.

1. **Fruit type** — `backend/src/modules/catalogue/seed/fruit-types.seed.ts`
   (only for a new family): `key` (the species family), `match_aliases`
   (whole words people type; the first type in file order that matches wins,
   so check "ber" vs "mulberry"-style clashes) and `life` (first fruit,
   productive years, lifespan in months; `note_key` + a
   `web/src/locales/en.json` note if needed).
2. **Add-tree entries** — `backend/src/modules/catalogue/seed/fruit-plants.seed.ts`:
   the plain entry (`key` = family) and varieties (`key` = `family:Variety`),
   Hindi names in `languages.hi`, `regions` (lower-case clusters where it is
   grown). Keys never change; to take one out, set `status: 'RETIRED'`.
3. **Push** the catalogue after the commit (docs/deploy.md); the API picks it
   up within a minute.
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
6. **Keep the verified table** in `docs/plant-care/<family>.md` (sources per
   row, what the check changed); the care file cites it.
7. **Spot-check spec** — `care/<family>.spec.ts`: 3 checks copied from the
   approved table (one reminder per timing group: exact title and window).
8. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger src/modules/plants src/modules/seasonal`
   - `cd backend && npx jest -c test/jest-e2e.json tree-care catalogue`
   - `npm run lint` and `node scripts/check-module-imports.js`
9. **Commit** `feat(care): <family> care (reviewed)`.
