# Push notifications: garden reminders on the phone

Status: draft for owner review (2026-11-26).

## Why

Bagicha already makes tasks: care-calendar tasks for every plant and, each
morning at 05:00 IST, weather tasks (heavy rain, hot day, cold night). But a
gardener only sees them by opening the app. Watering and other jobs happen
when people actually go out to the garden, in the morning or the evening, so
that is when the phone should remind them.

## What the owner decided

- **Tasks are the subject.** Watering above all, and any other due task.
- **One notification per slot.** Two slots a day, morning and evening. Never
  one buzz per task.
- **Gardeners choose their own times** for each slot, and can turn either off.
- **The server sends** the notifications, through Firebase Cloud Messaging
  (FCM). The phone does not schedule them itself. Reasons: only the server
  always knows what is due right now (weather tasks are added overnight);
  Xiaomi and similar phones kill background apps, and FCM high-priority
  messages are the path they let through; a task done on the website must
  not still be nagged about on the phone.

## Goals

- At each enabled slot, a gardener with something due gets one notification
  summing up what needs doing.
- It is always current: built from the database at send time, weather tasks
  included.
- Gardeners control it: two times, each can be switched off, in the profile.
- Tapping it opens the app on the tasks screen.

## Non-goals (for now)

- Web push in the browser. Android app only.
- iPhone. FCM can carry it later through the same sender.
- Pushes for chat, community, diagnosis results or anything other than tasks.
- Per-task, snooze or "mark done" actions inside the notification.
- Marketing or re-engagement messages.

## Anti-goals (failure even if it "works")

- More than two notifications a day from us, or the same slot twice in a day.
- A notification when nothing is due.
- Nagging about plants that are dead, removed or belong to a deleted account.
- A wrong time zone: every time is India time (Asia/Kolkata).
- Push IDs or task contents in the logs. Logs hold counts only, as the
  weather run does (`common/logging/log-fields.ts` allow-list).

## How it behaves

### Slots and times

- Each user has a **morning time** and an **evening time**, each either a
  time of day or off.
- Defaults: morning **07:00**, evening **18:00**, both on. *(My call.)*
- Times are picked in **15-minute steps**. Morning between **06:00 and
  11:45**, evening between **15:00 and 21:45**. *(My call: the weather run
  finishes around 05:00, so a morning slot before 06:00 could miss that
  day's weather tasks; the ranges keep night-time buzzes out.)*
- Stored on the user as minutes after midnight IST, nullable for off.
  *(My call.)*
- The defaults are harmless for existing users: nobody gets anything until
  their phone has granted permission and registered with the API.

### What a notification counts

- PENDING tasks on the user's **living** plants (the same rule the weather
  run uses for its audience), with a due date from **7 days ago up to the end
  of today** (IST). *(My call on the 7 days: overdue work is still worth a
  nudge for a week, after that it is noise; the tasks screen still shows it.)*
- The **evening** slot counts what is still undone today (tasks done since
  the morning drop out) **plus tomorrow-dated weather tasks**
  (`source = WEATHER`): a cold night or heavy rain dated tomorrow is often
  about tonight, and the evening is when plants get covered or drains
  cleared. *(Owner decided, 2026-11-26.)* Other tomorrow tasks are not
  included.
- Nothing counted → nothing sent.

### What it says

- Title: "3 garden tasks today" / "1 garden task today". An evening
  notification that includes any tomorrow-dated weather task says
  "3 garden tasks for tonight and tomorrow" instead, and puts the weather
  tasks first in the body.
- Body: the first two task titles with their plant names, then "+N more"
  if there are more. Watering tasks go first, then by priority (HIGH first),
  then by due date. Titles come from the existing task titler
  (`plant-ledger/domain/task-titles.ts`) and plant namer, so they match the
  app.
  Example: "Water the plant (Tomato) · Feed the plant (Mango) · +1 more".
- Language: the user's `language_pref` (en or hi). The few new Hindi strings
  go through the usual owner review before shipping; English is used until
  approved, as `locales.test.ts` allows.
- Tap → opens the app at `/tasks`.
- Android shows it in a channel named "Garden reminders", so the gardener
  can mute it from Android settings too. The app creates the channel at
  start-up; the server sends a high-priority notification message naming
  that channel and carrying the `/tasks` route as data.

### Asking permission (phone)

