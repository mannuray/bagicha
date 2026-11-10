# Slice 0 — API & behaviour changes

Every deliberate API or behaviour change made by the backend cleanup
(`docs/superpowers/plans/2026-11-10-backend-cleanup.md`). Slice 1 (React)
is built against the "After" column.

| Endpoint / area | Before | After | Task |
|---|---|---|---|
| `POST vision/diagnose` | unknown/unowned `plant_id` → diagnosed without context (200/201) | 404 | 2 |
| `POST diagnosis/finalize`, `POST vision/diagnose`, `POST community/ask-ai` | any signed-in user could read/write another user's plant (or resolve their session) | 404 unless the caller owns the plant (and the session belongs to it) | 2 |
