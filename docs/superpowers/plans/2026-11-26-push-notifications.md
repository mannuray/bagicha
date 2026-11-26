# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Morning and evening push notifications on the Android app, at times each gardener picks, summing up their due garden tasks.

**Architecture:** A new backend module `notifications` stores phone push tokens and, every 15 minutes (IST), finds gardeners whose slot is now, counts their due tasks and sends one FCM message per phone through a `PushSender` port. Reminder times live on `users` and travel through the existing profile endpoint. The Capacitor app registers its token, creates the Android channel, asks permission from a home-screen card and shows a Reminders section in the profile.

**Tech Stack:** NestJS 11, Prisma 6 (Neon), BullMQ job schedulers, `firebase-admin` (FCM HTTP v1), React + Vite + TanStack Query, `@capacitor/push-notifications` 8.x, Vitest, Jest.

**Spec:** `docs/superpowers/specs/2026-11-26-push-notifications-design.md`

## Global Constraints

- Code meets `docs/coding-principles.md`; review against its §8 checklist.
- Every time is IST (`Asia/Kolkata`). Times are minutes after midnight IST.
- Defaults: morning 420 (07:00), evening 1080 (18:00). Steps of 15. Morning 360–705 (06:00–11:45), evening 900–1305 (15:00–21:45). `null` = off.
- At most one notification per user per slot per IST date; nothing when nothing is due.
- Counted: PENDING tasks on living plants (`ended_at: null`) of active accounts (`ACTIVE_ACCOUNT`), due from 7 days ago (IST date) to end of today; the evening slot also counts `source = WEATHER` tasks due tomorrow.
- Logs hold counts only; no tokens, task titles or plant names (`common/logging/log-fields.ts`).
- The API boots without `FCM_SERVICE_ACCOUNT` and then sends nothing (one warn log at boot).
- New Hindi text is drafted, listed in `HINDI_PENDING_REVIEW` (web) / behind a not-approved flag (backend), and falls back to English until the owner says yes.
- Commit after each task; nothing is pushed or deployed without the owner's go.

## Review Focus

1. A user who changes their time to the current quarter-hour after the slot already ran today gets no second notification that day (the `reminder_sends` claim) — pinned in Task 7.
2. One of a user's two phones has a dead token: the other still gets the notification, the dead token is deleted, the claim is kept — pinned in Task 7.
3. Tasks on an ended plant, a cancelled/completed task, or a pending-deletion account never reach a notification — pinned in Task 7's repository e2e.
4. The IST day boundary: a 06:00 IST run (00:30Z) counts today's IST tasks, not yesterday's UTC date; a 21:45 evening run counts tomorrow's weather — pinned in Tasks 2 and 7.
5. A shared phone: user A signs out, user B signs in on the same phone and registers the same token — it moves to B, and A gets nothing — pinned in Task 5.

---

### Task 1: Schema and migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20261127100000_push_notifications/migration.sql`

**Interfaces:**
- Produces: Prisma models `PushDevice` (`push_devices`: `id` uuid, `user_id` → users, `token` String @unique, `platform` PushPlatform, `created_at`, `last_seen_at` DateTime @default(now())), `ReminderSend` (`reminder_sends`: `user_id`, `slot` ReminderSlot, `ist_date` String `YYYY-MM-DD`, `created_at`; `@@id([user_id, slot, ist_date])`, `@@index([created_at])`), enums `PushPlatform { ANDROID }`, `ReminderSlot { MORNING EVENING }`; `User.reminder_morning_min Int? @default(420) @db.SmallInt`, `User.reminder_evening_min Int? @default(1080) @db.SmallInt`, relations `push_devices PushDevice[]`, `reminder_sends ReminderSend[]`; indexes `@@index([reminder_morning_min])`, `@@index([reminder_evening_min])` on users, `@@index([user_id])` and `@@index([last_seen_at])` on push_devices.

