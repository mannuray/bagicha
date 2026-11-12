# Checklist — vegetable (keyed by crop `id`)

1. **Calendar** — `backend/src/modules/plant-ledger/domain/crop-calendar.ts`:
   `RAW` entry (`windows` per climate group PLAINS/PENINSULAR/HILLS, month
   ranges may wrap the year; germination, transplant, harvest, thin,
   succession days; `care` steps; botanical `family`; `method`) and a
   `DETAILS` entry (scientific name, description, sun). Reuse
   `GOURD_WINDOWS`/`GREENS_WINDOWS` only when the crop truly matches.
2. **Care steps** — new step keys need a title in `CARE_TITLES`
   (`backend/src/modules/plant-ledger/services/crop-journey.service.ts`) and
   a label in `web/src/locales/en.json` `steps`.
3. **Names in titles** — keep task titles readable ("Thin the palak", not
   "Thin the spinach (palak)").
4. **Photo** — `web/src/assets/crops/<id>.jpg` (compressed, ~100 KB); else
   the family icon in `web/src/features/crops/CropPhoto.tsx` `FAMILY_ICON`.
5. **Review** — the vegetable table in review-templates.md; owner's yes.
6. **Prove**:
   - `cd backend && npx jest src/modules/plant-ledger/domain/crop-calendar.spec.ts`
     (update the crop count it pins)
   - `cd backend && npx jest -c test/jest-e2e.json crops`
   - `cd web && npx vitest run src/features/crops`
7. **Commit**.
