# Checklist — perennial flower (keyed by flower `family`)

Perennial flowers move to the tree-care format in a later step; until then:

1. **Data** — `backend/src/modules/catalogue/seed/perennial-flowers.seed.ts`:
   `aliases` (Latin and Devanagari; the longest alias wins, so "china rose"
   beats "rose"; no alias on two flowers), `bloom` and `care` per climate
   group, first-bloom and lifespan ranges, `note_key` (check it has an
   `en.json` note), `status`, source `notes`.
2. **Search entry and life profile** follow automatically from that record.
3. **Review** — perennial table (care month per climate group); owner's yes.
4. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger/domain/flower-care.spec.ts src/modules/catalogue`
   - `cd backend && npx jest -c test/jest-e2e.json flowers`
5. **Commit**, then run the **catalogue push** (docs/deploy.md).
