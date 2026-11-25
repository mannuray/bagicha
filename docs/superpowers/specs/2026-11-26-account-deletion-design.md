# Account deletion: design

Status: draft for owner approval (2026-11-26)

## Why

Google Play requires apps with accounts to let people delete them, both inside the app and from a web page that works without the app. India's DPDP Act requires erasing personal data once consent is withdrawn, unless another law requires it to be kept. The privacy policy draft promises deletion. Bagicha has no way to delete an account today.

## Goals

- "Delete my account" in Profile (web app; the Android app later uses the same API).
- A **30-day notice period** (owner's choice). The account is erased for good on day 30.
- Signing in during those 30 days asks the person whether to keep the account. **Keep:** deletion is cancelled. **Continue:** deletion stays scheduled and they are signed out (owner's choice).
- Erasure removes everything the person created, including community posts and replies and direct messages, from Neon and from S3.
- Only what the law needs is kept, and the privacy policy names it.
- A public web route that satisfies Play's "request deletion without the app" rule.

## Non-goals

- Data export (the "download my data" right stays email-only for now).
- An admin screen for deletion requests.
- Notifying the person by SMS, email or push before erasure: there is no channel yet. The DPDP Rules' 48-hour notice (Rule 8) takes effect 13 May 2027; revisit before then.
- Purging old audit events after a year (a separate retention job, later).

## Anti-goals (a failure even if it technically works)

- An account that is "deleted" but whose data is still in the database or on S3 after day 30.
- Deleting the wrong person's data, or another user's own plants or posts.
- A deleted person's content still visible to others during the 30 days.
- A person locked out with no way to cancel during the 30 days.
- A half-finished erasure (the job dies part-way) that is never completed.

## What the person sees

1. **Profile → "Delete my account".** A screen lists what will be deleted, says it happens 30 days from now on <date>, says premium already paid is not refunded, and asks them to type DELETE to confirm. My call: typing a word, because it's irreversible after day 30.
2. On confirm, they are signed out on every device.
3. **Signing in during the 30 days** shows only one screen: "Your account will be deleted on <date>. Keep my account? / Continue with deletion". Keep cancels and opens the app as usual. Continue signs them out; the date doesn't change.
4. **After day 30** the phone number is free; signing in creates a brand-new, empty account.
5. **Public page** `/delete-account` on the web app (no sign-in needed): how to delete from Profile, that the web app works without installing anything, and the contact email as a fallback. This URL goes into the Play listing.

All text in English and Hindi; the Hindi goes to the owner for approval before shipping.

## How it works

### State

- Two new columns on `users`: `deletion_requested_at` and `deletion_due_at` (both null normally). Migration needed (deploy order per docs/deploy.md).
- Requesting sets both (due = requested + 30 days), bumps `token_version` (signs out everywhere), and writes an audit event. Cancelling clears both and writes an audit event.
- The request is idempotent: asking twice keeps the first due date.

### While pending

- Sign-in still succeeds (that's how they reach the keep/continue screen). The user view carries `deletion_due_at`.
- A pending account may only call: get own profile, cancel deletion, sign out. Every other authenticated route answers 403 `ACCOUNT_DELETION_PENDING`. My call: enforced on the server, not only hidden in the web app.
- Their posts, replies and profile are hidden from everyone else (feeds, post pages, comments, search, messages list). Other people can't message them.
- Daily jobs (weather reminders, tree care, seasonal) skip them.

### Erasure (day 30)

- A daily BullMQ job scheduler (like the weather reminder job, its own fixed scheduler id) picks users whose `deletion_due_at` has passed, in batches.
- Per user, in this order, so a crash part-way is safely re-run the next day:
  1. **S3:** delete every object under `posts/<id>/`, `vision/<id>/`, `journal/<id>/`, `avatars/<id>/` (list by prefix and delete). The user row still exists, so a crash here is retried.
  2. **Database, one transaction:** delete, for this user: plants and everything hanging off them (journal entries, tasks, plant cycles, personalized overlays, diagnosis sessions and outcomes), garden places, posts (with all comments on them, including other people's replies), their comments elsewhere, reports they filed and reports about their content, direct messages sent and received plus the conversation rows, blocks in either direction, expert verification, and finally the user row.
  3. **Redis:** remove any keys tied to the user or phone number (OTP and rate-limit keys expire anyway; a sweep is my call only if any long-lived per-user key exists).
  4. **Audit snapshots (my call):** inside the same transaction, blank the person's words in kept audit events: `content_excerpt` on report events about their content, and `reason` on reports they filed. Action, ids and dates stay.
- **A payment that arrives late (my call):** if a Razorpay webhook lands for a pending or erased account, record it in `applied_payments` against the id, apply nothing, log it for a manual refund, and answer 200 so Razorpay stops retrying.
- Re-checks inside the transaction that the account is still due (a last-minute cancel wins).
- Logs only the user id and counts, never content.

### Kept after erasure (privacy policy must say so)

- `applied_payments` rows (payment id, plan, date, user id as an opaque id): tax and accounting law. Razorpay keeps its own records.
- `audit_events` (opaque user id, action, small snapshot): security, one year. Note: the sign-in snapshot holds the phone number's last four digits.
- Error reports in Sentry already carry no user data.
- Google Gemini: Bagicha stores nothing there; nothing to ask.

## Effects on other people (accepted)

- Replies other people wrote under a deleted person's post disappear with the post.
- A direct-message conversation with a deleted person disappears from the other person's inbox.

## Left to the builder

- Exact route names (proposed `POST me/deletion`, `DELETE me/deletion`).
- How the "pending" restriction is enforced (guard, or a check in the JWT strategy).
- Batch size and the job's time of day.
- Whether Prisma cascades or explicit deletes do the database step (explicit is likely clearer, since most relations have no cascade today).

## Gates

- Migration for the two columns, applied per docs/deploy.md.
- **AWS (owner, in the console):** the media IAM user needs `s3:ListBucket` and `s3:DeleteObject` on the bucket, or the S3 step fails every day. If bucket versioning is on, add a lifecycle rule that expires old versions.
- **Backups:** Neon keeps restore history (its history window), so erased rows stay recoverable for that long. The privacy policy says backups are kept for a limited time and expire on their own.
- The job reports a failed erasure to Sentry, so a stuck one is seen.
- Owner approval of the screen text and its Hindi.
- Privacy policy text updated to match: "30 days after you ask", the kept data above, and the `/delete-account` page.
- If the owner switches sign-in to Google, the flow is unchanged; only "phone number is free" becomes "Google account is free".
