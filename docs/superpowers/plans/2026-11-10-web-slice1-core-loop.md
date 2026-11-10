# Web App Slice 1 (Core Loop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first React app in `web/` that runs Bagicha's core loop (*my plants → what to do this week → log what happened → learn for next season*) end to end against the real backend, in the Stitch "Curated Sanctuary" design.

**Architecture:**
- Four small backend changes land first: body limit for scans, CORS, a test-only fake AI, and a stored region.
- The web app is a Vite single-page app built from domain folders (`auth`, `profile`, `plants`, `tasks`, `journal`, `scan`, `seasonal`), each behind an `index.ts`, over shared `lib/` infrastructure and `ui/` components.
- Server state goes through TanStack Query on top of one typed, zod-validated API client.
- Device access (token storage, camera images, geolocation, time) goes through adapters, so a Capacitor wrap can swap them.

**Tech Stack:**
- React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 8 (library mode), TanStack Query 5, zod, react-i18next.
- Vitest + React Testing Library + MSW for tests; Playwright for the end-to-end run.
- Verify every version live before installing and prefer proven majors. If a current major is under two months old or its peer dependencies conflict, use the previous major and record a Ruling.

**Spec:** `docs/superpowers/specs/2026-11-10-web-slice1-core-loop-design.md`. The API contract is `docs/api-changes-slice0.md`; the standard is `docs/coding-principles.md` (applied per spec §6). Executors read all three.

## Global Constraints

- **No mock data in the shipped app.** Every screen calls the real backend. MSW is for tests only, and its handlers live under `web/src/test/`.
- **Stitch wins over Android.** Each screen task names its Stitch screen. Fetch its HTML with the Stitch MCP tool `download_file` (resource name given), and port the layout and classes into components. Replace demo content with real data.
- **Mobile-first:** every screen must work at 360 px wide. On desktop the app is a centered column, max 480 px wide.
- **Every request is validated with zod.** A mismatch throws `ApiError` with code `CONTRACT_MISMATCH`; it is never rendered.
- **Errors are never swallowed.** Every query-driven screen renders loading, empty (where a list can be empty), error with retry, and success.
- **No `console.*` in `web/src`**, outside `lib/report-error.ts` and test files. Never `throw new Error(...)` in app code; use `ApiError` or `AppStateError` from `lib/errors`.
- **Sibling domains import only each other's `index.ts`.** No import cycles. Both are enforced by `npm run check:boundaries` and `npm run check:cycles`.
- **All user-facing text comes from `web/src/locales/en.json`** through `t()`. Hardcoded copy in components is a bug.
- **Weather card hidden.** The app never calls `seasonal/weather`.
- **Accessibility:** WCAG AA contrast, labelled inputs, real `<button>`s, visible focus, touch targets ≥ 44 px.
- **Backend tasks follow Slice 0 conventions:** `AppError` with reason codes, owner-scoped repositories, tests first, `npm run check:boundaries` stays green. Every backend change is added to `docs/api-changes-slice0.md` under a new "## Slice 1" table.
- **Branch:** `web-slice1` (cut from `backend-cleanup`).
- **Local services:** Docker compose on the alternate ports (Postgres 5433, Redis 6380, MinIO 9100) using `backend/.env`. The backend runs on `:3000` and the web dev server on `:5173`.

## Review Focus

The five inputs no main test covers that are most likely to bite a real user. Each is pinned by a test in the task named:

1. **The session expires mid-flow** (the backend returns 401 on any call). The user lands on login with a "please sign in again" message, any half-typed Log-a-Moment text is kept in a draft, and there is no blank screen or retry loop. → Tasks W2, W10
2. **Huge or odd photos:** a 12 MP HEIC/PNG from the camera, a non-image file, or a 0-byte file. These are compressed under the scan body limit, or rejected with a clear message before any upload. No 413 should reach the user. → Task W10
3. **AI unavailable or unusable** (`AI_NOT_CONFIGURED`, `AI_PROVIDER_ERROR`, `AI_RESPONSE_INVALID`, `RATE_LIMITED`). The scan result screen shows a specific, retryable message and keeps the chosen photo, so the user doesn't have to retake it. → Task W12
4. **A plant was deleted elsewhere or the URL holds a wrong id** (404 `PLANT_NOT_FOUND`). Detail, tasks, log and season review show "This plant isn't in your garden" with a link back to My Plants, never an endless spinner. → Task W11
5. **Double taps.** Tapping "Complete" twice, "Save moment" twice, or "Diagnose" twice. Each action is in flight at most once, the button shows busy, and no duplicate writes or duplicate AI calls happen. → Tasks W8, W10, W12

---

## Phase A: Backend changes the loop needs

### Task 1 (B1): Larger request body for scan routes

