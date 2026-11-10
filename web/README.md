# Bagicha web

The Bagicha gardener app: React 19 + Vite + TypeScript + Tailwind 4, mobile-first, built to be wrapped with Capacitor later.
Slice 1 is the core loop: **my plants → what to do this week → log what happened → learn for next season.**

Design source: the Stitch project "Bagicha Premium Login" and its "Bagicha Heritage" design system ("The Curated Sanctuary").
Spec: `../docs/superpowers/specs/2026-11-10-web-slice1-core-loop-design.md` · API contract: `../docs/api-changes-slice0.md`.

## Run it locally

Prerequisites: Node 24, Docker, and the backend running (see `../backend`).

```bash
# 1. Backend services + API (from ../backend)
docker compose up -d                        # postgres, redis, minio
#    backend/.env needs JWT_SECRET, DATABASE_URL and WEB_ORIGINS=http://localhost:5173
#    optional: AUTH_DEV_OTP_PHONE / AUTH_DEV_OTP_CODE for a fixed local login,
#              AUTH_EXPOSE_OTP=true to show the OTP on the verification page,
#              GEMINI_API_KEY + GEMINI_MODEL for scanning (or AI_PROVIDER=fake)
npm run start:dev                           # http://localhost:3000

# 2. Web app (this folder)
cp .env.example .env.local                  # VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev                                 # http://localhost:5173
```

Without an SMS provider, the OTP for any phone is logged by the backend at debug level (`LOG_LEVEL=debug`) outside production. For easier testing, set `AUTH_EXPOSE_OTP=true` in `backend/.env`: the verification page then shows "Test code: ……". The backend refuses to start with it in production.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run lint` / `lint:fix` | oxlint (read-only / autofix) |
| `npm test` | Vitest + Testing Library; the network is stubbed with MSW (tests only) |
| `npm run check:boundaries` | No `console.*`, no `throw new Error`, no MSW or `seasonal/weather` in app code; features import each other only via `index.ts` |
| `npm run check:cycles` | madge: no import cycles |
| `npm run e2e` | Playwright: the whole loop at 360 px against the **real backend** (fake AI, throwaway `bagicha_e2e` DB). Needs the docker services up; it starts the backend on :3001 and the app on :5174 itself, and writes screenshots to `test-results/screens/`. |

## Structure

```
src/
  app/        routes, providers (API client, session, query cache), error boundary
  lib/        api-client (envelope + zod + ApiError), token store, i18n, clock, IST dates, query keys
  ui/         Sanctuary components (Button, TextField, Chip, Surface, Screen, BottomNav, QueryState…)
  features/   auth · profile · plants · tasks · dashboard · journal · biography · scan · seasonal
  locales/    en.json — every user-facing string