- [ ] **Step 1:** Add the models, enums and columns above to `schema.prisma` (doc-comment each, as the file does).
- [ ] **Step 2:** Generate the SQL with `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script` against the local test DB's shadow (never derive a shadow URL with sed; use the project's documented shadow setup) and save it as the migration above. Read the SQL: two `ALTER TABLE users ADD COLUMN ... DEFAULT`, two `CREATE TABLE`, FKs `ON DELETE CASCADE` for both new tables.
- [ ] **Step 3:** Run `npx prisma validate && npx prisma generate && npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 4:** Commit `feat(notifications): push devices, reminder sends and reminder times schema`.

### Task 2: Slot rules (pure domain)

**Files:**
- Create: `backend/src/modules/user/reminder-times.ts` (exported from `user/index.ts`: reminder times are profile data, and `notifications` already depends on `user`; putting them in `notifications` would make `user` ↔ `notifications` import each other)
- Test: `backend/src/modules/user/reminder-times.spec.ts`

**Interfaces:**
- Consumes: `istDate(d: Date): string` from `weather/domain/weather-events` (via `../../weather` public index; export it there if not exported).
- Produces:
  - `REMINDER_RANGES: Record<ReminderSlot, { min: number; max: number; default: number }>` = MORNING {360, 705, 420}, EVENING {900, 1305, 1080}.
  - `REMINDER_STEP = 15`.
  - `allowedMinutes(slot: ReminderSlot): number[]` (every step in range, inclusive).
  - `istQuarter(now: Date): { istDate: string; minute: number }` — minute of the IST day floored to 15.
  - `countWindow(istDate: string): { fromDate: string; toDate: string; tomorrow: string }` — fromDate = istDate − 7 days, toDate = istDate, tomorrow = istDate + 1.

- [ ] **Step 1: Failing tests**
```ts
expect(allowedMinutes('MORNING')).toHaveLength(24);
expect(allowedMinutes('MORNING')[0]).toBe(360);
expect(allowedMinutes('EVENING').at(-1)).toBe(1305);
expect(istQuarter(new Date('2026-11-27T00:30:00Z'))).toEqual({ istDate: '2026-11-27', minute: 360 });
expect(istQuarter(new Date('2026-11-27T01:44:59Z'))).toEqual({ istDate: '2026-11-27', minute: 435 });
expect(istQuarter(new Date('2026-11-26T18:29:00Z'))).toEqual({ istDate: '2026-11-26', minute: 1425 });
expect(countWindow('2026-12-03')).toEqual({ fromDate: '2026-11-26', toDate: '2026-12-03', tomorrow: '2026-12-04' });
```
- [ ] **Step 2:** `npx jest src/modules/user/reminder-times` → FAIL (module missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(notifications): reminder slot rules`.

### Task 3: Notification text (pure domain)

**Files:**
- Create: `backend/src/modules/notifications/domain/reminder-message.ts`
- Test: `backend/src/modules/notifications/domain/reminder-message.spec.ts`

**Interfaces:**
- Produces:
  - `interface ReminderTask { type: TaskType; title: string; plantName: string; priority: TaskPriority; dueDate: string; weather: boolean; tomorrow: boolean }` (title and plantName already localised by the caller).
  - `composeReminder(tasks: ReminderTask[], lang: Lang): { title: string; body: string } | null`.
  - `REMINDER_HINDI_APPROVED = false` — while false, `lang: 'hi'` uses the English frame (task titles and plant names still arrive in Hindi).

Copy (exact, English): title `"{n} garden task today"` / `"{n} garden tasks today"`; when any task has `tomorrow: true`: `"{n} garden task for tonight and tomorrow"` / `"{n} garden tasks for tonight and tomorrow"`. Body: up to two items `"{title} ({plantName})"` joined by `" · "`, then `" · +{k} more"` when k > 0. Hindi drafts (pending owner review): `"आज बगीचे का {n} काम"` / `"आज बगीचे के {n} काम"`; tomorrow variant `"आज रात और कल बगीचे का/के {n} काम"`; more `"+{k} और"`.

