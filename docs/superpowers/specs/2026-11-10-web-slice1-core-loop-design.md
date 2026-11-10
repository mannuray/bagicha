# Web App Slice 1: The Core Loop — Design

**Date:** 2026-11-10
**Builds on:** Slice 0 (branch `backend-cleanup`). The API contract is `docs/api-changes-slice0.md`.
**Standard:** `docs/coding-principles.md`, applied to a frontend (see §6).

## 1. Why

The Android app is shelved. Bagicha's frontend is being rebuilt as a React web app that may later be wrapped with Capacitor for the app stores. The rebuild happens in slices, and **Slice 1 is the loop people come back for every week:**

> **my plants → what to do this week → log what happened → learn for next season**

Success means a gardener can sign in on a phone browser, add their trees, and see this week's tasks. They can tick a task off, log what happened (with a photo), and scan a sick leaf to get a diagnosis saved to the tree's record. After a season they can see what went wrong and what to change. All of it runs on the real backend.

## 2. Goals

1. A mobile-first React app in `web/` that runs the whole loop end to end against the real backend.
2. These screens, in the Stitch "Curated Sanctuary" style:
   - **Getting in:** splash, phone login, OTP, then onboarding (language, location, garden profile)
   - **Home:** dashboard with this week's tasks and seasonal guidance. The **weather card is hidden** because backend weather is a mock; it returns in a later slice with real data *(user decision)*.
   - **My plants:** plant list ("Orchard Gallery"), add/edit plant (with catalogue search)
   - **Plant detail ("Tree Biography"):** history, cycles, tasks, seasonal state, mitigation plan
   - **Tasks:** per plant and across all plants ("The Daily Path"), with complete/skip
   - **Log a Moment:** a journal entry with an optional photo
   - **Scan:** camera or upload, identify a plant, diagnose a plant, with result screens. A diagnosis is saved to the chosen tree.
   - **Season review:** "learn for next season", from the mitigation plan and cycles
   - **Profile:** name, district, language, sign out
3. Built so a later Capacitor wrap needs no rewrite: a single-page app, no server rendering, and device features (camera, storage, location) behind small adapters.

## 3. Non-goals

- Community, AI Mentor, chat, marketplace, paywall, seed box and subscription screens. These are later slices. The bottom navigation shows only Slice 1 tabs.
- Offline mode and sync, push notifications, a PWA install prompt, and a Capacitor build itself.
- Hindi or other translated **strings** (see §5: the plumbing and the language preference ship, translations come later).
- Deployment and hosting.
- Backend features beyond the changes in §5.

## 4. Anti-goals (a failure even if it technically works)

- **Mock data anywhere in the shipped app.** Every screen talks to the real backend. Tests may stub the network; the app may not.
- **Drifting from Stitch where Stitch has a design.** Stitch is the source of truth for look and layout, not the old Android screens.
- **Buried tasks.** Opening the app should show what needs doing this week. A screen that buries tasks fails the point of the slice.
- **Swallowed failures.** A failed request must never look like an empty list. Errors are shown, with a retry.
- **Desktop-first layouts** that break on a 360 px phone.

## 5. Decisions

### Decided by the user
- React web app first; Android shelved; Capacitor maybe later.
- Stack: **Vite + React + TypeScript + Tailwind**, React Router, TanStack Query, in `web/`.
- **Real backend everywhere**, not mocks.
- **Stitch is the design source**: project "Bagicha Premium Login" (id `7116397477334778532`) and its "Bagicha Heritage" design system.
  - Where Stitch has several versions of a screen, use the latest: Dashboard "Home Dashboard - Bagicha Sanctuary", Plant detail "Tree Biography - Detailed Record", OTP screen `cd30ef5e…`, Splash "Natural Sanctuary".
  - Screens Stitch doesn't have follow the design system.
- I may redesign a screen where that serves the loop better, and tell the user each time.
- Slice 1 is the core loop above; the other screens come later.
- **Weather card hidden** in Slice 1 (backend weather is a mock). The dashboard shows seasonal guidance in its place.
- **Region is chosen, not guessed.** Onboarding has the user **pick their agro-climatic region** from the seven clusters (East India, North India, West India, Central India, South Deccan, Coastal Humid, Hills/Cool), shown with example places, and **type their district**. Seasonal guidance and tasks use the stored region instead of substring-matching the district. GPS is optional and only fills coordinates; there is no reverse geocoding (location never leaves Bagicha).

### Decided by Claude (my calls; the user can override)

