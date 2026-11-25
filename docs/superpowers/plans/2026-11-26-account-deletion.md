# Account deletion: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (owner chose native execution). Steps use checkbox (`- [ ]`) syntax.

**Goal:** People can delete their account from Profile. It is erased for good 30 days later, and signing in during those 30 days offers to keep the account.

**Architecture:**
- Two new `users` columns mark a pending deletion.
- The default `jwt` strategy refuses pending accounts with a 403. A second strategy, `jwt-pending`, admits them on the three routes they may use.
- Community, chat and the weather audience filter out pending authors.
- A daily BullMQ scheduler erases due accounts: S3 by prefix first, then one database transaction.
- The web app gets a delete screen, a keep/continue screen and a public `/delete-account` page.

**Tech stack:** NestJS 11, Prisma 6 (Neon), BullMQ 5, MinIO client (S3), Jest. React with TanStack Query, Vitest and MSW.

**Spec:** `docs/superpowers/specs/2026-11-26-account-deletion-design.md`

## Global constraints

- docs/coding-principles.md §8.
- Notice period: exactly 30 days (`DELETION_NOTICE_DAYS = 30`). A repeat request keeps the first due date.
- Pending accounts may call only `DELETE user/deletion`, `POST auth/sign-out` and `POST auth/verify-otp`. Every other authenticated route returns 403 `ACCOUNT_DELETION_PENDING`.
- Logs carry the user id and counts only. They never include content, phone numbers or names.
- Kept after erasure: `applied_payments` rows and `audit_events` rows. In audit events, `snapshot.content_excerpt` and `snapshot.reason` are blanked to `null`.
- Hindi text is proposed for owner review and added to `HINDI_PENDING_REVIEW`. English shows as the fallback until the owner approves.
- Erasure order: S3 first, then the database transaction. The transaction re-checks `deletion_due_at <= now` before deleting.

## Review focus

1. A cancel that races the erasure run: the run's transaction re-checks the due date, and a cancelled account survives.
2. An S3 failure part-way: the user row still exists, so the next day's run retries. The failure goes to Sentry.
3. Another user's data shares a table (replies on the deleted person's posts are deleted; the other person's own posts, plants and payments are not). Pinned by an e2e test with two users.
4. A pending account's old token: it was revoked by the token-version bump, so the response is 401, not 403.
5. A webhook for an erased or pending account: the payment is recorded, nothing is applied, the response is 200, and the log asks for a refund.

---

### Task 1: State, user view and pending gate

**Files:**
- Modify: `backend/prisma/schema.prisma` (User: `deletion_requested_at DateTime?`, `deletion_due_at DateTime?`, `@@index([deletion_due_at])`).
- Create: `backend/prisma/migrations/20261126100000_account_deletion/migration.sql`.
- Modify: `user-view.ts` (adds `deletion_due_at: Date | null`).
- Modify: `user.repository.ts`.
- Modify: `auth/strategies/jwt.strategy.ts`.
- Create: `auth/strategies/jwt-pending.strategy.ts`.
- Modify: `auth.module.ts`; `auth.controller.ts` (sign-out uses `jwt-pending`).
- Test: `test/e2e/account-deletion.e2e-spec.ts` (gate part), `response-allow-list` if it lists user fields.

**Interfaces, produces:**
- `UserRepository.markForDeletion(userId, requestedAt: Date, dueAt: Date): Promise<User>`. Sets both columns only where `deletion_due_at` is null, bumps `token_version`, and returns the row.
- `UserRepository.clearDeletion(userId): Promise<User>`.
- Passport strategy names `'jwt'` (refuses pending) and `'jwt-pending'` (admits pending). Both share one validate helper: `validateTokenUser(users, payload) → User`.

- [ ] Failing e2e tests:
  - with `deletion_due_at` set directly in the DB and a fresh token, `GET plants` returns 403 with code `ACCOUNT_DELETION_PENDING`;
  - `POST auth/sign-out` returns 204;
  - a normal user is unaffected;
  - `verify-otp` returns `user.deletion_due_at`.
