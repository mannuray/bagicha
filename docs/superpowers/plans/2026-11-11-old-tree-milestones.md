# Old-tree milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Trees store whether they already fruit; milestones, stage and new logs respect the tree's past; the back button stops covering content.

**Architecture:** Two nullable plant columns. Backend: one pure `predatesFirsts` rule shared by journal milestones; the stage takes bearing status into account; create/update validate, clear and recompute. Web: one pure `milestoneView` function feeding `Milestones.tsx`; the plant form gets the question.

**Tech Stack:** NestJS 11, Prisma 6, jest/supertest; React 19, zod, Vitest + MSW.

**Spec:** `docs/superpowers/specs/2026-11-11-old-tree-milestones-design.md`

## Global Constraints
- Additive migration (`migrate diff --from-schema-datasource` → file → `migrate deploy` → `generate`). Never reset.
- Copy exactly as the spec's list. Backend checks: lint, jest, e2e, `node scripts/check-module-imports.js`. Web checks: `npx tsc -b`, vitest, lint (15 warnings baseline), check:boundaries, check:cycles.

## Review Focus
1. A tree with no planting date or no life profile: no estimate, firsts behave as before.
2. Since-year in the future, before the planted year, or sent with NOT_YET → 422 / cleared.
3. A 2017 tree with a wrong recorded first (Nov 2026) answered *Yes, since 2019* → the recorded first is cleared and the card shows "Since 2019".
4. Estimate year maths at the edges: first-fruit months not a multiple of 12 (banana 9–15 months, dragon fruit 12–18).
5. Existing trees (bearing null) logged now: older than the first-fruit max → firsts not set; younger → set as before.

---

### Task 1: Backend — schema, DTOs, the rule, journal, stage, create/update
**Files:** `backend/prisma/schema.prisma`, new migration, `dto/create-plant.dto.ts`, `dto/update-plant.dto.ts`, new `domain/bearing.ts` + `domain/bearing.spec.ts`, `services/journal.service.ts`, `services/lifecycle.service.ts`, `services/plant-record.service.ts`, `test/e2e/old-tree.e2e-spec.ts`.

**Interfaces — Produces:** plant rows carry `bearing_status: 'BEARING'|'NOT_YET'|null`, `bearing_since_year: number|null`. `predatesFirsts(input: { bearing_status; planting_date: Date|null; profile: LifeProfile|null }, now: Date): boolean` in `domain/bearing.ts`.

- [ ] Unit tests `bearing.spec.ts`: BEARING → true; NOT_YET → false; null + mango planted 2017, now 2026 → true; null + mango planted 2025 → false; null + no date / no profile → false.
- [ ] Lifecycle spec: BEARING → stage ≥ FIRST_HARVEST for a 1-year-old mango; NOT_YET caps a 2017 mango at JUVENILE with no recorded firsts; NOT_YET with first_harvest_at recorded → FIRST_HARVEST.
- [ ] e2e `old-tree.e2e-spec.ts`: create TREE with BEARING + 2019 → returned; since-year 2099 → 422; since-year with NOT_YET → stored null; journal FLOWERING on a 2017 mango (bearing null) → first_flowering_at stays null, entry exists; same on a 2025 mango → set; HARVEST on BEARING tree → latest_harvest_at set, first_harvest_at null; update to BEARING since 2019 on a tree with first_flowering_at 2026-11 → cleared; update record_kind FLOWER → both fields null.
- [ ] Run → fail. Implement. Run → pass; full backend suite + lint + module imports. Commit.

### Task 2: Web — schema, milestone view, form question, back button
**Files:** `web/src/features/plants/schemas.ts`, `PlantFormScreen.tsx`, new `web/src/features/biography/milestone-view.ts` + test, `sections/Milestones.tsx`, `life-line.ts`, `PlantDetailScreen.tsx`, `locales/en.json`, tests in `plants.test.tsx` / `plant-detail.test.tsx`.

**Interfaces — Consumes:** Task 1's fields. **Produces:** `milestoneView(plant: PlantDetail, key: 'firstFlowering'|'firstFruitSet'|'firstHarvest', now: Date): { kind: 'recorded', at: string } | { kind: 'since', year: number } | { kind: 'before' } | { kind: 'estimate', from: number, to: number } | { kind: 'notYet' }`.

- [ ] Unit tests for `milestoneView`: recorded wins; BEARING+2019 → since 2019; BEARING no year → before; null mango planted 2017 → estimate 2020–2022; banana planted 2020 (9–15 months) → estimate 2020–2022? (from = 2020+floor(9/12)=2020, to = 2020+ceil(15/12)=2022); null mango planted 2025 → notYet; no profile → notYet.
- [ ] Component tests: Milestones shows "Around 2020–2022" + "estimated", "Since 2019", "Before Bagicha", an Edit link to `/plants/:id/edit`; form shows the question only for TREE and sends `bearing_status`/`bearing_since_year` (since only with Yes); life line treats BEARING as fruited; back button is not `fixed`.
- [ ] Run → fail. Implement. Run → pass; all web checks. Commit.

### Task 3: Roadmap note, final review, deploy notes
- [ ] Add a line to `docs/data-polish-roadmap.md` (done list). Final whole-branch review by a fresh opus reviewer; one fix pass.
