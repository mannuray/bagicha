# Google sign-in (replaces phone + OTP)

Status: draft for owner approval, 2026-11-27.

## Intent

Budtale signs gardeners in with their Google account only. Phone number + one-time
code sign-in is removed completely. The owner chose this because no SMS provider is
connected (codes are shown on screen on the test server), Google sign-in costs
nothing per sign-in, and almost every Android phone in India already has a Google
account on it.

## Goals

- One way to sign in, on both the Android app and the website: **Continue with Google**.
- On Android, the native account picker (Credential Manager bottom sheet): one tap, no browser.
- On the website, Google's standard sign-in (Google Identity Services).
- A new gardener's **name and profile photo come from their Google account**; they can change both later in Profile.
- Everything after sign-in works as today: onboarding (language, region, garden), sessions,
  sign out of all devices, account deletion with its 30-day window, reminders.

## Non-goals

- No other providers (Apple, Facebook, email/password, phone).
- No general way for phone accounts to move to Google. Exactly one existing account is carried over
  (see Existing accounts); no self-service linking.
- No change to how sessions work after sign-in (our own JWT with `sub` + `tv`).

## Anti-goals (would be a failure even if it "works")

- The server trusting the app's word about who someone is. The server must verify Google's
  signed ID token itself (signature, issuer, audience, expiry, `email_verified`).
- Keying accounts by email. Accounts are keyed by Google's permanent account id (`sub`);
  a gardener who changes their Gmail address keeps their garden.
- A sign-in bypass reachable on any deployed server. The live server runs with `env=staging`,
  so "not production" is not a safe gate; there is no dev bypass on Render at all.
- Email shown to other gardeners, logged, or sent to Sentry.
- Overwriting a name or photo the gardener changed themselves.

## Decisions (owner's)

- Google only; phone + OTP removed from server, web and app.
- Existing accounts: **nothing is deleted**. The owner's real garden (the account whose phone ends
  2225: 11 plants, a garden place, history) is kept and moves to the owner's Google account. The
  other 8 accounts are "bogus"; they stay untouched until the owner explicitly says to erase them.
- The security log (`audit_events`, 17 rows, append-only by trigger) is kept as it is, including
  its old `phone_number_last4` snapshots. The append-only triggers are never touched.
- Take both name and profile photo from Google.

## Decisions (Claude's calls; owner may override)

**Server**
- New endpoint `POST /api/v1/auth/google` with body `{ id_token }`; verifies with
  `google-auth-library` (`OAuth2Client.verifyIdToken`), audience = the **web** OAuth client id
  (env `GOOGLE_CLIENT_ID`). On Android, Credential Manager is asked for a token for that same
  web client id (`serverClientId`), so one audience covers both platforms.
- Refuse tokens with `email_verified !== true`. Error codes in the existing style
  (e.g. `AUTH_GOOGLE_INVALID`).
- Response shape stays as `verify-otp` returns today (access token + user + is-new flag), so the
  web session code changes as little as possible.
- Keep the per-IP `auth` rate limit on the new endpoint. Delete `request-otp`, `verify-otp`,
  the OTP Redis keys, cooldown/daily/failure limits, `AUTH_EXPOSE_OTP`, `dev_otp`, the
  mock-user path and their tests.
- If `GOOGLE_CLIENT_ID` is not set, the server still starts, and `/auth/google` answers with
  a clear "sign-in not configured" error (same pattern as push without `FCM_SERVICE_ACCOUNT`).
- Audit `AUTH_SIGNED_IN` snapshot: user id and is-new only (no email, no phone).

**Data**
- `User`: drop `phone_number`; add `google_sub String? @unique` and `email String?`. Both are
  nullable so existing rows survive the migration. New accounts always have both; an account
  with no `google_sub` simply cannot be signed in to. `name` and `avatar_key` stay as they are.
- The migration deletes nothing: it adds the two columns, then drops `phone_number`. No row
  is removed and no trigger is changed.

**Existing accounts**
- Carry-over is by **verified email claim**: before the switch, the kept account gets its
  `email` set to the owner's Gmail (a one-off data step at deploy time, run by Claude through
  the Neon connection; the address is never committed to the repo). On a Google sign-in whose
  `sub` matches no account, the server looks for an account with **no `google_sub`** whose
  `email` equals the token's verified email (case-insensitive); if exactly one exists it is
  claimed (its `google_sub` set) and signed in, keeping all its data. Otherwise a new account
  is created.