Order: if any `tomorrow`, weather tasks first; then `type === 'WATER'` first; then priority HIGH > MEDIUM > LOW; then `dueDate` ascending (overdue first).

- [ ] **Step 1: Failing tests** — `returns null for no tasks`; `one task: singular title and no "+more"` (`{ title: '1 garden task today', body: 'Water the plant (Tomato)' }`); `three tasks: watering first, then HIGH, then "+1 more"` (body `'Water the plant (Tomato) · Spray neem (Mango) · +1 more'` from inputs ordered FEED/LOW, TREAT/HIGH "Spray neem", WATER/MEDIUM); `tomorrow weather task leads and changes the title` (`'2 garden tasks for tonight and tomorrow'`, body starts with the weather task); `Hindi frame stays English while not approved`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** Commit `feat(notifications): reminder text`.

### Task 4: Reminder times on the profile

**Files:**
- Modify: `backend/src/modules/user/dto/update-profile.dto.ts`, `backend/src/modules/user/user-view.ts`, `backend/src/modules/user/user.service.ts` (only if it whitelists fields)
- Test: `backend/test/e2e/profile-reminders.e2e-spec.ts` (new), unit spec next to user-view if one exists

**Interfaces:**
- Consumes: `allowedMinutes` (Task 2, same module).
- Produces: `UpdateProfileDto.reminder_morning_min?: number | null`, `reminder_evening_min?: number | null` validated with `@IsOptional() @IsIn([...allowedMinutes(slot), null])`; `UserView.reminder_morning_min: number | null`, `reminder_evening_min: number | null`.