- [ ] Run and confirm they fail. Then add the migration and schema, run `npx prisma generate`, and write the code. Run again and confirm they pass.
- [ ] Commit `feat(account): pending-deletion state and gate`.

### Task 2: Request and cancel

**Files:**
- Create: `user/account-deletion.service.ts`, `user/account-deletion.service.spec.ts`.
- Modify: `user.controller.ts`, `user.module.ts` (needs AuditModule and the Clock), `audit/audit-action.ts`.

**Interfaces, produces:**
- `AccountDeletionService.request(userId): Promise<UserView>` sets due = now + 30 days and records audit `ACCOUNT_DELETION_REQUESTED`, with snapshot `{user_id, due_at}`.
- `AccountDeletionService.cancel(userId): Promise<UserView>` records audit `ACCOUNT_DELETION_CANCELLED`. It is idempotent: when nothing is pending, it records no audit event.
- Routes:
  - `POST user/deletion` (guard `jwt`, returns 200 with UserView);
  - `DELETE user/deletion` (guard `jwt-pending`, returns 200 with UserView).

- [ ] Failing tests:
  - unit, with a fixed clock: due = requested + 30 days exactly; a second request keeps the first due date;
  - e2e: after the request, the old token gets 401 (revoked); a new sign-in gets 403 on `GET plants`; `DELETE user/deletion` gives `deletion_due_at: null`, and `GET plants` then returns 200.
- [ ] Run and confirm they fail. Implement, then confirm they pass. Commit `feat(account): request and cancel deletion`.

### Task 3: Hide pending accounts from others

**Files:**
- Modify: `community/repositories/post.repository.ts` (`listVisible`, plus a visible-post lookup used by the routes that show a post), `comment.repository.ts` (`recentVerified`).
- Modify: `chat/message.repository.ts` (inbox, conversation and `userExists` exclude pending users, so sending to a pending user returns not found).
- Modify: `weather/weather-audience.repository.ts` (`deletion_due_at: null`).
- Test: extend `community.e2e-spec.ts`, `chat.e2e-spec.ts` and `weather-reminders.e2e-spec.ts`, or put the cases in `account-deletion.e2e-spec.ts`.

**Rule:** one shared where-fragment, `ACTIVE_AUTHOR = { deletion_due_at: null }`, exported from `user/index.ts`, applied as `author: ACTIVE_AUTHOR` or `{ id: notIn pending }`.

- [ ] Failing e2e tests:
  - user B's feed omits pending user A's post; that post's page returns 404;
  - B's inbox omits the conversation with A; B sending to A returns 404;
  - the weather run skips A.
- [ ] Run and confirm they fail. Implement, then confirm they pass. Commit `feat(account): hide pending accounts from others`.

### Task 4: Erasure

**Files:**
- Modify: `media/media.service.ts`. Adds `removeOwnerMedia(ownerId): Promise<number>`, which lists `<prefix>/<ownerId>/` for every `MEDIA_PREFIXES` value with `listObjectsV2(bucket, prefix, true)` and calls `removeObjects` in chunks of 1000. It throws on failure.
- Create: `user/erasure/account-eraser.repository.ts`, which exposes `eraseUser(userId, now): Promise<'erased' | 'not-due'>` and runs one transaction, in this order:
  1. re-check the due date;
  2. diagnosis outcomes and sessions for the user's plants (by `plant_id`, and by `subject_id` in the plant ids and cycle ids);
  3. journal entries, tasks, plant cycles, personalized overlays and plants (clear `replaced_by_id` first);
  4. garden places;
  5. comments on their posts and their own comments;
  6. reports by them or about their posts and comments;
  7. their posts;
  8. conversations and messages in either direction;
  9. user blocks in either direction;
  10. expert verification;
  11. blank `content_excerpt` and `reason` in the `COMMUNITY_REPORT_FILED` audit snapshots where `actor_user_id` = user, or `target_id` is in their posts and comments;
  12. the user row.