**Files:**
- Create: `backend/src/common/http/body-limits.ts`
- Modify: `backend/src/bootstrap.ts`, `backend/src/main.ts`, `test/e2e/app.ts` (it must use the same body parser setup)
- Test: `backend/test/e2e/body-limit.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `applyBodyLimits(app: NestExpressApplication): void`, called from `configureApp`.
  - JSON limit **8 MB** for the `/api/v1/vision/*` paths and the default 100 KB everywhere else. Keep `rawBody` working for the webhook signature.

- [ ] **Step 1: Write the failing e2e tests:**
  - `POST /api/v1/vision/identify` with a ~1 MB `image_base64` (authed, fake AI override) → not 413.
  - The same 1 MB body to `POST /api/v1/ledger/plants` → 413.
  - The Razorpay signature e2e (`webhook.e2e-spec.ts`) still passes.
- [ ] **Step 2:** Run `npm run test:e2e -- body-limit`. Expected: FAIL (vision returns 413).
- [ ] **Step 3: Implement.**
  - Create the app with `bodyParser: false`.
  - Register `express.json({ limit: '8mb', verify })` on the vision paths and `express.json({ limit: '100kb', verify })` elsewhere, where `verify` stores `req.rawBody`. Also register `express.urlencoded`.
  - A 413 from the parser maps to an `AppError` reason `PAYLOAD_TOO_LARGE` (the filter already maps the status).
- [ ] **Step 4:** Run `npm run test:e2e`. Expected: PASS (whole suite).
- [ ] **Step 5:** Add a row to `docs/api-changes-slice0.md` under "## Slice 1", then commit: `feat(api): 8 MB JSON limit on vision routes for scans`.

### Task 2 (B2): CORS for the web app

**Files:**
- Modify: `backend/src/bootstrap.ts`, `backend/src/config/env.validation.ts` (`WEB_ORIGINS?: string`), `backend/.env.test.example`, `backend/.env` (local: `WEB_ORIGINS=http://localhost:5173`)
- Test: `backend/test/e2e/cors.e2e-spec.ts`

**Interfaces:**
- Produces: `parseWebOrigins(raw: string | undefined): string[]`, comma-separated and trimmed, empty when unset. `configureApp` calls `app.enableCors({ origin: list, credentials: false, allowedHeaders: ['Authorization','Content-Type','X-Request-Id'] })` only when the list is non-empty.

- [ ] **Step 1: Write the failing tests:**
  - A unit test for `parseWebOrigins` (`'a, b'` → `['a','b']`, `undefined` → `[]`).
  - e2e: with `WEB_ORIGINS=http://localhost:5173`, an `OPTIONS /api/v1/ledger/plants` preflight from that origin returns `Access-Control-Allow-Origin: http://localhost:5173`. From `http://evil.test` the header is absent.
  - With `WEB_ORIGINS` unset, the header is absent for every origin.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Add the doc row, then commit: `feat(api): CORS allow-list from WEB_ORIGINS`.

### Task 3 (B3): Test-only fake AI provider

**Files:**
- Create: `backend/src/modules/ai/fake-ai.provider.ts`
- Modify: `backend/src/modules/ai/ai.module.ts`, `backend/src/config/env.validation.ts`
- Test: `backend/src/modules/ai/fake-ai.provider.spec.ts`, `backend/src/config/env.validation.spec.ts`

**Interfaces:**
- Produces:
  - `FakeAiProvider extends AiProvider`, deterministic:
    - `identify` → `{ common_name: 'Mango', scientific_name: 'Mangifera indica', description: '…', care_summary: {…} }`
    - `diagnose` → `primary_issue: 'PEST'`, `severity: 'MEDIUM'`, `reasoning_summary: 'Mealybugs on new flush.'`, `recommended_actions: ['Spray neem oil in the evening']`, `needs_follow_up: true`, `follow_up_days: 3`
    - `ask_ai` → `{ answer, citations: [] }`
  - `AiModule` binds `AiProvider` to `FakeAiProvider` when `AI_PROVIDER === 'fake'`, else to `GeminiProvider`.
  - `validateEnv` throws `InvariantError` when `AI_PROVIDER === 'fake'` and `NODE_ENV === 'production'`. Unknown `AI_PROVIDER` values also throw.

- [ ] **Step 1: Write the failing tests:**
  - `validateEnv({..., AI_PROVIDER:'fake', NODE_ENV:'production'})` throws `/AI_PROVIDER/`.
  - `AI_PROVIDER:'gpt'` throws.
  - `FakeAiProvider.generateJson({feature:'diagnose',…})` returns the fixed diagnosis.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Use a module factory provider that reads `ConfigService`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Add the doc row (dev/test only), then commit: `feat(ai): AI_PROVIDER=fake for end-to-end runs (refused in production)`.

### Task 4 (B4): Stored region on the profile

**Files:**
- Modify: `backend/prisma/schema.prisma` (`User.region_cluster RegionCluster?`), `backend/src/modules/user/dto/update-profile.dto.ts`, `backend/src/modules/user/user.service.ts`, `backend/src/modules/seasonal/domain/region-cluster.ts`, `backend/src/modules/seasonal/seasonal.service.ts`
- Create: migration `add_user_region_cluster` (nullable column, no backfill)
- Test: `backend/src/modules/seasonal/domain/season-window.spec.ts` (extend), `backend/test/e2e/profile.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `regionFor(user: Pick<User,'region_cluster'|'district'>): RegionCluster`. It returns the stored `region_cluster` when set, else `resolveRegionCluster(district)`. `SeasonalService` uses it instead of `resolveRegionCluster` directly.
  - `UpdateProfileDto.region_cluster?: RegionCluster | null` (`@IsOptional() @IsEnum(RegionCluster)`).
  - The profile update returns the user, including `region_cluster`.

- [ ] **Step 1: Write the failing tests:**
  - `regionFor({region_cluster:'HILLS_COOL', district:'Patna'})` is `HILLS_COOL`.
  - `regionFor({region_cluster:null, district:'Patna'})` is `EAST_INDIA`.
  - e2e: `PUT /api/v1/user/profile/update {region_cluster:'SOUTH_DECCAN', district:'Mysuru'}` returns 200 with `data.region_cluster === 'SOUTH_DECCAN'`.
  - `{region_cluster:'MARS'}` → 422.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Add the column and migration (`npx prisma migrate dev --name add_user_region_cluster`), then implement.
- [ ] **Step 4:** Run `npm test && npm run test:e2e && bash scripts/check-boundaries.sh`. Expected: PASS.
- [ ] **Step 5:** Add the doc row, then commit: `feat(profile): store the user's region; seasonal guidance prefers it`.

---

## Phase B: Web foundation

### Task 5 (W1): Scaffold `web/` with the design tokens and quality gates

**Files:**
- Create:
  - `web/` via Vite's React-TS template
  - `web/src/styles/theme.css` (Tailwind v4 `@theme` tokens)
  - `web/src/styles/sanctuary.css` (`pebble-large`, `pebble-small`, `glass-panel`, `bg-primary-gradient`)
  - `web/scripts/check-boundaries.sh`, `web/scripts/check-domain-imports.js`, `web/.madgerc`
  - `web/vitest.config.ts`, `web/src/test/setup.ts`, `web/.env.example` (`VITE_API_URL=http://localhost:3000/api/v1`)
  - `web/README.md` (stub)
- Test: `web/src/styles/theme.test.tsx`

**Interfaces:**
- Produces:
  - Tailwind utilities for every Stitch color role (`bg-surface`, `text-on-surface-variant`, `bg-primary-container`, …), copied verbatim from the Stitch `tailwind.config` in the Tree Biography HTML (resource `projects/7116397477334778532/files/c0ced4e7624f48fa84a5aaf694ec8172`).
  - Radius `lg`=1rem, `xl`=1.5rem; `font-headline` and `font-display` = Noto Serif, `font-body` and `font-label` = Manrope.
  - Self-hosted fonts via `@fontsource/noto-serif`, `@fontsource/manrope` and `material-symbols` (outlined), with no Google Fonts requests.
  - npm scripts: `dev`, `build`, `lint` (no `--fix`), `lint:fix`, `test` (`vitest run`), `check:boundaries`, `check:cycles`, `e2e` (added in W15).
  - `web/scripts/check-domain-imports.js`: under `src/features/<a>/`, any import that resolves into `src/features/<b>/` must target its `index`.
  - `check-boundaries.sh` also fails on `console.` outside `src/lib/report-error.ts` and tests, on `throw new Error(` in `src/`, and on any `msw` import outside `src/test/`.

- [ ] **Step 1:** Scaffold with `npm create vite@latest web -- --template react-ts` (version verified live), add Tailwind v4 (`@tailwindcss/vite`), and install the rest of the stack.
- [ ] **Step 2: Write the failing test** `theme.test.tsx`: render `<div className="bg-primary text-on-primary font-headline pebble-large" data-testid="x"/>` and assert the classes are on the element. (A smoke test; real coverage of tokens comes from the screens.) Then `check-boundaries.sh` with a deliberate `console.log` in a temporary file exits 1.
- [ ] **Step 3:** Run `npm test` and `npm run check:boundaries`. Expected: FAIL (no theme, no scripts).
- [ ] **Step 4:** Add the theme, the CSS helpers and the scripts.
- [ ] **Step 5:** Run `npm run build && npm run lint && npm test && npm run check:boundaries && npm run check:cycles`. Expected: all pass. Remove the temporary file.
- [ ] **Step 6:** Commit: `feat(web): scaffold Vite React app with Sanctuary tokens and quality gates`.

### Task 6 (W2): API client, errors, session token, i18n, query setup

**Files:**
- Create in `web/src/lib/`:
  - `errors.ts`, `api-client.ts`, `token-store.ts`, `query-client.ts`, `query-keys.ts`
  - `error-messages.ts`, `report-error.ts`, `clock.ts`, `i18n.ts`
- Create: `web/src/locales/en.json`, `web/src/test/msw/server.ts`, `web/src/test/msw/handlers.ts`, `web/src/test/render.tsx` (providers wrapper)
- Test: `web/src/lib/api-client.test.ts`, `web/src/lib/error-messages.test.ts`

**Interfaces:**
- Produces:

```ts
export class ApiError extends Error {      // lib/errors.ts
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown)
}
export class AppStateError extends Error { constructor(readonly code: string, message: string) }

export interface Page<T> { items: T[]; pagination: { page: number; page_size: number; total_items: number; total_pages: number; has_next: boolean; has_previous: boolean } }

export interface ApiClient {                // lib/api-client.ts
  get<T>(path: string, schema: z.ZodType<T>, query?: Record<string, string | number | undefined>): Promise<T>;
  getPage<T>(path: string, item: z.ZodType<T>, query?: { page?: number; page_size?: number } & Record<string, string | number | undefined>): Promise<Page<T>>;
  send<T>(method: 'POST' | 'PUT', path: string, body: unknown, schema: z.ZodType<T>): Promise<T>;
  upload<T>(path: string, form: FormData, schema: z.ZodType<T>): Promise<T>;
}
export function createApiClient(opts: { baseUrl: string; tokens: TokenStore; onUnauthorized: () => void; fetchImpl?: typeof fetch }): ApiClient;

export interface TokenStore { get(): string | null; set(token: string): void; clear(): void }  // lib/token-store.ts
export const localTokenStore: TokenStore;

export function messageFor(err: unknown): string;   // lib/error-messages.ts — i18n key per code, generic fallback
export interface Clock { now(): Date }  export const systemClock: Clock;
export function reportError(err: unknown, context?: Record<string, unknown>): void;
export const queryKeys = { me, plants: { list(page), detail(id), timeline(id,page), cycles(id), tasks(id), seasonalState(id), intelligence(id), mitigation(id) }, tasks: { mine(page) }, guide, catalogue: { search(q) }, media: { url(key) } };
```

- Envelope handling:
  - The success body `{success:true,data,pagination?}` gives `data`, parsed with the schema (or a `Page`).
  - The error body `{success:false,error:{code,message,details}}` gives `ApiError(status, code, message, details)`.
  - A network failure gives `ApiError(0,'NETWORK_ERROR',…)`.
  - A non-JSON body gives `ApiError(status,'BAD_RESPONSE',…)`.
  - A zod failure gives `ApiError(status,'CONTRACT_MISMATCH',…)`, and `reportError` is called.
  - A 401 calls `tokens.clear()`, then `onUnauthorized()`, then throws `ApiError(401,'UNAUTHORIZED')`.
- `Authorization: Bearer <token>` is sent when a token exists; `X-Request-Id` is a fresh UUID per request.
- The `en.json` keys include `errors.<CODE>` for: `RATE_LIMITED`, `AUTH_INVALID_OTP`, `PLANT_NOT_FOUND`, `TASK_NOT_FOUND`, `AI_NOT_CONFIGURED`, `AI_PROVIDER_ERROR`, `AI_RESPONSE_INVALID`, `PAYLOAD_TOO_LARGE`, `VALIDATION_ERROR`, `NETWORK_ERROR`, `CONTRACT_MISMATCH`, `UNAUTHORIZED`, `generic`.

- [ ] **Step 1: Write the failing tests** (with MSW):
  - unwraps `data`;
  - returns a `Page` from `data` + `pagination`;
  - maps an error envelope to `ApiError` with `code`;
  - a schema mismatch gives `CONTRACT_MISMATCH`;
  - fetch rejecting gives `NETWORK_ERROR`;
  - 401 clears the token and calls `onUnauthorized` exactly once (**Review Focus #1**);
  - sends the bearer token;
  - `messageFor(new ApiError(429,'RATE_LIMITED',''))` returns the English rate-limit text;
  - an unknown code returns the generic text.
- [ ] **Step 2:** Run `npm test -- lib`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): typed API client, errors, token store, i18n and query setup`.

### Task 7 (W3): Shared UI components

**Files:**
- Create in `web/src/ui/`: `Button.tsx`, `TextField.tsx`, `Chip.tsx`, `Surface.tsx`, `Pebble.tsx`, `Icon.tsx`, `Screen.tsx`, `TopBar.tsx`, `BottomNav.tsx`, `StateViews.tsx`, `index.ts`
- Test: `web/src/ui/Button.test.tsx`, `web/src/ui/StateViews.test.tsx`

**Interfaces:**
- Produces, exported from `ui/index.ts`:
  - `Button({ variant: 'primary'|'secondary'|'tertiary', busy?, ...button })`. Primary uses the `primary → primary-container` gradient at 135°, and every variant has `rounded-full` and a min height of 44 px. When busy it is disabled with `aria-busy` and a spinner.
  - `TextField({ label, error?, ...input })`: `surface-container` background, ghost border, an always-present `<label>`.
  - `Chip({ selected, ...button })`; `Surface({ level: 'low'|'base'|'lowest', shape?: 'xl'|'lg'|'pebble' })`; `Pebble`; `Icon({ name, filled? })` (Material Symbols).
  - `Screen({ children, nav?: boolean })`: centered column, max width 480 px, safe-area padding.
  - `TopBar({ title?, back?: boolean })`.
  - `BottomNav()`: glass panel with tabs Home / Plants / Scan / Profile, using `NavLink` with active styling.
  - `LoadingState`, `EmptyState({ title, action? })`, `ErrorState({ error, onRetry })`. `ErrorState` uses `messageFor`.
  - `QueryState({ query, empty?, children })`: renders loading, error-with-retry, empty (via the `empty(data)` predicate) or children. Every screen uses it.

- [ ] **Step 1: Write the failing tests:**
  - `Button busy` → disabled, `aria-busy="true"`, and the click handler is not called.
  - `ErrorState` shows `messageFor(error)` and a Retry button that calls `onRetry`.
  - `QueryState` renders each of the four states from a fake query object.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement, porting classes from the Stitch HTML of the Dashboard (`projects/7116397477334778532/files/e6f049af4f2348de9e674b6a43c4c35c`).
- [ ] **Step 4:** Run `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): Sanctuary UI components and query state views`.

---

## Phase C: Feature domains

Every domain lives in `web/src/features/<domain>/` with `api.ts` (zod schemas + hooks), screens, and `index.ts`. Screens get MSW-backed tests for loading, error with retry, empty (if a list) and success.

### Task 8 (W4): Auth (splash, login, OTP, session, route guards)

**Stitch:**
- Splash `…/files/29e9e546959544beab8a96ede12f5e81`
- Login `…/files/05ddac9d99d14eb0a6ee05e151f7648f`
- OTP `…/files/f3216a7f0d1d45e89dc5281383065afd`

All under `projects/7116397477334778532`.

**Files:**
- Create in `web/src/features/auth/`: `api.ts`, `session.tsx`, `SplashScreen.tsx`, `LoginScreen.tsx`, `OtpScreen.tsx`, `guards.tsx`, `index.ts`
- Test: `LoginScreen.test.tsx`, `OtpScreen.test.tsx`, `guards.test.tsx`

**Interfaces:**
- Produces:
  - `userSchema` (zod): `id`, `phone_number`, `name|null`, `district|null`, `region_cluster|null`, `garden_types: string[]`, `language_pref`, `subscription_tier`, `premium_expires_at|null`, `badge_level`.
  - `type User = z.infer<typeof userSchema>`.
  - `SessionProvider` and `useSession(): { user: User | null; signIn(token: string, user: User): void; updateUser(user: User): void; signOut(): void }`. The user and token are kept through `TokenStore` plus a cached user in `localStorage` under `bagicha.user`.
  - `useRequestOtp()` and `useVerifyOtp()`. Verify returns `{ access_token, user }` and calls `signIn`.
  - `isProfileComplete(user): boolean`, true when `district`, `region_cluster` and at least one `garden_types` entry are set.
  - Guards: `<RequireAuth>` sends to `/login` with `state.reason='expired'` when the session was cleared by a 401. `<RequireOnboarded>` sends to `/onboarding/language` while the profile is incomplete.
- Phone input: Indian mobile, 10 digits, sent as `+91XXXXXXXXXX`; validated before submit.

- [ ] **Step 1: Write the failing tests:**
  - Login submits `+919876543210` and moves to OTP.
  - Fewer than 10 digits shows an inline error and makes no request.
  - `RATE_LIMITED` shows the rate-limit message.
  - OTP success with a complete profile goes to `/`, and with an incomplete one goes to `/onboarding/language`.
  - `AUTH_INVALID_OTP` shows the error and a "Get a new code" action.
  - A 401 from any query lands on `/login` showing the "please sign in again" text (**Review Focus #1**).
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement, porting the Stitch screens.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): phone OTP sign-in, session and route guards`.

### Task 9 (W5): Onboarding and Profile

**Stitch:**
- Select Language `…/files/71d46b9176094fcdbd176f0bdaef6d52`
- Location Anchor `…/files/94368b15e85c4420a2ea085e1a354d7f`
- Garden Profiling `…/files/b911779b4b7c4452b0661dc15c19b226`
- Profile & Settings `…/files/8b309738c82049259e112bef5a8f3946`

**Files:**
- Create in `web/src/features/profile/`: `api.ts`, `regions.ts`, `geolocation.ts`, `LanguageScreen.tsx`, `RegionScreen.tsx`, `GardenScreen.tsx`, `ProfileScreen.tsx`, `index.ts`
- Test: one test file per screen, plus `regions.test.ts`

**Interfaces:**
- Consumes: `useSession().updateUser`, `userSchema`.
- Produces:
  - `useUpdateProfile()`: `PUT user/profile/update`, which calls `updateUser` with the response.
  - `REGIONS: Array<{ id: RegionCluster; labelKey: string; examplesKey: string }>`, one per backend cluster, with example places taken from the backend's district list (e.g. East India: Malda, Kolkata, Patna).
  - `interface Geolocator { current(): Promise<{ latitude: number; longitude: number } | null> }` and `browserGeolocator`. It returns `null` on denial, unavailability or a 10 s timeout, and never throws.
- Flow: Language (en/hi; picking Hindi shows the one-line "English for now" note) → Region (pick a region, type the district, optional "Use my location" for coordinates) → Garden (trees/veggies/flowers chips, at least one) → `/`.
- Profile: shows name, phone, region and district, language and badge; lets the user edit name, region/district and language; has Sign out.

- [ ] **Step 1: Write the failing tests:**
  - Region can't continue until a region is picked and the district is non-empty.
  - "Use my location" with a denying geolocator still allows continue and sends no coordinates.
  - Garden requires at least one chip.
  - Finishing sends one `PUT` per step with the right fields and lands on `/`.
  - Profile Sign out clears the session and goes to `/login`.
  - `REGIONS` has exactly the 7 backend clusters.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): onboarding (language, region, garden) and profile`.

### Task 10 (W6): Plants (list, add/edit, catalogue search)

**Stitch:**
- Orchard Gallery `…/files/fcffcaf39d1b48299625676b45bc71c1`
- Add New Tree `…/files/db6894991eca4fb88850fa779b45f332`

**Files:**
- Create in `web/src/features/plants/`: `api.ts`, `PlantListScreen.tsx`, `PlantFormScreen.tsx`, `CataloguePicker.tsx`, `index.ts`
- Test: `PlantListScreen.test.tsx`, `PlantFormScreen.test.tsx`

**Interfaces:**
- Produces:
  - `plantSchema` (the backend `Plant` fields used by the UI: `id`, `name`, `species`, `species_family|null`, `variety|null`, `record_kind`, `type`, `growth_habit`, `record_pattern`, `lifecycle_stage`, `lifecycle_stage_manual`, `planting_date|null`, `planting_date_precision`, `health_status`, `created_at`).
  - `plantDetailSchema = plantSchema.extend({ _count: { journal_entries: number } })`.
  - `usePlants(page)`, `usePlant(id)`, `useCreatePlant()`, `useUpdatePlant(id)`, `useCatalogueSearch(q)` (debounced 250 ms, only when q ≥ 2 chars) and `useResolvePlant()`.
  - `useCreatePlant` calls `POST seasonal/plant/:id/materialize-tasks` after a successful create (spec: tasks for this week), then invalidates `plants.list`, `tasks.mine` and `plants.tasks(id)`.
  - The form accepts `?prefill=<name>`, which is resolved through `plants/resolve`, for Scan → "Add as a plant".
- Planting date input: year, month+year, or exact date (precision `YEAR`, `MONTH_YEAR` or `EXACT_DATE`), sent as the backend expects.

- [ ] **Step 1: Write the failing tests:**
  - The list renders paged plants, with "Load more" when `has_next`.
  - The empty state shows an "Add your first tree" action.
  - An error shows retry.
  - The form requires name and species, and catalogue search fills species/variety.
  - Submit creates the plant, calls materialize-tasks once, and navigates to the plant.
  - `?prefill=Mango` pre-fills from `plants/resolve`.
  - Edit sends `PUT` with only the changed fields.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): my plants list and add/edit with catalogue search`.

### Task 11 (W7): Tasks (Daily Path, complete/skip)

**Stitch:** The Daily Path `…/files/6f6215547040447094c11fb91842ac7f`

**Files:**
- Create in `web/src/features/tasks/`: `api.ts`, `TaskCard.tsx`, `TasksScreen.tsx`, `this-week.ts`, `index.ts`
- Test: `TasksScreen.test.tsx`, `TaskCard.test.tsx`, `this-week.test.ts`

**Interfaces:**
- Produces:
  - `taskSchema`: `id`, `type`, `title`, `category|null`, `priority`, `status`, `source`, `reason|null`, `due_date`, `completed_at|null`, `plant_id|null`, `tree_name|null`, `record_kind|null`, `plant_cycle_id|null`, `cycle_year|null`, `source_summary|null`.
  - `useMyTasks(page)`, `usePlantTasks(plantId, page)`, `useUpdateTaskStatus()`, `useMaterializeTasks()`.
  - `useUpdateTaskStatus()` sends `PUT ledger/plants/:plantId/tasks/:taskId`, then invalidates `tasks.mine`, `plants.tasks`, `plants.mitigation` and `plants.cycles`.
  - `thisWeek(tasks: Task[], now: Date): { overdue: Task[]; week: Task[]; later: Task[] }`. Pending tasks only: `due < startOfToday` is overdue, `due ≤ now + 7 days` is week, the rest is later. Each group is sorted by due date, then priority (HIGH first).
- `TaskCard`: title, plant name, due label ("Today", "Tomorrow", "In 3 days", "2 days overdue"), priority accent, `source_summary`, and Complete / Skip buttons.
- `TasksScreen`, route `/tasks` (all) and `/plants/:id/tasks` (one plant): grouped by `thisWeek`, with "Refresh this season's tasks" on the per-plant view.

- [ ] **Step 1: Write the failing tests:**
  - `thisWeek` boundaries, using a fixed now of `2026-03-10T09:00` IST: due yesterday is overdue, due in 7 days is week, due in 8 days is later; completed tasks are excluded.
  - Complete calls the API once and the card leaves the pending list.
  - **Double-tapping Complete sends one request (Review Focus #5).**
  - `TASK_NOT_FOUND` shows the message and refetches.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): this week's tasks with complete and skip`.

### Task 12 (W8): Dashboard

**Stitch:** Home Dashboard – Bagicha Sanctuary `…/files/e6f049af4f2348de9e674b6a43c4c35c`. The weather card is omitted and the seasonal guidance card takes its place.

**Files:**
- Create in `web/src/features/seasonal/`: `api.ts`, `index.ts`
- Create in `web/src/features/dashboard/`: `DashboardScreen.tsx`, `use-session-materialize.ts`, `index.ts`
- Test: `DashboardScreen.test.tsx`, `use-session-materialize.test.ts`

**Interfaces:**
- Consumes: `useMyTasks`, `thisWeek`, `TaskCard`, `usePlants`, `useMaterializeTasks`.
- Produces:
  - `useSeasonalGuide()`: `GET seasonal/guide`, with schema `{ season: string, crops: string[], advice: string }`.
  - `usePlantIntelligence(plantId)`: `GET seasonal/plant/:id/intelligence`. The schema has `seasonal_pack` (`current_phase`, `upcoming_phase`, `confidence`, `do_now: string[]`, `avoid_now: string[]`, `watch_for: string[]`), `personalized_overlay|null` and `is_paid_user`.
  - `useSessionMaterialize(plantIds: string[])`: calls `materialize-tasks` once per plant per app session, tracked in an in-memory `Set` held by the session (not storage), then invalidates `tasks.mine` once all calls settle. Failures are reported but don't block the dashboard.
- Layout:
  - Greeting with name and season.
  - "This week": overdue plus week tasks, up to 5, with "See all" linking to `/tasks`.
  - Seasonal guide card.
  - My garden summary (plant count, "Add a tree").
- The empty state "Nothing due this week" shows only after the session's materialize calls have settled.

- [ ] **Step 1: Write the failing tests:**
  - Shows this week's tasks grouped, with the overdue badge.
  - Shows the guide card and never requests `seasonal/weather` (assert no MSW hit).
  - Materialize runs once per plant per session across remounts.
  - The empty state appears only after materialize settles.
  - A tasks error shows retry while the guide still renders.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): dashboard with this week's tasks and seasonal guidance`.

### Task 13 (W9): Images and media (compression, upload, signed URLs)

**Files:**
- Create in `web/src/features/journal/`: `image-compressor.ts`, `media-api.ts`
- Test: `image-compressor.test.ts`, `media-api.test.ts`

**Interfaces:**
- Produces:
  - `interface ImageCompressor { compress(file: File): Promise<{ blob: Blob; base64: string; width: number; height: number }> }` and `canvasImageCompressor`.
    - Long edge ≤ 1600 px, JPEG quality 0.8. If the base64 is still over 6 MB, retry at quality 0.6 and then a 1200 px long edge.
    - Throws `AppStateError('IMAGE_UNSUPPORTED')` for non-images or 0-byte files, and `AppStateError('IMAGE_TOO_LARGE')` if it can't get under 6 MB.
    - Uses `createImageBitmap`, with an `HTMLImageElement` fallback for HEIC-capable browsers.
  - `useUploadImage(kind: 'journal' | 'vision' | 'post')`: `POST media/images` (multipart: `file`, `kind`) returning `{ key, url, … }`.
  - `useMediaUrl(key: string | null)`: `GET media/download-url/{key}`. The query `staleTime` is 50 minutes, below the backend's 1-hour expiry.

- [ ] **Step 1: Write the failing tests** (jsdom with mocked canvas and `createImageBitmap`):
  - A 4000×3000 image comes out with a long edge of 1600.
  - A `text/plain` file → `IMAGE_UNSUPPORTED`.
  - A 0-byte file → `IMAGE_UNSUPPORTED`.
  - Output that stays over 6 MB after the fallbacks → `IMAGE_TOO_LARGE` (**Review Focus #2**).
  - The upload sends multipart with `kind`.
  - `useMediaUrl(null)` makes no request.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): image compression, uploads and signed media URLs`.

### Task 14 (W10): Log a Moment

**Stitch:** Log a Moment – Quick Entry `…/files/0d4f112b875a49158e7ec774bd1bf83d`

**Files:**
- Create in `web/src/features/journal/`: `api.ts`, `LogMomentScreen.tsx`, `draft.ts`, `index.ts` (also exporting W9's pieces)
- Test: `LogMomentScreen.test.tsx`, `draft.test.ts`

**Interfaces:**
- Consumes: `useUploadImage('journal')`, `canvasImageCompressor`, `usePlant`.
- Produces:
  - `journalEntrySchema`: `id`, `type`, `content|null`, `metadata` (unknown record or null), `timestamp`, `recorded_at`, `plant_cycle_id|null`, `diagnosis_outcome_id|null`.
  - `useAddJournalEntry(plantId)`: `POST ledger/plants/:id/journal` with body `{ type, content?, metadata?: { photo_key?, severity?, quantity_value?, quantity_unit?, quality? }, event_at? }`. It then invalidates the timeline, cycles, tasks, the plant detail, `tasks.mine` and the mitigation plan.
  - `useTimeline(plantId, page)`.
  - Draft persistence: `saveDraft(plantId, draft)`, `loadDraft(plantId)` and `clearDraft(plantId)` in `localStorage`, keyed by plant, wrapped in try/catch.
- The form has a type picker (Note, Watering, Flowering, Fruit set, Flower drop, Fruit drop, Harvest, Pruning, Feeding, Treatment, Photo). Severity shows for drops; quantity, unit and quality show for Harvest. Also: an optional date and an optional photo.
- The photo is compressed and then uploaded before the journal POST. If the upload fails, the entry isn't saved; show an error and keep the form.

- [ ] **Step 1: Write the failing tests:**
  - Saving a Harvest with quantity sends the right metadata.
  - A photo uploads first, then the journal POST includes `metadata.photo_key`.
  - An upload failure keeps the form and saves nothing.
  - **Double-tapping Save sends one upload and one POST (Review Focus #5).**
  - **A 401 during save keeps the typed text as a draft, and reopening the screen restores it (Review Focus #1).**
  - A successful save clears the draft and returns to the plant.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): log a moment with photo, drafts and harvest details`.

### Task 15 (W11): Plant detail ("Tree Biography")

**Stitch:** Tree Biography – Detailed Record `…/files/c0ced4e7624f48fa84a5aaf694ec8172`, extended per spec §5 with the sections This season, Upcoming care and Cycles, and a link to Season review.

**Files:**
- Create in `web/src/features/plants/`: `PlantDetailScreen.tsx`, `health-label.ts`, `growth-stage.ts`, `detail-sections/{Hero,Essence,GrowthRings,Timeline,ThisSeason,UpcomingCare,Cycles}.tsx`
- Modify: `web/src/features/plants/api.ts` (`useCycles`, `useSeasonalState`), `web/src/features/plants/index.ts`
- Test: `PlantDetailScreen.test.tsx`, `health-label.test.ts`

**Interfaces:**
- Consumes: `usePlant`, `useTimeline`, `usePlantTasks`, `usePlantIntelligence`, `useMediaUrl`, `thisWeek`, `TaskCard`.
- Produces:
  - `cycleSchema`: the cycle view fields from the backend, including `recent_events`.
  - `seasonalStateSchema`: `species_family`, `current_phase`, `upcoming_phase`, `confidence`, `do_now`, `avoid_now`, `watch_for`, `next_checkpoint_days`, `basis`.
  - `useCycles(id, page)`, `useSeasonalState(id)`.
  - `healthLabel(plant, recentEntries, now)` returns `{ labelKey: string; tone: 'good' | 'attention' }`. It is `attention` with `labelKey: 'health.needsAttention'` when a `DIAGNOSIS` entry exists with `metadata.severity` of `MEDIUM` or `HIGH` and a timestamp within 30 days of `now`. Otherwise `tone: 'good'`, with the label taken from `plant.health_status`.
  - `growthStage(lifecycle_stage)` returns the ring index and label key for `SAPLING`, `JUVENILE`, `FIRST_FLOWERING` and `MATURE_BEARING`.
- Sections:
  - Hero (name, species, health pebble). The hero image is the latest `photo_key` from the timeline, or a token-coloured placeholder; never a stock photo.
  - Essence (family, habit, record pattern) and Growth rings.
  - This season: phase, do now / avoid / watch for.
  - Upcoming care: the next 3 pending tasks, linking to `/plants/:id/tasks`.
  - Timeline: paged, with photos via `useMediaUrl`.
  - Cycles: the latest two.
  - The "Season review" link and a Log-a-Moment button.

- [ ] **Step 1: Write the failing tests:**
  - `healthLabel` with a HIGH diagnosis 10 days ago → attention; 40 days ago → good; a LOW one → good.
  - The screen renders all sections from MSW data.
  - A timeline entry with `photo_key` requests one signed URL.
  - **404 `PLANT_NOT_FOUND` shows "This plant isn't in your garden" with a link to `/plants`, and no spinner remains (Review Focus #4).** The same check applies to `/plants/:id/tasks`, `/plants/:id/log` and `/plants/:id/season`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): tree biography with this season, care, timeline and cycles`.

### Task 16 (W12): Scan (identify and diagnose)

**Stitch:** Vision Scan `…/files/be7195adccf44bedaf52498188731bd8`. There are no Stitch result screens; follow the design system.

**Files:**
- Create in `web/src/features/scan/`: `api.ts`, `ScanScreen.tsx`, `IdentifyResultScreen.tsx`, `DiagnoseResultScreen.tsx`, `scan-state.tsx`, `index.ts`
- Test: `ScanScreen.test.tsx`, `DiagnoseResultScreen.test.tsx`, `IdentifyResultScreen.test.tsx`

**Interfaces:**
- Consumes: `canvasImageCompressor`, `usePlants`, `usePlantTasks`.
- Produces:
  - `identifySchema`: a loose object, displaying `common_name`, `scientific_name`, `description` and `care_summary` when they are strings or objects.
  - `diagnoseResponseSchema`: `diagnosis` holds `primary_issue`, `severity`, `confidence?`, `reasoning_summary`, `recommended_actions: string[]`, `symptoms: string[]`, `follow_up_days`. Also `persisted: boolean`, `session_id?`, `outcome_id?`, `log_ids?` and `task_id?|null`.
  - `useIdentify()` and `useDiagnose()`: `POST vision/identify` and `POST vision/diagnose` with `{ image_base64, plant_id?, note? }`.
  - `ScanStateProvider` keeps the compressed photo and the chosen mode/plant in memory across the scan → result screens, so a retry reuses it.
- Flow:
  - Scan: pick a mode (Identify / Diagnose); for Diagnose, pick the tree (required, from `usePlants`) and add an optional note. Take or upload a photo (compressed), then submit.
  - Identify result: show the details, with an "Add as a plant" button that goes to `/plants/new?prefill=<common_name>`.
  - Diagnose result: show the issue, severity, reasoning and actions, and "Saved to <tree>" with the follow-up task. It refetches that plant's tasks and shows the new task card.

- [ ] **Step 1: Write the failing tests:**
  - Diagnose with a tree sends `plant_id` and shows "Saved to Aam" with the follow-up task.
  - Identify → "Add as a plant" links with `prefill`.
  - **Each of `AI_NOT_CONFIGURED`, `AI_PROVIDER_ERROR`, `AI_RESPONSE_INVALID` and `RATE_LIMITED` shows its specific message with Retry. Retry resubmits the same compressed photo without reopening the camera (Review Focus #3).**
  - **Double-tapping Diagnose sends one request (Review Focus #5).**
  - Diagnose without a tree selected is blocked with an inline message.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): scan to identify or diagnose, saved to the tree`.

### Task 17 (W13): Season review

There is no Stitch screen; follow the design system (serif headline, pebble cards, no dividers).

**Files:**
- Create in `web/src/features/plants/`: `SeasonReviewScreen.tsx`
- Modify: `web/src/features/plants/api.ts` (`useMitigationPlan`)
- Test: `SeasonReviewScreen.test.tsx`

**Interfaces:**
- Produces:
  - `mitigationSchema`: `cycle_year|null`, `summary`, `likely_issues: string[]`, `what_to_change: string[]`, `watch_early: string[]`, `priority_actions: string[]`, `completed_tasks`, `skipped_tasks`, `pending_tasks`.
  - `useMitigationPlan(id)`.
- Layout:
  - Headline "Season <cycle_year>" and the summary.
  - Cards for "What likely went wrong", "Change next season", "Watch early" and "Do first".
  - Task follow-through (completed / skipped / pending) and the cycle comparison (latest two cycles from `useCycles`).
  - Empty state when `cycle_year` is null: "Log flowering, fruit set and harvest this season to get a review."

- [ ] **Step 1: Write the failing tests:**
  - Renders every list from MSW data.
  - The empty state shows when `cycle_year` is null.
  - An error shows retry.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(web): season review from the mitigation plan`.

### Task 18 (W14): App shell and routing

**Files:**
- Create: `web/src/app/App.tsx`, `web/src/app/routes.tsx`, `web/src/app/providers.tsx`, `web/src/app/ErrorBoundary.tsx`
- Modify: `web/src/main.tsx`
- Test: `web/src/app/routes.test.tsx`

**Interfaces:**
- Consumes: every feature's `index.ts`.
- Produces these routes:
  - Public: `/splash`, `/login`, `/login/otp`.
  - `RequireAuth`: `/onboarding/{language,region,garden}`.
  - `RequireAuth` + `RequireOnboarded`: `/` (Dashboard), `/plants`, `/plants/new`, `/plants/:id`, `/plants/:id/edit`, `/plants/:id/tasks`, `/plants/:id/log`, `/plants/:id/season`, `/tasks`, `/scan`, `/scan/identify`, `/scan/diagnose`, `/profile`.
  - `*` → a not-found screen.
- `BottomNav` appears on `/`, `/plants`, `/scan` and `/profile`.
- `ErrorBoundary` renders a recoverable "Something went wrong" with Reload, and calls `reportError`.

- [ ] **Step 1: Write the failing tests:**
  - Signed out, `/plants` redirects to `/login`.
  - Signed in with an incomplete profile, `/` redirects to `/onboarding/language`.
  - Signed in and complete, every main route renders its screen heading.
  - Bottom nav shows only on its four routes.
  - An unknown route shows not-found.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm run build && npm test && npm run check:boundaries && npm run check:cycles`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(web): app shell, routing and error boundary`.

### Task 19 (W15): End-to-end loop against the real backend

**Files:**
- Create: `web/playwright.config.ts`, `web/e2e/loop.spec.ts`, `web/e2e/fixtures/leaf.jpg` (a small real photo), `web/scripts/e2e-backend.sh`
- Modify: `web/package.json` (`e2e` script), `backend/.env.test.example` (`.env.e2e` keys documented)

**Interfaces:**
- `web/scripts/e2e-backend.sh` does the following:
  - It assumes the compose services are already up.
  - It sets `DATABASE_URL=…/bagicha_e2e`, `AI_PROVIDER=fake`, `NODE_ENV=test`, `WEB_ORIGINS=http://localhost:5173`, `AUTH_DEV_OTP_PHONE=+919999988888`, `AUTH_DEV_OTP_CODE=123456`, `RAZORPAY_WEBHOOK_SECRET=e2e`, `JWT_SECRET=e2e`.
  - It creates and resets `bagicha_e2e` (`prisma migrate reset --force --skip-seed` against **that URL only**, guarded: the script refuses unless the database name ends in `_e2e`).
  - It builds and starts the backend on `:3001`.
- Playwright `webServer` starts that script and `vite --port 5173` with `VITE_API_URL=http://localhost:3001/api/v1`.

- [ ] **Step 1: Write `loop.spec.ts`** (360×780 viewport). Sign in with `9999988888` / `123456`, then:
  1. Language English, then Region East India with district Patna, then Garden Trees.
  2. Add the tree "Aam" (species Mango, via catalogue search). The plant page opens.
  3. Dashboard shows at least one task this week; complete it, and it leaves the list.
  4. Log a Moment on Aam: type Flowering with the photo `leaf.jpg`. The timeline shows the entry with its image.
  5. Scan: Diagnose, tree Aam, upload `leaf.jpg`. The result shows "Pest" and "Saved to Aam", and the follow-up task appears.
  6. Open Season review for Aam; the summary is visible.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL until the wiring is right; fix any real defects found with a unit test first.
- [ ] **Step 3:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 4:** Commit: `test(web): end-to-end core loop against the real backend`.

### Task 20 (W16): Final verification and docs

**Files:**
- Modify: `web/README.md` (prereqs, env, `npm run dev`, how to run against the local backend, how to run e2e), `docs/api-changes-slice0.md` (Slice 1 section complete)

- [ ] **Step 1:** Walk `docs/coding-principles.md` §8 against the `web/` diff, applying spec §6. Record ✅ / fixed / not applicable (for client-irrelevant rules) as a "Web principles review" section at the bottom of `web/README.md`.
- [ ] **Step 2:** Check every Slice 1 screen at 360 px in the dev server against its Stitch screenshot. Record any intentional differences (the weather card, the health pebble, the plant detail sections) in the README.
- [ ] **Step 3:** Run the full verification:

```bash
cd web && npm run build && npm run lint && npm test && npm run check:boundaries && npm run check:cycles && npm run e2e
cd ../backend && npm run build && npm run lint && npm test && npm run check:cycles && bash scripts/check-boundaries.sh && npm run test:e2e
```

  Expected: every command exits 0.
- [ ] **Step 4:** Commit: `docs(web): README, principles review and slice 1 API notes`.