- [ ] **Step 1: Failing e2e:** `PATCH /user/profile {reminder_morning_min: 405}` → 200 and body has 405; `{reminder_evening_min: null}` → 200, null; `{reminder_morning_min: 300}` → 400; `{reminder_morning_min: 410}` → 400; `{reminder_evening_min: 420}` → 400; a new user's view has 420 and 1080.
- [ ] **Step 2:** `npm run test:e2e -- profile-reminders` (test DB up) → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(notifications): reminder times on the profile`.

### Task 5: Devices API, sign-out and erasure

**Files:**
- Create: `backend/src/modules/notifications/push-device.repository.ts`, `backend/src/modules/notifications/push-device.service.ts`, `backend/src/modules/notifications/devices.controller.ts`, `backend/src/modules/notifications/dto/register-device.dto.ts`, `backend/src/modules/notifications/notifications.module.ts`, `backend/src/modules/notifications/index.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`, `backend/src/modules/auth/auth.service.ts` (+ spec), `backend/src/modules/account-erasure/account-eraser.repository.ts`, `backend/src/app.module.ts`
- Test: `backend/test/e2e/push-devices.e2e-spec.ts`, `backend/test/e2e/account-erasure.e2e-spec.ts` (extend), `auth.service.spec.ts` (extend)

**Interfaces:**
- Produces:
  - `PushDeviceRepository.upsert(userId: string, token: string, platform: PushPlatform, now: Date): Promise<void>` (upsert by token, sets user_id and last_seen_at — a token moves accounts).
  - `.removeOwn(userId: string, token: string): Promise<void>` (deleteMany where both match; no error if absent).
  - `.removeAllFor(userId: string): Promise<void>`, `.removeTokens(tokens: string[]): Promise<number>`, `.removeStale(before: Date): Promise<number>`, `.tokensFor(userIds: string[]): Promise<Map<string, string[]>>`.
  - `PushDeviceService` wraps register/unregister/removeAllFor with `Clock`.
  - Routes (JWT-guarded, like `user.controller.ts`): `PUT /user/devices` body `{ token: string (1..4096), platform: 'ANDROID' }` → 204; `DELETE /user/devices/:token` → 204.
  - `NotificationsModule` exports `PushDeviceService`.
- `AuthService.signOut` calls `devices.removeAllFor(userId)` after bumping the token version.
- `AccountEraserRepository` deletes `pushDevice` and `reminderSend` rows for the user inside the erase transaction (before `user.delete`).

- [ ] **Step 1: Failing tests:** e2e `registers a token` (PUT then row exists with ANDROID); `registering again refreshes last_seen_at, not a second row`; `the same token registered by another user moves to them` (Review Focus 5); `DELETE removes only your own token` (B cannot delete A's: A's row remains, 204); `400 on empty token or unknown platform`; `401 without a session`; `sign-out deletes every device of the user`; erasure e2e: `erasing removes push devices and reminder sends`. Unit: `signOut removes the user's devices`.
- [ ] **Step 2:** run e2e + unit → FAIL.
- [ ] **Step 3:** Implement; register the module in `app.module.ts`.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(notifications): device registration; sign-out and erasure drop devices`.

### Task 6: PushSender port and FCM adapter

**Files:**
- Create: `backend/src/modules/notifications/push-sender.ts`, `backend/src/modules/notifications/fcm-push-sender.ts`
- Modify: `backend/src/config/env.validation.ts` (`FCM_SERVICE_ACCOUNT?: string`), `backend/package.json` (`firebase-admin`), `docs/deploy.md` (env row)
- Test: `backend/src/modules/notifications/fcm-push-sender.spec.ts`

**Interfaces:**
- Produces:
  - `interface PushMessage { title: string; body: string; route: '/tasks' }`.
  - `type SendOutcome = 'sent' | 'invalid-token' | 'failed'`.
  - `abstract class PushSender { abstract readonly enabled: boolean; abstract send(tokens: string[], msg: PushMessage): Promise<SendOutcome[]> }` (one outcome per token, same order).
  - `const REMINDER_CHANNEL_ID = 'garden-reminders'`.
  - `fcmMessage(tokens: string[], msg: PushMessage): MulticastMessage` → `{ tokens, notification: {title, body}, data: { route }, android: { priority: 'high', notification: { channelId: REMINDER_CHANNEL_ID } } }`.
  - `outcomeOf(response: SendResponse): SendOutcome` — `messaging/registration-token-not-registered` and `messaging/invalid-registration-token` / `messaging/invalid-argument` → `invalid-token`; other errors → `failed`.
  - `FcmPushSender` (uses `getMessaging(app).sendEachForMulticast`), `DisabledPushSender` (`enabled = false`, returns `failed` for all, never called by the dispatcher).
  - Module factory: `FCM_SERVICE_ACCOUNT` (base64 JSON) present → `FcmPushSender` with `initializeApp({ credential: cert(json) }, 'bagicha-push')`; absent → `DisabledPushSender` and one `logger.warn('Push sending is off: FCM_SERVICE_ACCOUNT is not set')`. Malformed value → boot fails with an InvariantError naming the variable (never its contents).

- [ ] **Step 1: Failing tests:** `fcmMessage` shape exactly as above; `outcomeOf` table for the three codes plus `messaging/internal-error` → `failed` and success → `sent`; `FcmPushSender.send` maps a fake messaging's `responses` in order.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** `npm i firebase-admin@^13`; implement.
- [ ] **Step 4:** → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5:** Commit `feat(notifications): FCM sender behind a port`.

### Task 7: The reminder run

**Files:**
- Create: `backend/src/modules/notifications/reminder-audience.repository.ts`, `backend/src/modules/notifications/reminder-dispatch.service.ts`, `backend/src/modules/notifications/reminder-sends.repository.ts`
- Modify: `backend/src/modules/plant-ledger/repositories/task.repository.ts`, `backend/src/modules/plant-ledger/services/task.service.ts`, `backend/src/modules/plant-ledger/index.ts`
- Test: `backend/src/modules/notifications/reminder-dispatch.service.spec.ts`, `backend/test/e2e/reminder-queries.e2e-spec.ts`

**Interfaces:**
- Consumes: Tasks 2, 3, 5, 6; `PlantNamesService.namer/titler/careTexter` (careTexter's Hindi title wins over titler when present, as task views do); `Clock`.
- Produces:
  - `TaskService.reminderTasks(userId: string, w: { fromDate: string; toDate: string; tomorrow: string | null }): Promise<ReminderTaskRow[]>` — PENDING, plant `ended_at: null`, plant `user_id`, IST due date in [fromDate, toDate], OR (`tomorrow` set AND `source = WEATHER` AND IST due date = tomorrow). Converts IST dates to UTC bounds with the existing IST helpers. Row: task fields `TitledTask` needs + `priority`, `due_date`, plant `{name, crop_id, species_family}`.
  - `ReminderAudienceRepository.batch(slot, minute, after: string | null, size: number): Promise<Array<{ id: string; language_pref: string; region_cluster: RegionCluster | null }>>` — users with that slot's column = minute, `ACTIVE_ACCOUNT`, at least one push device; ordered by id, `id > after`.
  - `ReminderSendsRepository.claim(userId, slot, istDate): Promise<boolean>` (insert; unique violation → false), `.release(userId, slot, istDate)`, `.pruneBefore(date: Date): Promise<number>`.
  - `ReminderDispatchService.run(now?: Date): Promise<ReminderRunSummary>`; `interface ReminderRunSummary { slot: ReminderSlot | null; users: number; sent: number; empty: number; failed: number; tokensRemoved: number; staleRemoved: number; sendsPruned: number }`.
- Run algorithm: `istQuarter(now)` → slot whose range contains minute and `minute` is the quarter (none → return zeros after housekeeping). For each audience user: `claim` (false → skip); load tasks (`tomorrow` only for EVENING); map to `ReminderTask` with the user's lang (`language_pref === 'hi' ? 'hi' : 'en'`); `composeReminder`; null → `empty++` (keep claim); else send to the user's tokens; delete `invalid-token` tokens; if every outcome is `failed` → `release` and `failed++`, else `sent++`. Then housekeeping every run: `removeStale(now − 60 days)`, `pruneBefore(now − 30 days)`. If `!sender.enabled` → return zeros without claiming. Log one info line with the summary fields only.

- [ ] **Step 1: Failing unit tests** (fake repositories, fake sender, fixed clock):
  - `sends one message per user at their morning quarter` (07:00 IST, two users at 420, one at 435 → 2 sent).
  - `does not send twice in a slot` (second run same quarter → claim false → 0 sent) — Review Focus 1.
  - `sends nothing and keeps the claim when nothing is due`.
  - `removes dead tokens and keeps the claim when another phone got it` — Review Focus 2.
  - `releases the claim when every phone failed`.
  - `evening asks for tomorrow's weather tasks, morning does not` (asserts the `tomorrow` argument: `'2026-11-28'` at 18:00 on 27th; `null` at 07:00).
  - `outside both ranges only housekeeping runs`.
  - `does nothing when sending is off`.