- The claim keeps the existing name and photo (the "take from Google" rule applies to new
  accounts only).
- The 8 bogus accounts keep `email` null, so nothing can claim them. Erasing them, if the
  owner later says so, goes through the existing account-erasure job (it removes rows in order
  and their media), never a raw delete.
- Audit: a claim is recorded as sign-in with `claimed_existing: true` (user id only).
- Account erasure (the 30-day job) also erases `email` and `google_sub` with the rest of the user.
- The privacy policy's "if you cannot sign in, email us with your phone number" becomes "with
  your Google account email"; Profile shows "Signed in as <email>" instead of the phone number.
- Email is added to the user view returned to the gardener themselves (Profile can show
  "Signed in as …"), never to any public/other-user view.

**Name and photo**
- On **account creation only**: `name` = Google `name` (trimmed, cut to the existing name
  limit); photo = Google `picture`, downloaded once by the server and stored in our media
  storage as the avatar (same private `avatars/{userId}/…` keys and signed URLs as today),
  so the app never loads images from Google.
- Later sign-ins never touch name or photo. If the photo download or upload fails, sign-in
  still succeeds with no avatar (logged without personal data).

**Android app**
- Plugin: `@capgo/capacitor-social-login` (Google via Credential Manager, Capacitor 8). The
  builder may pick another only if it also uses Credential Manager and supports Capacitor 8;
  record why.
- Needs the Android OAuth client (package `com.budtale.app` + SHA-1 of the signing key: debug
  key for local builds, upload/app-signing key for Play) in the same Google Cloud project as
  Firebase.

**Website**
- Google Identity Services button/One Tap, loaded only on the sign-in screen. Web client id
  from `VITE_GOOGLE_CLIENT_ID` at build time.
- Update `web/vercel.json` CSP (both the enforced and report-only headers) for
  `accounts.google.com` (script, frame, connect, style as GIS requires).
- Authorised JavaScript origins: `https://bagicha-web.vercel.app` and `http://localhost:5173`
  for local development.

**Screens and text**
- Login screen: Budtale hero + one "Continue with Google" button (Google's branding rules for
  the button), a short line linking to the privacy policy and terms on budtale.vercel.app,
  and an error line for cancelled/failed sign-in. The OTP screen and its route are removed.
- New strings English first; Hindi falls back to English until the owner approves it.

**Policy and store listing** (same change set, wording for owner approval)
- Privacy policy (site/privacy): "Phone number" row becomes "Google account email, name and
  photo"; the sign-in provider row becomes Google (Sign-In); retention unchanged.
- Terms §2: "a phone number you control" becomes "a Google account you control".
- Play Data safety (owner does this when the build ships): untick Phone number, tick Email
  address; Name and Photos stay.

**Local development and tests**
- Backend unit/e2e tests stub the Google verifier behind an interface, in-process (no network).
- The web Playwright core-loop test (`web/e2e/loop.spec.ts`, real built backend) no longer signs
  in through the login screen: it seeds a user and puts a session token minted with the test
  `JWT_SECRET` into the page. No test-only switch ships in `dist`. The login screen keeps
  component tests with Google Identity Services stubbed.
- Local manual testing uses the real web client with the localhost origin; no bypass.

## Owner actions (Claude gives exact steps)

1. Create (or reuse) the Google Cloud / Firebase project for `com.budtale.app`.
2. OAuth consent screen (app name Budtale, support email, privacy URL
   https://budtale.vercel.app/privacy).
3. Create a **Web** OAuth client (origins above) and an **Android** OAuth client
   (package + SHA-1s).
4. Give Claude the web client id (not secret) for `GOOGLE_CLIENT_ID` on Render and
   `VITE_GOOGLE_CLIENT_ID` for the web build.
5. Optionally, later: say whether to erase the 8 bogus accounts.

## Deploy order

1. Web client id set on Render and in the web build env.
2. Data step: set the kept account's `email` (Neon connection). Migration (adds columns, drops
   `phone_number`; deletes nothing).
3. Push + Render deploy (server knows `/auth/google`, no longer `verify-otp`).
4. Vercel web build goes live (needs the server first).
5. APK rebuild with the plugin, test on the Redmi.

## Left to the builder

Component structure, exact error copy (within the decisions above), how the GIS script is
loaded, test layout, and file organisation, all within docs/coding-principles.md.
