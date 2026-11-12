---
name: add-plant
description: Use when adding a plant to Bagicha or improving one — a fruit tree, vegetable, seasonal flower or perennial flower — or when working on a tree-care batch (care calendars, reminders, doses, pests). Holds the checklists of every file to touch, the content standard (practical, region-aware, organic first), the owner-review step and the tests that prove a plant is complete.
---

# Add or improve a plant

Plants are added by the owner and Claude in sessions. Every plant must reach
the same standard, and the horticulture is the risky part: wrong months or
doses are wrong advice to real gardeners. Design: `docs/superpowers/specs/2026-11-12-plant-playbook-design.md`.

## The flow (always in this order)

1. **See what exists.** Open the checklist for the kind:
   [tree](checklist-tree.md) · [vegetable](checklist-crop.md) ·
   [seasonal flower](checklist-seasonal-flower.md) ·
   [perennial flower](checklist-perennial-flower.md).
   For trees, `CARE_PENDING` in `backend/src/modules/plant-ledger/domain/care/index.ts`
   lists families without reviewed care.
2. **Draft the content** from the sources in [sources.md](sources.md), to the
   rules in [content-standard.md](content-standard.md). Mark anything you are
   unsure of with "(check)". Never invent a month, dose or pest.
3. **Owner review — the gate.** Show the table from
   [review-templates.md](review-templates.md): in chat for one plant, a
   Claude Doc for a batch. Apply corrections. **No data file is written
   before an explicit yes.**
4. **Write data and code**, test-first for any logic. Transcribe only what
   was approved.
5. **Prove it**: the checklist's commands, the completeness test
   (`backend/src/modules/plants/domain/care-completeness.spec.ts`), then
   commit. Update `CARE_PENDING` (it only shrinks).

Deploy: a new task-source or schema change needs the Neon migration before
the push (Render deploys `main`).
