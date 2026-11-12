# Checklist — perennial flower (keyed by flower `family`)

Perennial flowers move to the tree-care format in a later step; until then:

1. **Data** — `backend/src/modules/plant-ledger/domain/flower-care.ts`
   `PERENNIAL_FLOWERS`: aliases (feed `flowerFamilyIn`), `bloom` and `care`
   per climate group (`byGroup`), first-bloom and lifespan ranges.
2. **Catalogue and life profile** follow automatically
   (`backend/src/modules/plants/plants.service.ts` seeds them;
   `backend/src/modules/plant-ledger/domain/species-life-profiles.ts` copies
   them) — check a `note_key` has an `en.json` note.
3. **Review** — perennial table (care month per climate group); owner's yes.
4. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger/domain/flower-care.spec.ts src/modules/plant-ledger/domain/species-life-profiles.spec.ts`
   - `cd backend && npx jest -c test/jest-e2e.json flowers`
5. **Commit**.
