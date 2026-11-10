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
