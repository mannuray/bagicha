# Hindi Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tree care, saved tree-care reminders, engine sentences, phase names and home season tips show in Hindi for a Hindi-language gardener; English unchanged; missing Hindi falls back to English.

**Architecture:** Optional `hi` fields on catalogue care items, phase lists and season months (strict, validated); language-aware picks in the engine and season guide; saved reminders translated at read time from the catalogue by source key and region; phase names translated by key in the web. Code ships first; the Hindi content follows through the owner gate and a push.

**Tech Stack:** NestJS 11, zod 4, Jest; React, i18next, Vitest + MSW.

**Spec:** `docs/superpowers/specs/2026-11-24-hindi-round-2-design.md`

## Global Constraints

- `coding-principles.md` §8; Hindi strings via round 1's `hindiText` (non-empty, needs Devanagari).
- Hindi `avoid` / `watch` / `points` lists: same length as English (validator issue otherwise).
- Language from `RequestLang` (`'en' | 'hi'`); anything else English.
- Saved reminders: translate `title`, `care_how.organic|chemical|why`, `reason`; never `amount`, `window_end`; find the item in the gardener's region; not found → saved English.
- Code release before the Hindi content push; rollback = content first.

## Review Focus

1. A papaya reminder `papaya:feed_1:d90` for a SOUTH_DECCAN gardener — South's Hindi, never coastal's. Task 3.
2. A citrus-kind reminder (`citrus:lime:canker_spray:2026-10-01`) — the kind's item. Task 3.
3. An item with Hindi title but no Hindi `why` — title Hindi, why English (field-by-field fallback). Tasks 2–3.
4. Hindi `avoid` list shorter than English — rejected at push. Task 1.
5. A phase key with no Hindi string — humanised English, no crash. Task 4.

---

### Task 1: `hi` fields in the catalogue schemas
**Files:** create `catalogue/domain/hindi-text.ts` (move `hindiText`, `hindi` from `schemas.ts`); modify `tree-care.ts`, `tree-care.schema.ts`, `season-guide.ts`, `season-guide.schema.ts`, `schemas.ts`. **Tests:** `tree-care.schema.spec.ts`, `season-guide.schema.spec.ts`.
**Produces:** `TreeCareItem.hi?: { title?; organic?; chemical?; why?; conditional? }`, `PhaseWindow.hi?: { avoid?: string[]; watch?: string[] }`, `SeasonMonth.hi?: { season?; headline?; points?: string[] }`.
- [ ] Failing tests: accepts `hi`; rejects unknown `hi` key; rejects Latin-only Hindi; rejects Hindi title > 60; rejects Hindi `avoid` of a different length; rejects Hindi `points` of a different length.
- [ ] Implement; `npx jest src/modules/catalogue` PASS; commit `feat(catalogue): optional Hindi on tree care and season tips`.

### Task 2: Language-aware engine and season guide
**Files:** `plant-ledger/domain/care/engine.ts` (`TreeCareInput.lang?: Lang`, `carePhaseView` input `lang?`), `seasonal/seasonal.service.ts` (`getTreeIntelligence(userId, plantId, lang)`, `getSeasonalGuide(user, lang)`), `seasonal/seasonal.controller.ts` (`@RequestLang()`), `seasonal/domain/season-guide.ts` (`monthOf(months, now, lang)`). **Tests:** `engine.spec.ts`, `seasonal.service.spec.ts`, `season-guide.spec.ts`.
**Produces:** with `lang: 'hi'`: `CareLine` and `CareReminder` texts use `item.hi.*` per field; phase `avoid_now`/`watch_for` use `hi` lists; `doseFor(dose, age, lang)` Hindi patterns (exact copy below); `NOT_GROWN_NOTE_HI`.
Hindi copy (exact): dose `"{n} साल के पेड़ के लिए: {lines}"`, `"{max} साल या उससे पुराने पेड़ के लिए: {lines}"`, `"पेड़ की उम्र के हर साल के लिए ({max} साल तक): {lines}"`, joiner `"; अगर खाद (फ़र्टिलाइज़र) भी देते हैं तो साथ में: "`; not-grown note `"यह आपके इलाके में आम तौर पर नहीं उगाया जाता; समय अलग हो सकता है।"`. Product names and units stay as written.
- [ ] Failing tests: Hindi care line uses `hi.title`/`hi.organic`, falls back per field; Hindi avoid list; Hindi dose line for age 6, for age > max, unknown age; Hindi not-grown note; `getSeasonalGuide(user,'hi')` returns `hi` month and falls back to English when absent; `en` unchanged.
- [ ] Implement; `npx jest src/modules/plant-ledger src/modules/seasonal` PASS; commit `feat(care): Hindi care lines, dose sentences and season tips by request language`.

### Task 3: Saved tree-care reminders in Hindi
**Files:** `plant-ledger/services/plant-names.service.ts` (`titler(lang)` → also returns a `careHowFor`; or new `careTexts(lang, region)`), `plant-ledger/domain/task-view.ts`, `plant-ledger/services/task.service.ts` callers and controllers that list tasks (pass the user's region), `plant-ledger/domain/care/source-key.ts` (create: `parseCareKey(sourceKey): { family; key } | null`, parsed from the right). **Tests:** `source-key.spec.ts`, `plant-names.service.spec.ts`, `task-view.spec.ts` (or the existing list tests).
- [ ] Failing tests: `parseCareKey('papaya:feed_1:d90')` → `{family:'papaya', key:'feed_1'}`; `'citrus:lime:canker_spray:2026-10-01'` → `{family:'citrus:lime', key:'canker_spray'}`; junk → null; a SOUTH_DECCAN papaya reminder shows South's Hindi title and `care_how`; a reminder whose item is gone keeps English; `amount` unchanged; English request unchanged.
- [ ] Implement (look up via `catalogue.treeCare(family)` for plain families or the kind via `careForTree` family name; `resolveRegionCare(care, region)`); run plant-ledger tests + e2e `tasks`/`tree-care`; commit `feat(care): saved tree-care reminders read in Hindi`.

### Task 4: Web phase names by key
**Files:** `web/src/features/biography/sections/AtAGlance.tsx` (+ `format.ts`: `phaseLabel(t, key)`), `web/src/locales/hi.json` / `en.json` (`biography.phase.*` for every phase key in the tree-care seed plus `growing`, `care_coming`, `dryness_attention`, and suffix `biography.phase.withDryness`). **Tests:** `plant-detail.test.tsx`.
- [ ] Failing tests: Hindi app shows the Hindi phase for a known key; `x_with_dryness_attention` shows Hindi phase + Hindi suffix; unknown key shows humanised English.
- [ ] Implement; `cd web && npm test && npm run lint && npx tsc -b` PASS; commit `feat(web): season phase names in Hindi`.
- Note: phase-key Hindi strings are content: drafted here, reviewed with Task 5.

### Task 5: Hindi content (STOPS at the owner gate)
- [ ] Draft `hi` for every approved tree-care family (items, phase lists) and all 7 season-guide regions, in everyday Hindi with round 1's glossary; add `catalogue/seed/hindi-completeness.spec.ts` (lists anything approved without `hi`; must be empty).
- [ ] Review doc (Claude Doc): English beside Hindi per family and for the season tips and phase names. **Stop for an explicit yes.** Commit drafts on the branch; nothing pushed.

## Finish
Final whole-branch review; owner's yes on content; release: code deploy (API + web) → catalogue push.