- [ ] **Step 2: Failing e2e** `reminder-queries`: `reminderTasks` returns a PENDING task due today and one due 7 days ago; excludes 8 days ago, tomorrow (non-weather), COMPLETED, CANCELLED, and tasks on an ended plant; includes tomorrow's WEATHER task only when `tomorrow` is set; an IST-boundary task due `2026-11-27T19:00:00Z` (00:30 IST on the 28th) counts as the 28th — Review Focus 3 and 4. Audience: user with matching minute + device is returned; without device, with deletion pending, or minute off by 15 → not.
- [ ] **Step 3:** run both → FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** → PASS.
- [ ] **Step 6:** Commit `feat(notifications): morning and evening reminder run`.

### Task 8: Schedule and wiring

**Files:**
- Create: `backend/src/modules/notifications/reminder-dispatch.processor.ts`
- Modify: `backend/src/modules/notifications/notifications.module.ts`
- Test: `backend/src/modules/notifications/reminder-dispatch.processor.spec.ts`

**Interfaces:**
- Produces: `REMINDER_DISPATCH_QUEUE = 'push-reminders'`, `REMINDER_DISPATCH_SCHEDULE = { pattern: '*/15 * * * *', tz: 'Asia/Kolkata' }`, scheduler id `'push-reminders-quarterly'`, job options `{ attempts: 3, backoff: { type: 'fixed', delay: 60_000 } }` (retries land inside the quarter); `ReminderDispatchSchedule` (upsert on bootstrap) and `ReminderDispatchProcessor` (calls `run()`, `logJobFailure` on failed) — mirror `weather-reminder.processor.ts`.