**Design system → code**
- Port the Stitch Tailwind config verbatim into Tailwind v4 theme tokens: all Material color roles, radius `lg` 1rem / `xl` 1.5rem / `full`, Noto Serif for headlines, Manrope for body and labels. Also port the custom classes `pebble-large`, `pebble-small` and `glass-panel`.
- Icons are Material Symbols Outlined, as Stitch uses. Self-host the fonts so the Capacitor wrap needs no network.
- Stitch rules carried into a small set of shared components: no 1px divider lines, river-stone (`full`) buttons, a primary gradient on main buttons, ghost borders on inputs, glass for floating navigation.
- **Where the chosen Stitch screens fall short of the loop:**
  - The "Detailed Record" plant screen has a hero, botanical facts, growth rings, a timeline and a Log-a-Moment button, but **no tasks, cycles, seasonal state or mitigation**. Add those as sections in the same visual language: "This season", "Upcoming care", "Cycles", and a link to Season review.
  - Stitch's demo content becomes real data: the stage ring from `lifecycle_stage` and the timeline from journal entries.
  - **Health:** the backend has no health percentage. `health_status` is a free-text label (default "Healthy") that nothing updates. So the Stitch "94% Thriving" pebble becomes a **label pebble**: `health_status`, or "Needs attention" when the latest diagnosis is MEDIUM/HIGH severity and less than 30 days old. This is a redesign; tell the user.
- Desktop: the app renders as a centered phone-width column (max ~480 px) on a surface background. No separate desktop layout.

**Language**
- Ship i18n plumbing (`react-i18next`) with every user-facing string in an English resource file from day one.
- The Language screen saves `language_pref` through `PUT user/profile/update`. Choosing Hindi still shows English until translations land in a later slice. The screen says so in one line.

**Auth & session**
- Phone + OTP flow against `auth/request-otp` and `auth/verify-otp`. Handle `RATE_LIMITED` and `AUTH_INVALID_OTP` explicitly. After 5 wrong codes the OTP is burned; the UI then says "request a new code".
- Store the JWT behind a `TokenStore` interface. The web version uses `localStorage`; a Capacitor version can swap in secure storage later.
- A 401 anywhere clears the session and returns to login.
- After sign-in, onboarding shows only while the profile is incomplete (no `district` / `garden_types`). Otherwise go straight to the dashboard.

**Data layer**
- One typed API client (`fetch`) that unwraps the envelope (`{success, data, pagination}`) and turns error envelopes into a typed `ApiError { status, code, message }`. `code` is the backend reason (e.g. `PLANT_NOT_FOUND`).
- **Every response is validated with zod at the boundary.** Mismatches are reported as a contract error, never rendered as bad data.
- TanStack Query for all server state, with one query-key factory and mutations that invalidate the affected keys. For example, completing a task refreshes that plant's tasks, the dashboard tasks and the mitigation plan. List screens use the backend's paging (`page`, `page_size` ≤ 100).
- User-facing messages come from a map from `code` to i18n key, with a generic fallback.

**Device features (behind adapters, for Capacitor later)**
- **Camera/photo:** `<input type="file" accept="image/*" capture="environment">`. Photos are resized and compressed **in the browser** (long edge ≤ 1600 px, JPEG ~0.8) before upload or scan.
- **Location:** a region picker plus district text (see the user decisions above). The browser Geolocation API is optional and only fills `latitude`/`longitude`.

**Photos in "Log a Moment"**
- Upload through `POST media/images` (`kind: journal`), then save the returned `key` in the journal entry's `metadata.photo_key`.
- To display it, call `GET media/download-url/{key}`; the backend only signs it for the owner. Cache the signed URL for less than its expiry.

**Tasks for "this week"**
- A new tree only gets background lifecycle tasks months out, and seasonal tasks appear only through `materialize-tasks`. **My call:**
  - The app calls `POST seasonal/plant/:id/materialize-tasks` right after a plant is created.
  - The dashboard calls it once per plant per app session.
  - It's idempotent server-side: existing pending tasks come back as `skipped`.
- The dashboard's empty state ("Nothing due this week") only shows after that call returns.

**Scan results**
- **Identify** is view-only, plus an "Add as a plant" action that pre-fills Add Plant with the identified name (resolved through `plants/resolve`).
- **Diagnose** saves to the tree as the API does today. The diagnosis entry carries **no photo** in Slice 1, because attaching the scan image would need a backend change. Logged moments do carry photos.

**Backend changes, because the loop can't work without them**
1. **Request body limit for scans.** `vision/identify` and `vision/diagnose` take `image_base64` in JSON, but Nest's default JSON limit is 100 KB, too small even for a compressed phone photo. Raise the JSON body limit for those routes to 8 MB (the same ceiling media uploads use) and keep the default elsewhere. Add an e2e test.
2. **CORS.** Allow the web app's origin, read from a `WEB_ORIGINS` env list. Nothing is allowed when it is unset. Add an e2e test.
3. **Test-only fake AI.** Add `AI_PROVIDER=fake`, which binds a deterministic `FakeAiProvider` instead of Gemini. It is refused at startup when `NODE_ENV=production` (fails closed). The Playwright run uses it, plus its own database (`bagicha_e2e`, reset before each run) and the dev-OTP phone. The test signs in with that phone on a freshly reset database, so onboarding runs every time.
4. **Stored region.** Add `region_cluster RegionCluster?` to `User`, accepted and validated by `PUT user/profile/update`.
   - `SeasonalService.resolveRegionCluster` uses the stored value when it is set, and falls back to today's district matching only when it is null (existing users).
   - The migration keeps existing rows (nullable column, no backfill).
   - Unit tests cover the precedence; an e2e test covers saving the profile.
