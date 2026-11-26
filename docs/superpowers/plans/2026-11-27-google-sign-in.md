# Google Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace phone + OTP sign-in with Google sign-in on the server, website and Android app, keeping every existing row.

**Architecture:** The client (Google Identity Services on web, Credential Manager via `@capgo/capacitor-social-login` on Android) obtains a Google ID token for the *web* OAuth client id and posts it to `POST /api/v1/auth/google`. The server verifies it behind a `GoogleTokenVerifier` interface, finds the user by `google_sub` (or claims the one unclaimed account whose email matches), creates one otherwise (name + photo from Google), and returns the same `{ access_token, user }` as `verify-otp` does today. All OTP code is deleted.

**Tech Stack:** NestJS + Prisma (backend), `google-auth-library`, React + Vite + TanStack Query + Vitest/MSW (web), Capacitor 8, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-google-sign-in-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md` (review against its §8 checklist).
- Accounts are keyed by Google `sub`, never by email. Token audience = env `GOOGLE_CLIENT_ID` (the web client id); refuse `email_verified !== true`.
- No sign-in bypass in anything that ships in `backend/dist` (the live server runs `env=staging`). Tests stub the verifier in-process only.
- The migration deletes no rows and touches no trigger: add `google_sub String? @unique`, `email String?`, then drop `phone_number`.
- Name and photo from Google only when an account is **created**; never on later sign-ins or on a claim.
- Email: never logged, never in Sentry, never in any other-user view; returned only in the signed-in user's own `UserView`.
- No `GOOGLE_CLIENT_ID` → server starts; `/auth/google` answers 503 `AUTH_GOOGLE_NOT_CONFIGURED`.
- Audit `AUTH_SIGNED_IN` snapshot: `{ user_id, is_new_user, claimed_existing }` only.
- New web strings English only in `en.json`; Hindi falls back (add the prefix to `HINDI_PENDING_REVIEW` in `web/src/locales/locales.test.ts`).
- Owner's Gmail is never committed; the claim email is set by a data step at deploy.

## Review Focus

1. Two first sign-ins with the same new `sub` racing → one user, both get a token (unique-`sub` race, like today's unique-phone race). Test in Task 2.
2. Token whose email matches an unclaimed account but differs in case (`Mannu.Ray@Gmail.com`) → claims it. Test in Task 2.
3. Token for an account pending deletion → signs in to that account (the pending flow then offers to keep it), not a new account. Test in Task 2.
4. Google photo URL unreachable / not an image / huge → sign-in still succeeds with `avatar_key` null. Test in Task 2.
5. User cancels the Google picker (web popup closed, Android sheet dismissed) → no error banner, button usable again. Test in Task 4.

---

### Task 1: Schema, verifier and config

**Files:**
- Modify: `backend/prisma/schema.prisma` (User: remove `phone_number`, add `google_sub String? @unique`, `email String?` with `///` doc comments)
- Create: `backend/prisma/migrations/20261128100000_google_sign_in/migration.sql`
- Create: `backend/src/modules/auth/google-token-verifier.ts`
- Modify: `backend/src/config/env.validation.ts` (+ spec): add optional `GOOGLE_CLIENT_ID`; remove `AUTH_DEV_OTP_PHONE`, `AUTH_DEV_OTP_CODE`, `AUTH_EXPOSE_OTP` and the production check for it
- Modify: `backend/package.json` (add `google-auth-library`)
- Test: `backend/src/modules/auth/google-token-verifier.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GoogleIdentity { sub: string; email: string; name: string | null; picture: string | null }
  export abstract class GoogleTokenVerifier { abstract verify(idToken: string): Promise<GoogleIdentity> }
  export class GoogleAuthLibraryVerifier extends GoogleTokenVerifier // uses OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })
  ```
  `verify` throws `UnauthorizedError('AUTH_GOOGLE_INVALID', …)` for a bad/expired/wrong-audience token or `email_verified !== true`, and `ServiceUnavailableError`-style `AUTH_GOOGLE_NOT_CONFIGURED` (503, use the project's existing error class for 503) when `GOOGLE_CLIENT_ID` is unset.

- [ ] **Step 1: Failing tests** in `google-token-verifier.spec.ts`, with `OAuth2Client.prototype.verifyIdToken` stubbed:
  - `returns sub, email, name and picture for a verified token`
  - `refuses a token whose email is not verified` → rejects with code `AUTH_GOOGLE_INVALID`
  - `refuses when Google rejects the token` (stub throws) → `AUTH_GOOGLE_INVALID`
  - `answers not configured without GOOGLE_CLIENT_ID` → code `AUTH_GOOGLE_NOT_CONFIGURED`, status 503
  - `passes GOOGLE_CLIENT_ID as the audience`
- [ ] **Step 2:** `cd backend && npx jest src/modules/auth/google-token-verifier.spec.ts` → FAIL (module missing).
- [ ] **Step 3:** `npm i google-auth-library`; implement the verifier.
- [ ] **Step 4:** Schema change; write `migration.sql` by hand:
  ```sql
  ALTER TABLE "users" ADD COLUMN "google_sub" TEXT, ADD COLUMN "email" TEXT;
  CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
  DROP INDEX IF EXISTS "users_phone_number_key";
  ALTER TABLE "users" DROP COLUMN "phone_number";
  ```
  Check it matches `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script` against the local test DB **only** (never derive a shadow DB URL by editing a connection string).
- [ ] **Step 5:** Env validation: add `GOOGLE_CLIENT_ID`, delete the three OTP vars and their spec cases.
- [ ] **Step 6:** Verifier and env specs PASS. (The rest of the backend won't compile until Task 2; don't run the full suite here.)
- [ ] **Step 7: Commit** `feat(auth): Google token verifier, schema for Google accounts`

### Task 2: Server sign-in flow, OTP removed

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`, `auth.controller.ts`, `auth.module.ts`, `auth.service.spec.ts`
- Create: `backend/src/modules/auth/dto/google-sign-in.dto.ts` (`id_token: string`, `@IsString() @IsNotEmpty() @MaxLength(4096)`)
- Delete: `dto/request-otp.dto.ts`, `dto/verify-otp.dto.ts`, `otp-keys.ts`
- Modify: `backend/src/modules/user/user.repository.ts`, `user-view.ts`
- Create: `backend/src/modules/auth/google-avatar.ts`
- Modify (phone references, see grep below): `common/logging/log-fields.ts` (keep `phone*` and `email` in the refused list), `common/rate-limit/limits.ts` comment, `common/logging/safe-serializers.spec.ts`, `common/observability/error-reporting.spec.ts`, `common/redis/job-failure.spec.ts`, `backend/test/e2e/{fixtures,account-deletion,log-lines,push-devices,rate-limit,response-allow-list,safe-errors}.e2e-spec.ts`, the e2e app factory (`backend/test/e2e/app.ts`) to override `GoogleTokenVerifier` with a fake
- Create: `backend/test/e2e/google-sign-in.e2e-spec.ts`

**Interfaces:**
- Consumes: `GoogleTokenVerifier`, `GoogleIdentity` (Task 1).
- Produces:
  - `POST /api/v1/auth/google` body `{ id_token }` → 200 `{ access_token: string, user: UserView }`; `@RateLimit('auth')`.
  - `AuthService.signInWithGoogle(idToken: string): Promise<{ access_token: string; user: UserView }>`
  - `UserRepository.findByGoogleSub(sub: string): Promise<User | null>`
  - `UserRepository.claimByEmail(sub: string, email: string): Promise<User | null>`: one `UPDATE … SET google_sub = sub WHERE google_sub IS NULL AND lower(email) = lower(email) RETURNING *`, only if exactly one row matches (else null, nothing changed).
  - `UserRepository.createFromGoogle(identity: GoogleIdentity): Promise<{ user: User; created: boolean }>`: race-safe on unique `google_sub` like today's `findOrCreateByPhone`; sets `email`, `name` (trimmed, cut to the existing name max).
  - `UserRepository.updateEmail(id: string, email: string)` on every sign-in.
  - `UserView`: `phone_number` removed, `email: string | null` added.
  - `importGoogleAvatar(media: MediaService, userId: string, pictureUrl: string): Promise<string | null>`: fetch with a 5 s timeout and the upload size cap, `media.uploadImage(..., 'avatar', userId)`, returns the key or null on any failure (logs without the URL or email).

- [ ] **Step 1: Failing unit tests** in `auth.service.spec.ts` (replace all OTP tests), fake verifier and repository:
  - `signs in an existing Google account and refreshes its email`
  - `claims the one unclaimed account with the same email, keeping its name and photo` (assert `createFromGoogle` and `importGoogleAvatar` not called)
  - `claims regardless of email case`
  - `creates an account with the Google name and photo when nothing matches` (avatar key saved)
  - `still signs in when the photo import fails` (`avatar_key` null)
  - `audits sign-in with user id, is_new_user and claimed_existing only` (snapshot has exactly those keys)
  - `token carries sub and token version only`
- [ ] **Step 2:** `npx jest src/modules/auth` → FAIL.
- [ ] **Step 3:** Implement the service, repository methods, DTO, controller (remove `request-otp`/`verify-otp`), avatar import, `UserView` change. Then `grep -rnE "phone_number|findOrCreateByPhone|OTP|otp" backend/src backend/test | grep -v migrations` and fix each hit (device/push "phone" wording in notifications is about handsets; leave it).
- [ ] **Step 4: Failing e2e** `google-sign-in.e2e-spec.ts` with the fake verifier (maps token string → identity):
  - `a new Google account gets a session and lands in onboarding` (`user.email` set, `district` null)
  - `two simultaneous first sign-ins create one account`
  - `an account waiting to be deleted signs in to itself`
  - `an unverified or rejected token is refused with AUTH_GOOGLE_INVALID`
  - `the old OTP routes are gone` (`POST /auth/request-otp` → 404)
  - `the sign-in log line carries no email` (pattern of `log-lines.e2e-spec.ts`)
- [ ] **Step 5:** `npm test && npm run test:e2e` (backend) → all PASS; `npx tsc --noEmit` and lint clean.
- [ ] **Step 6: Commit** `feat(auth): sign in with Google; remove phone and OTP sign-in`

### Task 3: Web sign-in screen

**Files:**
- Create: `web/src/features/auth/google.ts`: `GooglePort` (like `PushPort`): `{ native: boolean; signIn(): Promise<string | 'cancelled'> }` with a web implementation (Google Identity Services, script `https://accounts.google.com/gsi/client` loaded on demand, client id `import.meta.env.VITE_GOOGLE_CLIENT_ID`) and a native one (Task 5 fills it); `GooglePortProvider` and `useGooglePort()`
- Modify: `web/src/features/auth/api.ts` (remove `useRequestOtp`, `useVerifyOtp`, `toE164India`; add `useGoogleSignIn()` posting `{ id_token }` to `/auth/google` with `verifyResponseSchema`, `onSuccess` → `signIn`)
- Modify: `LoginScreen.tsx` (one "Continue with Google" button per Google's branding, privacy/terms links to `https://budtale.vercel.app/privacy` and `/terms`, error line); delete `OtpScreen.tsx`, `useOtpForm.ts`, `useLoginForm.ts`, phone parts of `schemas.ts` and `nav-state.ts`, `phone.test.ts`; `index.ts` exports; `web/src/app/routes.tsx` (drop `/login/otp`)
- Modify: `web/src/lib/schemas` user schema (drop `phone_number`, add `email: string | null`), `web/src/test/render.tsx` `testUser`, `web/src/lib/api-client.test.ts`, `ProfileScreen.tsx` ("Signed in as {email}" via `t('profile.signedInAs', { email })`)
- Modify: `web/src/locales/en.json` (`auth.google`, `auth.googleFailed`, `auth.legal`, `profile.signedInAs`; remove unused phone/OTP keys), `locales.test.ts`
- Modify: `web/vercel.json` CSP (enforced + report-only): `script-src` + `https://accounts.google.com/gsi/client`, `frame-src https://accounts.google.com/gsi/`, `connect-src` + `https://accounts.google.com/gsi/`, `style-src` + `https://accounts.google.com/gsi/style`
- Modify: `web/.env.example` (and the `.env.production` comment): `VITE_GOOGLE_CLIENT_ID=`
- Test: `web/src/features/auth/auth.test.tsx` (replace OTP tests)

**Interfaces:**
- Consumes: `POST /auth/google` (Task 2).
- Produces: `GooglePort`, `GooglePortProvider`, `useGoogleSignIn()`; user schema with `email`.

- [ ] **Step 1: Failing tests** (fake `GooglePort`, MSW for `/auth/google`):
  - `signs in with Google and goes to onboarding for a new gardener` (posts `{ id_token: 'tok' }`)
  - `a returning gardener goes to the garden`
  - `a cancelled picker shows no error and the button works again` (Review Focus 5)
  - `a refused sign-in shows the failure line`
  - `links to the privacy policy and terms on budtale.vercel.app`
  - `profile shows the signed-in email`
- [ ] **Step 2:** `cd web && npx vitest run src/features/auth src/features/profile` → FAIL.
- [ ] **Step 3:** Implement; remove OTP code; `grep -rnE "phone_number|otp|Otp" web/src` and fix each (reminders' "phone" = handset, leave).
- [ ] **Step 4:** `npx vitest run && npx tsc -b --noEmit && npx oxlint src` → all PASS/clean.
- [ ] **Step 5: Commit** `feat(web): Continue with Google replaces phone sign-in`

### Task 4: End-to-end loop without OTP

**Files:**
- Modify: `web/scripts/e2e-backend.sh`: drop `AUTH_DEV_OTP_*`; after the truncate block, seed one user `{ id: 'e2e-gardener', google_sub: 'e2e-sub', email: 'e2e@example.test' }` with the backend's `PrismaClient` (same inline `node -` style)
- Modify: `web/e2e/loop.spec.ts`: replace the OTP steps with: screenshot `/login` (`01-login`, the Google button is visible), then mint an HS256 JWT `{ sub: 'e2e-gardener', tv: 0 }` with `node:crypto` and the script's `JWT_SECRET` (`e2e-secret`), set `localStorage['bagicha.token']` via `page.addInitScript`, `goto('/')` and continue at onboarding unchanged
- Create: `web/e2e/session.ts` (`mintSession(secret, sub): string`)

- [ ] **Step 1:** Run `npm run e2e` (web) before changes → FAIL (phone field gone after Task 3).
- [ ] **Step 2:** Make the changes.
- [ ] **Step 3:** `npm run e2e` → PASS, screenshots written.
- [ ] **Step 4: Commit** `test(e2e): core loop signs in with a seeded session`

### Task 5: Android Google sign-in

**Files:**
- Modify: `web/package.json` (`@capgo/capacitor-social-login`, Capacitor 8 compatible version; record it)
- Modify: `web/src/features/auth/google.ts` native implementation: `SocialLogin.initialize({ google: { webClientId: VITE_GOOGLE_CLIENT_ID } })`, `SocialLogin.login({ provider: 'google', options: {} })` → `idToken`; user-dismissed → `'cancelled'`
- Modify: `web/src/app/providers.tsx` (pick native vs web port with `Capacitor.isNativePlatform()`)
- Run: `npx cap sync android`
- Test: `web/src/features/auth/google.test.ts` (plugin module mocked)

- [ ] **Step 1: Failing tests:** `native sign-in returns the plugin's ID token`, `a dismissed account sheet returns cancelled`, `initialises with the web client id`.
- [ ] **Step 2:** `npx vitest run src/features/auth/google.test.ts` → FAIL.
- [ ] **Step 3:** Implement, `npx cap sync android`, `cd android && ./gradlew assembleDebug` → BUILD SUCCESSFUL.
- [ ] **Step 4:** Full web suite PASS.
- [ ] **Step 5: Commit** `feat(android): Google account picker sign-in`

### Task 6: Policy, docs and config

**Files:**
- Modify: `site/privacy/index.html`: "Phone number" row → "Google account email, name and photo" / "To sign you in and recover your account" / "Nobody; never shown to other gardeners"; provider row `[SMS or Google sign-in provider]` → `Google (Sign-In)` / `Sign-in` / `Google servers`; deletion bullet "with your phone number" → "with your Google account email"
- Modify: `site/terms/index.html` §2: "Give a phone number you control…" → "Sign in with a Google account you control and keep it to yourself."
- Modify: `render.yaml` (`GOOGLE_CLIENT_ID`, `sync: false`; remove OTP vars), `backend/.env.example`, `docs/deploy.md` (new env, OAuth client setup, deploy order from the spec)
- Test: `grep -rniE "phone number|otp" site docs/deploy.md render.yaml` returns only intended hits

- [ ] **Step 1:** Edit; run the grep; open `site/privacy/index.html` in a browser at 390px, no sideways scroll.
- [ ] **Step 2: Commit** `docs: privacy, terms and deploy notes for Google sign-in`

## Deploy (not part of the build; each step needs the owner)

1. Owner creates the OAuth clients; Claude sets `GOOGLE_CLIENT_ID` on Render and `VITE_GOOGLE_CLIENT_ID` for the web build.
2. Before the migration, look up and note the kept account's user `id` (phone ending 2225); the phone column is gone afterwards.
3. Apply migration `20261128100000_google_sign_in` (deletes nothing), then the data step (Neon connection): set `email` on that `id` to the owner's Gmail. (The `email` column only exists after the migration; this ordering corrects the spec's step 2.)
4. Push main, Render deploy, Vercel build; redeploy `site/`.
5. APK rebuild, Redmi test: sign in with the owner's Gmail lands in the 11-plant garden.