- Android 13+ needs a runtime permission. The app asks **once**, after
  sign-in, from a small card on the home screen that explains it ("Get a
  morning and evening reminder of your garden tasks") with "Turn on" and
  "Not now". *(My call: asking with context gets more yeses than a cold
  system prompt at launch.)*
- The profile has a "Reminders" section: the two times with on/off
  switches. If the phone's permission is off, it says so and offers to open
  the app's Android settings.
- On the website (no push), the profile section is hidden. *(My call.)*

## How it is built

### Firebase (owner action, free)

- The owner creates a Firebase project and adds the Android app
  `com.bagicha.app`.
- `google-services.json` goes in `web/android/app/` (not a secret; committed).
- A service-account key for the backend goes on Render as one env var
  (base64 JSON, e.g. `FCM_SERVICE_ACCOUNT`). Never logged or committed.
  The API starts without it and simply does not send (logs once at boot),
  so dev and tests need no Firebase.

### Phone (Capacitor)

- `@capacitor/push-notifications`.
- After permission is granted, the app registers and sends its FCM token to
  the API. It re-sends on every app start and on token refresh (cheap, keeps
  `last_seen_at` fresh).
- Sign-out needs no extra call from the app: the server drops the devices
  (see Backend).
- Tapping a notification navigates to `/tasks`.

### Backend

- **New module** `notifications` following the existing module shape.
- **Data** (one migration):
  - `push_devices`: id, user_id → users, `token` (unique), platform
    (`ANDROID` for now), created_at, last_seen_at. A token moving to another
    account is reassigned (upsert by token).
  - `users.reminder_morning_min`, `users.reminder_evening_min`: nullable
    small ints, defaults 420 and 1080.
  - `reminder_sends`: user_id, slot (MORNING/EVENING), ist_date, unique on
    all three. Written before sending, so a retried or overlapping job never
    sends the same slot twice in a day. Rows older than ~30 days are pruned
    by the same job.
- **API:**
  - `PUT /user/devices` {token, platform} → upsert.
  - `DELETE /user/devices/:token` → remove (own tokens only).
  - Reminder times ride on the existing profile: written with
    `PATCH /user/profile` and returned in the user payload the session
    already carries, validated to the ranges and 15-minute steps.
    *(My call: the repo has no `/me` routes.)*
- **Sign-out:** `POST /auth/sign-out` already ends every session of the
  user, so it also deletes all of the user's `push_devices`. A signed-out
  phone never gets reminders that would open on the login screen.
  *(My call.)*
- **Sending:** a BullMQ job scheduler every 15 minutes, IST
  (`*/15 * * * *`, `tz: Asia/Kolkata`), registered like
  `WeatherReminderSchedule` (fixed scheduler id, upserted on boot). Each run:
  1. Works out the current IST quarter-hour and which slot(s) it matches.
  2. Finds users whose morning or evening time equals that quarter-hour, who
     have at least one device and are not pending deletion, in batches.
  3. For each: claim the `reminder_sends` row (skip if already there), count
     tasks, and if any, send one FCM message to each of their devices. If
     FCM fails for **all** of a user's devices with a temporary error, the
     claim is released so the job's retry (within the same quarter-hour)
     can try again; one device succeeding keeps the claim.
  4. Tokens FCM reports as unregistered or invalid are deleted, and so are
     devices not seen for 60 days (an uninstalled app stops re-registering).
     *(My call.)*
  5. Logs a summary of counts (users, sent, skipped-empty, failed,
     tokens-removed).
  A run that starts late (deploy, Redis hiccup) still sends that quarter's
  slot; a missed quarter is not caught up later. *(My call: a 07:00 reminder
  arriving at 09:30 is worse than none.)*
- FCM is behind a small `PushSender` interface so tests use a fake, as the
  weather providers do.
- **Account deletion:** erasure deletes the user's `push_devices` and
  `reminder_sends`, and a user with a deletion request gets no pushes
  (add to `account-erasure` and its tests).
- **Privacy policy:** add the push token and Firebase (Google) as a
  processor. Owner reviews the wording.

## Testing

- Unit: slot matching for a given IST time; the task count window (7 days
  back, end of today, living plants, PENDING only); message composition
  (ordering, "+N more", singular/plural, Hindi/English); the once-per-slot
  claim and its release when every device fails; evening inclusion of
  tomorrow-dated weather tasks only; invalid and stale tokens removed.
- E2E: device upsert/delete (own only), reminder times on
  `PATCH /user/profile` with range and step validation, sign-out removes
  all the user's devices, erasure removes devices.
- Manual: on the Redmi, a slot set a few minutes ahead arrives with the
  right text and opens `/tasks`; with the app killed; after sign-out nothing
  arrives.

## Left to the builder

- Exact file layout inside the module, DTO names, batch size.
- The home-screen permission card's look (follow the existing card style).
- Whether to send to multiple devices with one multicast call or one each.

## Branch

Built on `main` after merging `capacitor-android` into it (owner decided,
2026-11-26), so backend, web and the Android shell move together.

## Release order

1. Owner: Firebase project, `google-services.json`, service-account key.
2. Neon migration, then push main (backend + web), deploy Render with
   `FCM_SERVICE_ACCOUNT` set.
3. Build and install the Android app; test on the Redmi.
