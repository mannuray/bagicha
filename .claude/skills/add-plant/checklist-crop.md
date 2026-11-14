# Checklist — vegetable (keyed by crop `id`)

1. **Catalogue seed** — `backend/src/modules/catalogue/seed/crops.seed.ts`:
   one record with `status: 'APPROVED'` (`windows` per climate group
   PLAINS/PENINSULAR/HILLS, month ranges may wrap the year; germination,
   transplant, harvest, thin, succession days; `care` steps; botanical
   `family`; `method`; scientific name, description, sun) and the source
   notes in `notes`. `quick` is derived; don't add it to `tags`.
2. **Methods and care steps** — a new planting method (corm, bulb) is a row
   in `methods.seed.ts` naming its journey (`NURSERY`, `DIRECT` or `PLANT`)
   and its wording. A new care step is a row in `care-steps.seed.ts` (its
   reminder title with `{name}`, and the crop-page label). No code change.
   A new journey shape is code.
3. **Names in titles** — keep task titles readable ("Thin the palak", not
   "Thin the spinach (palak)").
4. **Photo** — `web/src/assets/crops/<id>.jpg` (compressed, ~100 KB); else
   the family icon in `web/src/features/crops/CropPhoto.tsx` `FAMILY_ICON`.
5. **Review** — the vegetable table in review-templates.md; owner's yes.
6. **Prove**:
   - `cd backend && npx jest src/modules/catalogue src/modules/plant-ledger/domain/crop-calendar.spec.ts`
     (update the crop count it pins)
   - `cd backend && npx jest -c test/jest-e2e.json crops`
   - `cd web && npx vitest run src/features/crops`
7. **Commit**, then run the **catalogue push** (docs/deploy.md) after the push to main.
