# Checklist — seasonal flower (crop `id`, `kind: 'FLOWER'`)

1. **Calendar** — `backend/src/modules/plant-ledger/domain/flower-calendar.ts`:
   same `CropInfo` shape as vegetables; `days_to_first_harvest` means days
   to first bloom. Reuse `WINTER`/`SUMMER`/`MARIGOLD`/`SALVIA` window sets
   only when true.
2. **Care steps** — e.g. pinch, deadhead: titles in `CARE_TITLES`
   (`backend/src/modules/plant-ledger/services/crop-journey.service.ts`) and
   `web/src/locales/en.json` `steps`.
3. **Photo** — `web/src/assets/crops/<id>.jpg`.
4. **Review** — vegetable/flower table; owner's yes.
5. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger/domain/crop-calendar.spec.ts`
     (pins the flower count)
   - `cd backend && npx jest -c test/jest-e2e.json flowers`
6. **Commit**.