- [ ] **Step 1: Failing test:** `upserts the quarter-hour IST schedule with retries` (asserts `upsertJobScheduler('push-reminders-quarterly', { pattern: '*/15 * * * *', tz: 'Asia/Kolkata' }, { name: 'run', opts: { attempts: 3, backoff: { type: 'fixed', delay: 60000 } } })`); `process runs the dispatch`.
- [ ] **Step 2:** → FAIL. **Step 3:** implement and register queue + providers. **Step 4:** → PASS; then the whole backend: `npm test && npm run test:e2e && npm run lint && npx tsc --noEmit` → all green.
- [ ] **Step 5:** Commit `feat(notifications): quarter-hour schedule`.

### Task 9: App push plumbing (web/Capacitor)

**Files:**
- Modify: `web/package.json` (`@capacitor/push-notifications@8.x`, matching `@capacitor/core` 8.6.3)
- Create: `web/src/features/reminders/push.ts`, `web/src/features/reminders/usePushRegistration.ts`, `web/src/features/reminders/api.ts`, `web/src/features/reminders/index.ts`
- Modify: `web/src/app/providers.tsx` (or the authed shell) to mount the hook; `web/src/features/auth/schemas.ts` (`reminder_morning_min`, `reminder_evening_min`: `z.number().int().nullable()`); `web/src/features/profile/api.ts` (`ProfileChanges` gains both)
- Test: `web/src/features/reminders/reminders.test.tsx`

