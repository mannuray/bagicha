# Hindi Translation, Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A user who picks Hindi sees every screen and every plant name in Hindi; English users see no change.

**Architecture:** The web sends its language as `Accept-Language` on every request and loads `hi.json` into i18next. The catalogue seed gains optional Hindi texts (stored inside the existing `data` jsonb, so no migration), and API responses pick Hindi when the request is `hi` and a value exists. Plant responses gain a `display_name` (Hindi for an unedited catalogue name) so `name` stays the saved, editable value.

**Tech Stack:** NestJS 11, zod 4, Jest; React 19, react-i18next, TanStack Query, vitest + msw.

**Spec:** `docs/superpowers/specs/2026-11-15-hindi-translation-design.md`

## Global Constraints

- Everyday spoken Hindi in Devanagari; keep English words people say ("स्प्रे करें", "सेव करें"). Never formal ("छिड़काव", "सहेजें").
- Missing Hindi always falls back to English, never blank.
- No change for English users (`Accept-Language` absent or not `hi` → today's responses, byte for byte).
- No Hindi ships before the owner's yes on the whole review; everything ships at once (spec "Release").
- Saved data never changes: `name` in plant responses stays the saved value.
- Not in scope: reminder titles, care-step `title` templates, tree-care advice, season tips, user-typed text.
- Code meets `docs/coding-principles.md`.
- Work on branch `hindi-1`; merge only after Task 7's yes.

## Review Focus

1. **Editing a plant in Hindi** keeps the saved English name in the form and never saves the Hindi one (Task 5 test: `name` unchanged, `display_name` Hindi).
2. **A crop or method with no Hindi** shows English inside an otherwise Hindi response (Task 3 test).
3. **Switching language mid-session** refetches cached data in the new language (Task 6 test).
4. **`Accept-Language` variants** — `hi-IN,hi;q=0.9`, `HI`, `en-US`, empty, garbage — map to `hi`/`en` correctly (Task 1 test).
5. **Renamed plants** ("Dadi's tomato") show as written in Hindi (Task 5 test).

---

### Task 1: Request language on the server

**Files:**
- Create: `backend/src/common/http/lang.ts`, `backend/src/common/http/lang.spec.ts`

**Interfaces:**
- Produces: `type Lang = 'en' | 'hi'`; `langOf(header: string | undefined): Lang`; param decorator `RequestLang()` returning `Lang` from `Accept-Language`.

- [ ] **Step 1: Write the failing test** `lang.spec.ts`:
  `it.each([['hi', 'hi'], ['hi-IN,hi;q=0.9,en;q=0.8', 'hi'], ['HI', 'hi'], ['en-US', 'en'], ['en;q=0.9,hi;q=0.8', 'en'], ['', 'en'], [undefined, 'en'], ['*', 'en'], ['xx-garbage', 'en']])('%s → %s', (h, want) => expect(langOf(h)).toBe(want))` — the first listed tag decides (no q-sorting needed: browsers list preference first).
- [ ] **Step 2: Run** `cd backend && npx jest src/common/http/lang`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `langOf` and `RequestLang = createParamDecorator((_, ctx) => langOf(ctx.switchToHttp().getRequest().headers['accept-language']))`.
- [ ] **Step 4: Run** the spec. Expected: PASS.
- [ ] **Step 5: Commit** `feat(http): read the request language from Accept-Language`.

### Task 2: Hindi texts in the catalogue

**Files:**
- Modify: `backend/src/modules/catalogue/domain/types.ts`, `domain/schemas.ts`, `domain/catalogue.ts`, `index.ts`
- Test: `domain/catalogue.spec.ts`

**Interfaces:**
- Produces (types; every field optional, every record's `hi` optional):
  - `CropInfo.hi?: { name?: string; description?: string; container?: string; plants_for_family_of_4?: string }`
  - `PlantingMethod.hi?: { label?: string; short?: string; material_title?: string; material_body?: string }`
  - `CareStepInfo.hi?: { label_title?: string; label_body?: string }` (never `title`)
  - `FruitPlantInfo.hi?: { display_name?: string }`
  - `PerennialFlower.hi?: { name?: string }`
- Produces (`Catalogue`): `hindiPlantName(plant: { name: string; crop_id: string | null; species_family: string | null }): string | null` — Hindi when `crop_id` names a crop whose English `name` equals `plant.name`, or when a fruit entry or perennial flower (served or retired) of the same `species_family` has `display_name` equal to `plant.name`; else null.
- Produces: `pick<T>(english: T, hindi: T | undefined, lang: Lang): T` in `catalogue/domain/pick.ts` — `lang === 'hi' && hindi ? hindi : english`.

- [ ] **Step 1: Write failing tests** in `catalogue.spec.ts` with a seed copy where tomato has `hi: { name: 'टमाटर' }`, NURSERY_TRANSPLANT has `hi: { label: 'नर्सरी, फिर रोपाई' }`, `mango:Dasheri` has `hi: { display_name: 'आम (दशहरी)' }`:
  - `validateSeed` rejects `hi: { name: 'Tamatar' }` (no Devanagari), `hi: { name: '' }`, and an unknown key `hi: { title: 'x' }` on a care step, each with `CATALOGUE_INVALID`.
  - `hindiPlantName({ name: 'Tomato', crop_id: 'tomato', species_family: null })` → `'टमाटर'`; `{ name: "Dadi's tomato", crop_id: 'tomato' }` → null; `{ name: 'Mango (Dasheri)', crop_id: null, species_family: 'mango' }` → `'आम (दशहरी)'`; `{ name: 'Mango (Dasheri)', species_family: 'guava' }` → null.
  - `pick('a', undefined, 'hi')` → `'a'`; `pick('a', 'ब', 'en')` → `'a'`.
- [ ] **Step 2: Run** `npx jest src/modules/catalogue`. Expected: FAIL.
- [ ] **Step 3: Implement.** Schemas: a strict `hindi(shape)` helper; each value `z.string().regex(/[ऀ-ॿ]/).min(1)`. The repository already stores everything but key/status in `data` jsonb, so no migration; `toCropInfo` and friends pass `hi` through.
- [ ] **Step 4: Run** `npx jest src/modules/catalogue` and `npm run test:e2e -- catalogue`. Expected: PASS (push round-trips `hi`).
- [ ] **Step 5: Commit** `feat(catalogue): optional Hindi texts, validated, round-tripped by the push`.

### Task 3: Crops API in the request language

**Files:**
- Modify: `backend/src/modules/crops/crops.controller.ts`, `crops.service.ts`; `backend/src/modules/plant-ledger/domain/flower-care.ts` (`bloomStatus` label)
- Create: `backend/src/common/time/month-label.ts` (+ spec)
- Test: `crops.service.spec.ts` (or the existing crops spec), `test/e2e/crops.e2e-spec.ts`

**Interfaces:**
- Consumes: `Lang`, `RequestLang()` (Task 1); `CropInfo.hi`, `PlantingMethod.hi`, `CareStepInfo.hi`, `pick` (Task 2).
- Produces: `monthRange(start: number, end: number, lang: Lang): string` (`'Oct–Nov'` / `'अक्टू॰–नव॰'` via `Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', timeZone: 'UTC' })`; `1–12` → `'All year'` / `'साल भर'`), `monthYear(d: Date, lang: Lang)`. English output must equal today's labels exactly.
- `CropsService.calendar(user, lang)`, `.detail(user, id, lang)`, place rotation `season_label` with `lang`; `bloomStatus(flower, group, now, lang = 'en')`.

- [ ] **Step 1: Write failing tests:**
  - `month-label.spec.ts`: `monthRange(10, 11, 'en')` → `'Oct–Nov'`; `monthRange(1, 12, 'en')` → `'All year'`; `monthRange(10, 11, 'hi')` matches `/[ऀ-ॿ]/`; `monthRange(1, 12, 'hi')` → `'साल भर'`.
  - Crops service with the Task 2 test seed: `detail(user, 'tomato', 'hi')` has `name: 'टमाटर'`, `method_label: 'नर्सरी, फिर रोपाई'`, Devanagari `window_label`; a crop with no `hi` keeps its English `name` in the same Hindi call (Review Focus 2); `detail(..., 'en')` deep-equals today's response.
  - e2e: `GET /crops/calendar` with header `Accept-Language: hi-IN` returns the same ids and statuses as without it.
- [ ] **Step 2: Run** the specs. Expected: FAIL.
- [ ] **Step 3: Implement.** Controller methods take `@RequestLang() lang: Lang` and pass it down; every catalogue text goes through `pick`; replace the service's `windowLabel`/`monthLabel` with `monthRange`/`monthYear`.
- [ ] **Step 4: Run** `npm test` and `npm run test:e2e -- crops flowers`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(crops): crop texts and month labels in the request language`.

### Task 4: Add-tree search in the request language

**Files:**
- Modify: `backend/src/modules/plants/plants.controller.ts`, `plants.service.ts`; `catalogue/domain/catalogue.ts` (flower search entries carry `hi.display_name` from `PerennialFlower.hi.name`)
- Test: `plants.service.spec.ts`

**Interfaces:**
- Consumes: `RequestLang`, `pick`, `FruitPlantInfo.hi`.
- `PlantsService.search(q, page, lang = 'en')`, `.resolve(q, region?, language?, lang = 'en')`; `toSearchItem(entry, lang)` returns `display_name: pick(entry.display_name, entry.hi?.display_name, lang)`. Ranking is unchanged (it scores the English and alias texts as today).

- [ ] **Step 1: Write the failing test:** with the Task 2 seed, `search('dasheri', page, 'hi').items[0].display_name` → `'आम (दशहरी)'`, `id` still `'mango:Dasheri'`; the `'en'` result equals today's.
- [ ] **Step 2: Run** `npx jest src/modules/plants`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx jest src/modules/plants` and `npm run test:e2e -- plant-search`. Expected: PASS, recorded English results unchanged.
- [ ] **Step 5: Commit** `feat(plants): add-tree search names in the request language`.

### Task 5: Plant and task responses carry a display name

**Files:**
- Modify: `backend/src/modules/plant-ledger/domain/plant-view.ts`, `domain/task-view.ts`, `plant-ledger.controller.ts`, `crops/crops.controller.ts`, `services/plant-record.service.ts` (bloom label lang)
- Create: `backend/src/modules/plant-ledger/services/plant-names.service.ts`
- Test: `plant-view.spec.ts` (create if absent), `test/e2e/plants.e2e-spec.ts` (or the ledger e2e that edits a plant)

**Interfaces:**
- Consumes: `Catalogue.hindiPlantName` (Task 2), `RequestLang`.
- Produces: `PlantNamesService.namer(lang: Lang): Promise<(plant: NamedPlant) => string>` — for `'en'` returns `p => p.name`; for `'hi'` returns `p => catalogue.hindiPlantName(p) ?? p.name` over one snapshot.
- `toPlantView(plant, displayName: (p) => string = (p) => p.name)` adds `display_name`; `name` is untouched. Task views: `tree_name` becomes the display name (it is never edited).

- [ ] **Step 1: Write failing tests:**
  - Unit: `toPlantView({ ...tomatoPlant, name: 'Tomato', crop_id: 'tomato' }, hiNamer)` has `name: 'Tomato'` and `display_name: 'टमाटर'`; with `name: "Dadi's tomato"` both are `"Dadi's tomato"` (Review Focus 5).
  - e2e: `GET /ledger/plants/:id` with `Accept-Language: hi` returns `name` = saved English and `display_name` Hindi (seeded crop with `hi`); `PUT /ledger/plants/:id` with an unrelated field then `GET` without the header shows `name` unchanged (Review Focus 1).
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** Every controller method that returns `toPlantView` or task views takes `@RequestLang()` and one `namer` per request.
- [ ] **Step 4: Run** `npm test`, `npm run test:e2e`, `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(plants): display names in the request language; saved names untouched`.

### Task 6: Web in the user's language

**Files:**
- Modify: `web/src/lib/i18n.ts`, `web/src/lib/api-client.ts`, `web/src/app/providers.tsx`, `web/src/features/profile/LanguageScreen.tsx`, `ProfileScreen.tsx`, `useOnboardingChoices.ts`, `web/src/features/plants/schemas.ts`
- Create: `web/src/locales/hi.json` (start as `{}`), `web/src/lib/language.ts`, `web/src/features/plants/plant-name.ts`
- Modify (show `plantName(plant)`): `biography/sections/Hero.tsx`, `MemoryCard.tsx`, `crops/CropHero.tsx`, `plants/PlantListScreen.tsx`, `journal/LogMomentScreen.tsx`, `scan/ScanScreen.tsx`
- Test: `web/src/lib/api-client.test.ts`, `web/src/lib/language.test.ts`, `profile.test.tsx`, a plant list or hero test, `web/src/locales/locales.test.ts`

**Interfaces:**
- Consumes: `display_name` on plant responses (Task 5).
- Produces:
  - `ApiClientOptions.language?: () => string` → header `Accept-Language` on every request.
  - `applyLanguage(lang: 'en' | 'hi', i18n, queryClient): void` in `lib/language.ts` — changes i18n's language, then `queryClient.resetQueries()` so cached English refetches; a no-op when unchanged. Called when the signed-in user loads (from `language_pref`), when the profile or onboarding saves a new choice, and at start from the device's last choice (kept in `localKeyValueStore` under `bagicha.lang`).
  - `plantName(plant: { name: string; display_name?: string | null }): string`.
  - `plantSchema` gains `display_name: z.string().optional()`.

- [ ] **Step 1: Write failing tests:**
  - api-client: a client built with `language: () => 'hi'` sends `Accept-Language: hi`.
  - language: after `applyLanguage('hi', …)` `i18n.language` is `'hi'` and a cached query refetches with the new header (Review Focus 3); a second call with `'hi'` does not reset.
  - profile: the "Hindi shows English for now" note is gone (replace the test at `profile.test.tsx:102`); saving Hindi switches the screen's own labels to Hindi (with a test `hi.json` key).
  - plant list/hero: a plant with `display_name: 'टमाटर'` shows `टमाटर`; the edit form still pre-fills `name`.
  - locales: every key in `en.json` exists in `hi.json` with a non-empty Devanagari-containing value, except keys listed in `INTENTIONALLY_ENGLISH` (start with `app.name`). Marked `it.todo`-free but skipped by a `HINDI_READY` constant until Task 7 fills the file.
- [ ] **Step 2: Run** `cd web && npx vitest run`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.** i18n resources `{ en, hi }`, `fallbackLng: 'en'`, `supportedLngs: ['en', 'hi']`.
- [ ] **Step 4: Run** `npx vitest run`, `npx tsc -b`, `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): follow the user's language; send it to the API`.

### Task 7: The Hindi text, reviewed by the owner (gate)

**Files:**
- Modify: `web/src/locales/hi.json`; catalogue seeds `crops.seed.ts`, `methods.seed.ts`, `care-steps.seed.ts`, `fruit-plants.seed.ts`, `perennial-flowers.seed.ts`; the locales test (`HINDI_READY = true`)

- [ ] **Step 1: Draft** (scratchpad script, not committed) every `en.json` value in Hindi per the Global Constraints, keeping `{{placeholders}}` and i18next plural suffixes; and the catalogue Hindi fields from Task 2's interfaces, reusing the Devanagari names already in aliases and `languages.hi` where they fit.
- [ ] **Step 2: Review doc.** A Claude Doc with English | Hindi tables, one section per `en.json` top-level group and one per catalogue kind; open points listed first. The owner edits inline. **No file is written before the owner's explicit yes.**
- [ ] **Step 3: Write** the approved text into `hi.json` and the seeds; set `HINDI_READY = true`.
- [ ] **Step 4: Run** `cd web && npx vitest run` and `cd backend && npm test && npm run test:e2e`. Expected: PASS, including the locales parity test and seed validation.
- [ ] **Step 5: Commit** `feat(i18n): Hindi screens and catalogue texts (owner-reviewed)`.

### Task 8: Ship all at once

- [ ] **Step 1:** Final whole-branch review; fix Critical/Important findings.
- [ ] **Step 2:** Merge `hindi-1` to `main`. Order: push `main` → Render deploy, wait until live → catalogue push (Hindi texts) → Vercel builds the web. *Code first: the live API's strict catalogue schema rejects the new `hi` fields; pushing the catalogue first took the API down on 2026-11-15 until the old seed was re-pushed.*
- [ ] **Step 3: Verify live:** `GET /crops/calendar` with `Accept-Language: hi` returns Devanagari names; without it, English. Open the web with a Hindi profile and check Home, a crop page and the garden list.
- [ ] **Step 4:** Roadmap: item 11 round 1 done; round 2 (reminders, tree care, season tips) after stages 3–4.
