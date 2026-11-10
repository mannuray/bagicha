# Slice 0 — API & behaviour changes

Every deliberate API or behaviour change made by the backend cleanup
(`docs/superpowers/plans/2026-11-10-backend-cleanup.md`). Slice 1 (React)
is built against the "After" column.

| Endpoint / area | Before | After | Task |
|---|---|---|---|
| `POST vision/diagnose` | unknown/unowned `plant_id` → diagnosed without context (200/201) | 404 | 2 |
| `POST diagnosis/finalize`, `POST vision/diagnose`, `POST community/ask-ai` | any signed-in user could read/write another user's plant (or resolve their session) | 404 unless the caller owns the plant (and the session belongs to it) | 2 |
| `GET media/download-url/*key` | route never matched under Nest 11 (always 500); would have signed any key | works; private prefixes (`vision/`, `journal/`) only for the owner, otherwise 404; malformed keys 404 | 3 |
| `POST subscription/webhook` | unauthenticated; any POST could grant premium | requires a valid `X-Razorpay-Signature` (HMAC-SHA256 of raw body with `RAZORPAY_WEBHOOK_SECRET`), else 401 `WEBHOOK_SIGNATURE_INVALID`; missing secret = always 401; payload validated | 4 |
| `POST auth/verify-otp` | hard-coded `+916202042225`/`123456` worked in every environment | only when `AUTH_DEV_OTP_PHONE`/`AUTH_DEV_OTP_CODE` are set **and** `NODE_ENV !== production` (set both in local `.env` to keep the mock-data login) | 5 |
| startup | JWT signed with fallback secret `bagicha-secret-key-2026` if unset | app refuses to start without `JWT_SECRET` (and `DATABASE_URL`) | 5 |
| `POST auth/request-otp` | OTP from `Math.random`, printed with `console.log` | `crypto.randomInt`; logged at debug only outside production | 5 |
| rate limits (all routes) | none | 429 `RATE_LIMITED` with `details.bucket`. Buckets (shared per user when signed in, else per IP): `auth` 5/min (request-otp, verify-otp), `ai` 20/h (vision identify/diagnose, community ask-ai, diagnosis finalize), `upload` 30/h (media images), `catalogue` 60/min (plants search/resolve); everything else 300/min per route. Fails open if Redis is down. | 10 |
| `GET health`, `GET health/live` | none | readiness: 200 `{status:'ok',checks:{database,redis}}`, or 503 error envelope `HEALTH_CHECK_FAILED` with `details.checks`; liveness always 200. Unauthenticated, not rate-limited. | 11 |
| cycle year (all journal/diagnosis writes) | ledger used UTC month, diagnosis used server-local month | one rule, IST month (`Asia/Kolkata`); only events near IST midnight on the 1st move; existing cycles unchanged | 14 |
| `GET ledger/plants/:id` (and every `ledger/plants/:id/*` route) on another user's plant | 403 `Access denied` | 404 `PLANT_NOT_FOUND` | 15 |
| `GET ledger/plants`, `GET ledger/plants/:id/cycles`, `GET ledger/plants/:id/tasks`, `GET ledger/tasks` | bare arrays (tasks capped at 20/30, others unbounded) | `data` + `pagination`; `?page` (≥1) and `?page_size` (1–100, default 20); bad values → 422. Dashboard that showed 30 tasks should pass `page_size=30` | 15 |
| `PUT ledger/plants/:id/tasks/:taskId` | task view without plant fields | same view plus `plant_id`, `tree_name`, `record_kind` (additive) | 15 |
| unknown task id on `PUT ledger/plants/:id/tasks/:taskId` | 404 `NOT_FOUND` | 404 `TASK_NOT_FOUND` | 15 |
| lifecycle task generation (background) | mango prune due 9 months out (shared Date mutated); retries duplicated tasks | prune due in 3 months, feed in 6; retries skip existing tasks (`lifecycle:{plant}:{stage}:{type}` key) | 15 |
| AI routes (`vision/*`, `community/ask-ai`) when unconfigured | silently called Gemini with `'MOCK_KEY'` and hard-coded `gemini-1.5-flash` | 502 `AI_NOT_CONFIGURED` unless `GEMINI_API_KEY` **and** `GEMINI_MODEL` are set; provider failure → 502 `AI_PROVIDER_ERROR`; unusable output → 502 `AI_RESPONSE_INVALID` (was `{raw_text, error}` passed through) | 16 |
| `POST diagnosis/finalize` | `{success, data:{session_id, outcome_id, log_ids, task_ids}}` double-wrapped inside the envelope | envelope `data: {session_id, outcome_id, log_ids, tasks: [{sourceKey, status: created\|skipped\|failed, taskId?, reason?}]}`; unsupported subject → 422 `DIAGNOSIS_SUBJECT_UNSUPPORTED`; foreign session → 404 `DIAGNOSIS_SESSION_NOT_FOUND` | 17 |
| `POST vision/diagnose` | malformed/empty AI output saved as an UNKNOWN diagnosis; numeric `confidence` and single-string actions dropped | AI output with neither a recognised issue nor a summary → 502 `AI_RESPONSE_INVALID`, nothing saved; `confidence: 87` → `"87"`; `recommended_actions: "x"` → `["x"]` | 18 |