**Interfaces:**
- Produces:
  - `interface PushPort { native: boolean; permission(): Promise<'granted' | 'denied' | 'prompt'>; request(): Promise<'granted' | 'denied'>; register(): Promise<void>; onToken(cb: (t: string) => void): void; onTap(cb: (route: string) => void): void; ensureChannel(): Promise<void> }`, `capacitorPush: PushPort` (uses `Capacitor.isNativePlatform()` and `PushNotifications`; on web `native: false` and every method a no-op) and a React context `PushPortProvider`/`usePushPort()` so tests inject a fake.
  - `CHANNEL = { id: 'garden-reminders', name: 'Garden reminders', importance: 4 }` (id equals the backend's `REMINDER_CHANNEL_ID`).
  - `useRegisterDevice()` → `PUT /user/devices { token, platform: 'ANDROID' }`.
  - `usePushRegistration()`: when signed in and `native`: `ensureChannel()`; if permission is granted → `register()`; `onToken` → `useRegisterDevice`; `onTap(route)` → `navigate(route)` only for `'/tasks'`.
  - `enablePush(port): Promise<boolean>` — `request()`, and on granted `register()`; returns whether granted.
- [ ] **Step 1: Failing tests:** `registers the token when permission is already granted` (fake port emits 'tok-1' → PUT body `{ token: 'tok-1', platform: 'ANDROID' }`); `does nothing on the web`; `does not ask for permission by itself` (`request` not called); `tapping a reminder opens the tasks screen`; `ignores routes other than /tasks`.
- [ ] **Step 2:** `npx vitest run src/features/reminders` → FAIL. **Step 3:** install + implement. **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(reminders): register the phone for push`.

### Task 10: Permission card and Reminders settings

**Files:**
- Create: `web/src/features/reminders/RemindersCard.tsx`, `web/src/features/reminders/RemindersSection.tsx`
- Modify: `web/src/features/dashboard/DashboardScreen.tsx` (card above `<WeatherCard />`), `web/src/features/profile/ProfileScreen.tsx` (a `Group` for reminders), `web/src/locales/en.json`, `web/src/locales/hi.json`, `web/src/locales/locales.test.ts` (`HINDI_PENDING_REVIEW` gains `'reminders.'`)
- Test: extend `reminders.test.tsx`

**Interfaces:**
- Consumes: `usePushPort`, `enablePush` (Task 9), `useUpdateProfile` (profile), `useSession().user`.
- Produces: locale keys under `reminders.*`: `card.title` "Garden reminders", `card.body` "Get a morning and evening reminder of your garden tasks.", `card.turnOn` "Turn on", `card.notNow` "Not now", `section.title` "Reminders", `section.morning` "Morning", `section.evening` "Evening", `section.off` "Off", `section.blocked` "Notifications are off for Bagicha on this phone.", `section.howTo` (above). Hindi drafts for each go in `hi.json` and are reviewed by the owner before shipping.
- Behaviour: the card shows only when `native`, permission is `'prompt'`, and the dismissal key `bagicha.reminders.cardDismissed` is absent (stored via `lib/storage.ts`, try/catch-safe). "Turn on" → `enablePush`; "Not now" → store the key. The section shows only when `native`; each slot is a select of `Off` + times from the same ranges as the backend (`06:00`–`11:45`, `15:00`–`21:45`, 15-minute steps, labels in 12-hour `7:00 am` form via `lib/format.ts` if a time formatter exists, else add one); a change PATCHes `reminder_morning_min` / `reminder_evening_min` (null for Off). When permission is `'denied'` the section shows `section.blocked` and `section.howTo` ("Turn them on in Settings → Apps → Bagicha → Notifications."). *Ruling against the spec's "offers to open settings": Capacitor 8 core has no open-app-settings call and the spec rules out extra plugins only by silence; a third-party settings plugin for one button is not worth it. Cost if wrong: one small plugin added later.*
- [ ] **Step 1: Failing tests:** `the card asks for permission and hides once granted`; `"Not now" hides it for good`; `no card on the web`; `the section saves the morning time` (select 7:30 am → PATCH `{ reminder_morning_min: 450 }`); `Off saves null`; `evening offers 3:00 pm to 9:45 pm only` (first/last options); `shows the blocked note when permission is denied`.
- [ ] **Step 2:** → FAIL. **Step 3:** implement. **Step 4:** → PASS; `npm test && npm run lint && npm run build` green.
- [ ] **Step 5:** Commit `feat(reminders): permission card and reminder times in the profile`.

### Task 11: Android build, docs and device check

**Files:**
- Modify: `web/android/app/build.gradle` only if the Capacitor template's conditional `google-services` apply is missing; `docs/deploy.md` (release steps: Firebase project, `google-services.json`, `FCM_SERVICE_ACCOUNT` on Render, migration before push); the privacy policy draft (push token, Firebase as processor — owner reviews wording)
- Add (owner supplies): `web/android/app/google-services.json`

- [ ] **Step 1:** `cd web && npm run build && npx cap sync android` → plugin listed.
- [ ] **Step 2:** `cd android && ./gradlew assembleDebug` (JAVA_HOME = Android Studio JBR) → BUILD SUCCESSFUL. Without `google-services.json` the build still succeeds and push registration fails softly (the hook catches it).
- [ ] **Step 3:** Docs edits above.
- [ ] **Step 4:** Commit `docs(notifications): release steps and privacy note`.
- [ ] **Step 5 (needs owner: Firebase file, server key, Neon migration, deploy):** on the Redmi, set the morning slot to the next quarter-hour; with the app killed the notification arrives with the right text and opens `/tasks`; after sign-out nothing arrives at the next slot.

## Final checks

- Spec coverage: slots/times (2, 4, 10), counting incl. evening weather (7), text (3), tap → /tasks (6, 9), channel (6, 9), permission card + section (10), FCM server side (6, 7, 8), devices + sign-out + erasure (5), housekeeping (7), boot without key (6), logs counts only (7), Hindi gate (3, 10), privacy + deploy docs (11).