- All four changes follow `docs/coding-principles.md` and the Slice 0 conventions, and are listed in `docs/api-changes-slice0.md` under a "Slice 1" heading.

**Screen-to-API map** (the API's existing shape; no new endpoints)

| Screen | Endpoints |
|---|---|
| Login / OTP | `auth/request-otp`, `auth/verify-otp` |
| Onboarding, Profile | `user/profile/update` (and the user from `verify-otp`) |
| Dashboard | `ledger/tasks`, `seasonal/guide`, `ledger/plants` (count/summary). Not `seasonal/weather` (mock). |
| Plant list | `ledger/plants` (paged) |
| Add/Edit plant | `plants/search`, `plants/resolve`, `ledger/plants` POST/PUT |
| Plant detail | `ledger/plants/:id`, `…/timeline`, `…/cycles`, `…/tasks`, `…/seasonal-state`, `seasonal/plant/:id/intelligence` |
| Tasks | `ledger/plants/:id/tasks`, `ledger/tasks`, `PUT …/tasks/:taskId`, `seasonal/plant/:id/materialize-tasks` ("refresh this season's tasks") |
| Log a Moment | `media/images`, `ledger/plants/:id/journal`, `media/download-url/*` |
| Scan | `vision/identify`, `vision/diagnose` (with `plant_id`, so the diagnosis is saved and follow-up tasks are created) |
| Season review | `ledger/plants/:id/mitigation-plan`, `…/cycles` |

There is no "get current user" endpoint; the user object comes from `verify-otp` and `profile/update`. **My call:** cache the user with the session and refresh it from every `profile/update` response. Do **not** add a `GET /me` endpoint in this slice.

**Testing**
- **Vitest + React Testing Library** for components and hooks, with **MSW** stubbing the network in tests only. Required:
  - each screen's loading, empty, error and success states
  - the API client's envelope, error and zod handling
  - the image-compression adapter
- **Playwright smoke test of the whole loop against the real backend** (docker-compose services plus the backend with a dev OTP):
  - sign in, onboard, add a tree
  - see and complete a task
  - log a moment with a photo
  - scan with a stubbed AI provider, and see the diagnosis and its follow-up task on the tree
  - open Season review

  The backend runs with a fake `AiProvider` for this test, never real Gemini.

## 6. Frontend standard

`docs/coding-principles.md` was written for backend services. For the web app, apply its principles as follows:

- **Single responsibility:** screens compose; data access lives in per-domain hooks (`usePlant`, `useTasks`…) over the API client; pure formatting/mapping lives in plain functions.
- **Module boundaries:** one folder per domain (`auth`, `plants`, `tasks`, `journal`, `scan`, `seasonal`, `profile`). Each exposes an `index.ts`, and siblings import only from it. Shared UI lives in `ui/`, shared infrastructure in `lib/`. No import cycles; add the same checks as Slice 0 (madge plus an import-boundary script).
- **Validate at the trust boundary:** zod on every API response; form input validated before submit.
- **Errors:** one `ApiError` type with `code`; never `throw new Error(string)` in app code; no swallowed errors.
- **Testability:** device and time access goes through adapters (`TokenStore`, `ImageCompressor`, `Clock`, `Geolocator`), so tests swap them.
- **No `console.*`** in shipped code. Errors go to a small `reportError` adapter (console in dev, no-op in production for now).
- **Accessibility:** WCAG AA contrast (the Stitch palette passes on surface), labelled inputs, buttons that are real `<button>`s, visible focus, and touch targets ≥ 44 px.
- **Rules that don't apply to a client** (persistence repositories, OTel spans, server metrics, rate limits, audit trail, `/health`) are noted as not applicable in the final review, not forced in.

## 7. Left to the builder

- Folder layout inside each domain, component breakdown, and file names.
- Form library (or none), zod schema organisation, and exact query keys.
- How each Stitch screen's HTML maps into components, as long as the result matches the screen.
- Animation and transition details.
- Exact versions. Verify them live and prefer proven majors (principles §7). React 19, Vite 8, Tailwind 4, TanStack Query 5 and React Router 8 are current as of today; check each.

## 8. Done means

- `web/`: `npm run build`, `npm run lint`, `npm test` (Vitest), the boundary and cycle checks, and `npm run e2e` (Playwright, against the real backend) all pass.
- `backend/`: the Slice 0 checks still pass, plus e2e tests for the body limit and CORS changes.
- Every Slice 1 screen in §2 works on a 360 px-wide viewport and matches its Stitch design (or the design system where Stitch has none). Plant detail includes the added loop sections.
- A short `web/README.md` covers how to run it locally against the backend.