```

Each feature exposes an `index.ts`; siblings import only that. Device access sits behind adapters, so a Capacitor build can swap it:
- `TokenStore`: session token (`localStorage` today).
- `ImageCompressor` / `ImageOps`: camera photos are resized to ≤1600 px JPEG before upload or scan.
- `Geolocator`: optional coordinates.
- `Clock`: time.

## Intentional differences from the Stitch screens

- **Weather card hidden.** The backend's weather is a mock (user decision). Seasonal guidance takes its place on the dashboard.
- **Health badge is a label, not a percentage.** The backend has no health score. It shows `health_status`, or "Needs attention" after a MEDIUM/HIGH diagnosis in the last 30 days.
- **Tree page ("The Botanical Record") is ordered by what an owner asks** (spec `tree-page-v2`), not by the Stitch layout:
  - hero with age line and health;
  - in-app memory card;
  - At a glance (stage track plus season phase);
  - This season (Avoid / Watch for);
  - Upcoming care;
  - Year on year (season-total yield per year, latest finished season against the one before, Season review link);
  - Milestones;
  - The Sanctuary Record (grouped by year, filtered on the server).

  Stitch's Botanical Essence, big growth rings and the "Do now" list are left out on purpose.
- **Placeholders, marked `TODO(...)` in code:**
  - vitality % (`TODO(vitality)`: no health score yet);
  - push memory reminders (`TODO(push-memory)`: no notification service);
  - sustenance score (`TODO(sustenance-score)`: points are never awarded).
- **Location screen:** type the district first. A district we know (the same short list as the backend's `region-cluster.ts`, kept equal by a test) sets the region by itself; only an unknown district shows the region cards to pick the closest. "Use my location" is optional and replaces Stitch's GPS-first button. There is no reverse geocoding, so location never leaves Bagicha. A full district, pincode and boundary map is future work.
- **Stitch photos are bundled, not hot-linked.** The login, dashboard, verification, garden-picker, add-tree, log-a-moment and tree-page (fallback hero) photos live in `src/assets/stitch/` (shrunk to JPEG, about 580 KB in total), so there are no third-party image requests and the app works offline in a wrapper. Stitch's dashboard soil-moisture card is left out because there is no moisture data. Other screens still use the forest gradient, and a tree's page shows the user's own latest photo.
- **No social-login buttons or Terms/Privacy links.** They have no backend yet.
- Screens Stitch doesn't cover (scan results, season review, onboarding steps beyond location, profile edit) follow the design system: serif headlines, pebble cards, gradient buttons, no divider lines.
- Hindi can be chosen and is saved; the interface stays English until translations land.

## Web principles review

How `docs/coding-principles.md` §8 applies to this client (spec §6):

**Design**
- ✅ Single responsibility. Screens compose; data lives in per-feature hooks; rules are pure functions (`thisWeek`, `dueLabel`, `healthLabel`, the image compressor).
- ✅ Extension points. `ImageOps`, `TokenStore`, `Geolocator` and the region list are swappable without touching callers.
- ✅ Features import siblings only via `index.ts` (enforced by `check:boundaries`).
- ✅ No import cycles (enforced by `check:cycles`). `biography` composes plants, tasks, journal and seasonal to keep the graph acyclic.
- ✅ Dependencies come through context/props (API client, session, compressor, geolocator), never module singletons.
- n/a Persistence repositories: this is a client.

**API & errors**
- ✅ One envelope parser.
- ✅ Every response is validated with zod (`CONTRACT_MISMATCH` on drift).
- ✅ One `ApiError` with the backend `code`, mapped to i18n messages.
- ✅ No `throw new Error` in app code.
- ✅ Every data screen goes through loading / error-with-retry / empty / content.
- ✅ A 401 anywhere expires the session and clears the cache.

**Testability**
- ✅ Adapters for device and time access.
- ✅ Components are tested against the real API client with MSW.
- ✅ The upload path is tested with real multipart bodies.

**Observability**
- ✅ No `console.*` outside `lib/report-error.ts`. Errors go through `reportError` (console in dev, a no-op in production for now).
- n/a OTel spans, server metrics: client.

**Security**
- ✅ Fails closed on auth: any 401 signs out.
- ✅ No secrets in the bundle (only `VITE_API_URL`).
- ✅ Private photos load through owner-checked signed URLs.
- ✅ Credentials never logged.
- n/a Rate limits and audit trail are server concerns, already enforced by the backend.

**Scaling**
- ✅ Every list follows the backend's paging. The plant list and timeline load more on demand. Task lists, the scan tree picker and the dashboard's season check fetch every page, because they filter or act on the whole set.
- ✅ Signed photo URLs are cached under their expiry.
- ✅ Double taps are guarded with busy buttons on complete and with in-flight refs on save and scan. A scan photo is sent once; going back to its result screen reuses the answer, and only Retry sends again.

**Habits**
- ✅ Accessibility: labelled inputs, real buttons, visible focus, 44 px touch targets, AA contrast on surface.
- ✅ 360 px layout is checked by the e2e run.
- n/a `/health` and graceful shutdown are backend concerns.