- Create: `user/erasure/account-erasure.service.ts`, which exposes `run(): Promise<{due, erased, failed}>`. It pages through due users by id in batches (default 50, `@Optional()` token). For each user it calls `removeOwnerMedia` then `eraseUser`. A failure for one user is logged and sent to `reportError`, and the run moves on to the next user.
- Create: `user/erasure/account-erasure.processor.ts`, with queue `account-erasure`, scheduler id `account-erasure-daily` and pattern `'30 3 * * *'` (tz Asia/Kolkata), following the weather reminder pattern with `logJobFailure`.
- Test: unit spec for the service (a media failure does not erase the row; one bad user does not stop the rest), and e2e `account-erasure.e2e-spec.ts` with a fake MediaService.

- [ ] Failing e2e test, two users. A has a plant (with a journal entry, a task and a cycle), a garden place, a post with B's reply, a comment on B's post, a report filed on B's post, a DM conversation with B and a block. A's `deletion_due_at` is in the past.
  - After `run()`, every A row is gone.
  - B's own post survives without A's comment. B's own plants survive.
  - A's `applied_payments` row survives.
  - The audit snapshot for A's report has `reason` and `content_excerpt` set to null.
  - Media removal was called with A's id.
  - Case: A cancelled (due null) means nothing is erased. Case: due in the future means nothing is erased.
- [ ] Run and confirm they fail. Implement, then confirm they pass. Commit `feat(account): daily erasure of due accounts`.

### Task 5: Late payments

**Files:**
- Modify: `subscription/subscription.service.ts` (`extendPremium`), plus its spec.

**Rule:** after `payments.record`, if the user is missing or `deletion_due_at` is set, apply nothing and log an error carrying `{paymentId, userId}` with the message `'Payment for a deleted or deleting account; refund manually'`. The result is `'refused'`, so the webhook answers 200.

- [ ] Failing unit tests:
  - a missing user means the payment is recorded, no update is made, and there is no throw;
  - a pending user means no update is made.
- [ ] Run and confirm they fail. Implement, then confirm they pass. Commit.

### Task 6: Web

**Files:**
- Modify: `features/auth/schemas.ts` (`deletion_due_at: z.string().nullable().optional()`), `useOtpForm.ts` / `homeFor` (pending accounts go to `/account/deletion-pending`).
- Modify: `features/profile/ProfileScreen.tsx` (a "Delete my account" link).
- Create:
  - `features/account/DeleteAccountScreen.tsx` (typed-DELETE confirm, `POST user/deletion`, then sign out locally);
  - `features/account/DeletionPendingScreen.tsx` (Keep: `DELETE user/deletion`, `updateUser`, go home; Continue: `POST auth/sign-out`, sign out);
  - `features/account/DeleteAccountInfoPage.tsx` (public, no sign-in);
  - `features/account/api.ts`, `index.ts`, `account.test.tsx`.
- Modify: `app/routes.tsx` (adds `/account/delete` and `/account/deletion-pending` behind the session, and `/delete-account` as a public route), `en.json`, `hi.json`, `locales.test.ts` (`HINDI_PENDING_REVIEW` gets the new keys).
- Delete-screen text lists what is deleted, the date (`format` in IST), and that premium is not refunded. The public page gives the steps and the contact email placeholder `[contact email]` (the owner fills it in, as in the privacy draft).

- [ ] Failing tests:
  - the confirm button stays disabled until DELETE is typed;
  - confirming calls the API and signs out;
  - a pending sign-in lands on the pending screen;
  - Keep calls DELETE and goes home;
  - Continue signs out;
  - the public page renders signed out.
- [ ] Run and confirm they fail. Implement, then confirm they pass, along with `npm run lint` and `npm run build`. Commit.

### Task 7: Docs and full check

- Modify: `docs/deploy.md`. Adds the migration, the release note (the new `account-erasure` scheduler and how to remove it) and the AWS gate (`s3:ListBucket`, `s3:DeleteObject`, version expiry when versioning is on).
- Run the full backend unit and e2e suites, plus web test, lint and build. Commit `docs(account): deploy notes`.
