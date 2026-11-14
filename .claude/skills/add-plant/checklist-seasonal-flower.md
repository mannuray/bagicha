# Checklist — seasonal flower (crop `id`, `kind: 'FLOWER'`)

1. **Catalogue seed** — `backend/src/modules/catalogue/seed/crops.seed.ts`,
   `kind: 'FLOWER'`, same shape as vegetables; `days_to_first_harvest` means
   days to first bloom. `long` is derived; don't add it to `tags`.
2. **Methods and care steps** — rows in `methods.seed.ts` /
   `care-steps.seed.ts` (e.g. pinch, deadhead, lift); no code change.
3. **Photo** — `web/src/assets/crops/<id>.jpg`.
4. **Review** — vegetable/flower table; owner's yes.
5. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger/domain/crop-calendar.spec.ts`
     (pins the flower count)
   - `cd backend && npx jest -c test/jest-e2e.json flowers`
6. **Commit**, then run the **catalogue push** (docs/deploy.md).
