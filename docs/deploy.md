# Bagicha staging: how to deploy

Staging runs on four hosted pieces, under the same accounts as OPD staging.

| Piece | Where | Account |
|---|---|---|
| Web app | https://bagicha-web.vercel.app (Vercel project `bagicha-web`, from `web/`) | Vercel `mannuray`, team mannu-kumars-projects |
| API | https://bagicha-api.onrender.com (Render `bagicha-api`, `srv-dbq3qch5efls739jf6l0`, free, Singapore; created with the Render CLI, settings mirrored in `render.yaml`) | Render, mannu.ray@gmail.com |
| Redis | Shared with OPD: `opd-redis`, **database 1** (`REDIS_URL=redis://red-dbhgb78473hc739u2ho0:6379/1`). The free plan allows one Key Value per workspace. | Render |
| Database | Neon project `bagicha-staging` (`lucky-band-03541719`, Singapore) | Neon, mannu.ray@gmail.com |
| Photos | S3 bucket `bagicha-media-114823617214-ap-south-1-an` (`ap-south-1`, private), IAM user `bagicha-staging-media` limited to it | AWS account 114823617214 |
| Code | github.com/mannuray/bagicha, branch `main` | GitHub `mannuray` |

The browser calls the API on Render directly: the production build uses `VITE_API_URL=https://bagicha-api.onrender.com/api/v1` (`web/.env.production`), and the API allows the site by CORS (`WEB_ORIGINS=https://bagicha-web.vercel.app` in Render's environment). We used to forward `/api/...` through a Vercel rewrite, but Vercel's proxy returns 502 while the free Render plan wakes up (~30–45 s); a direct call waits it out (the app allows 90 s and shows "Waking up the server…").

## Before you deploy

1. Check every CLI is signed in to the right account. They have been switched to another identity before. If a line shows something else, stop and sign in again.
   ```bash
   vercel whoami        # mannuray
   render whoami        # mannu.ray@gmail.com
   gh auth status       # mannuray
   ```
2. Run the checks: `cd backend && npm run lint && npx jest && npx jest --config test/jest-e2e.json --forceExit`, then `cd web && npx vitest run && npm run build`.
3. Commit, bring `main` up to date and push it. Pushing `main` is what redeploys the API on Render. The web app does not deploy on push.

## Database migrations (before pushing a migration)

The API never migrates on start. If the commit adds a folder under `backend/prisma/migrations`, apply it first. Your router refuses `*.neon.tech`, so migrations run in Docker with public DNS:

```bash
cd backend
docker build --target migrate -t bagicha-migrate .
docker run --rm --dns 1.1.1.1 \
  --add-host ep-misty-mud-a1byhelm.ap-southeast-1.aws.neon.tech:13.228.184.177 \
  -e DATABASE_URL='postgresql://neondb_owner:<password>@ep-misty-mud-a1byhelm.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' \
  bagicha-migrate
```

- Use the **direct** connection string from the Neon console (project `bagicha-staging`, role `neondb_owner`, Connection pooling OFF): the host has **no** `-pooler`, and drop `&channel_binding=require` so the string ends in `?sslmode=require`.
- Add `&connect_timeout=30&pool_timeout=60` to the string (the push reads several tables at once; over a slow link they wait for a connection longer than the 10 s default): Neon suspends an idle database and waking it takes longer than Prisma's 5 s default, which shows up as `P1001` / "Can't reach database server" even though the host answers. The same goes for the catalogue push.
- `--dns 1.1.1.1` is needed because the local router refuses `*.neon.tech`. `--add-host` pins the host to an IPv4 address: Neon also returns IPv6 addresses, which Docker on the Mac can't route, and Prisma's engine gives up with `P1001`. If Neon's address ever changes, look it up with `nslookup ep-misty-mud-a1byhelm.ap-southeast-1.aws.neon.tech 1.1.1.1`.
- Run it in your own terminal, not through Claude, so the password never lands in a chat. It ends with `All migrations have been successfully applied.`

## Plant catalogue push (after the migration, before the deploy)

Crops, seasonal flowers, planting methods, care steps, fruit types (their matching words and life profiles), add-tree search entries, perennial flowers and tree care (month-by-month reminders per fruit) live in the database. The API reads them from there and refuses to start without an approved catalogue (crops, fruit types, perennial flowers and tree care). Nothing writes catalogue data at start any more; the old `plant_catalog_entries` table is unused. They are edited in `backend/src/modules/catalogue/seed/` and written to the database by the push. Run it whenever a commit changes a seed file, and once for the stage that creates the tables. Order: **migration → push → API deploy → web**. The web from the catalogue release expects the API's new crop fields (`journey`, `method_short`, care-step texts), so the API goes live first, and rolling the API back means rolling the web back with it.

```bash
cd backend
docker build --target catalogue-push -t bagicha-catalogue-push .
docker run --rm --dns 1.1.1.1 \
  --add-host ep-misty-mud-a1byhelm.ap-southeast-1.aws.neon.tech:13.228.184.177 \
  -e DATABASE_URL='<the same direct connection string as the migration>' \
  bagicha-catalogue-push
```

- It adds new records and updates changed ones; it never deletes. It logs `Catalogue pushed` with the version and each changed record. Running it twice changes nothing.
- If the database has a record the seed files don't, it stops with `CATALOGUE_MISSING_FROM_SEED` and writes nothing. To take a crop out, set its `status` to `RETIRED` in the seed: it leaves Browse, and gardens that grow it keep their reminders.
- The running API picks up a push within about a minute; no redeploy is needed for a seed-only change.
- Locally: `npm run catalogue:push` (uses `DATABASE_URL` from `.env`).
- Stage 2 (fruit types, add-tree entries, perennial flowers, migration `20261115120000_catalogue_fruit_flowers`): migration → push → API deploy. No web deploy is needed; a search result's `id` is now its catalogue key (`mango:Dasheri`) instead of a row id, and the web uses it only as a list key.
- Stage 3 (tree care, migration `20261118120000_catalogue_tree_care`): migration → push → API deploy. The push before the deploy is safe: the old API never reads the new table. The API from this release refuses to start until the push has written tree care, so the push must come first. A catalogue push that adds a **new field** to any record goes the other way, code first, because the schemas are strict and an API that meets an unknown field fails on its next restart.
- Stage 4 ships as two releases. **A — home season tips** (migration `20261124120000_catalogue_season_guide`): migration → push → API deploy **at commit `6ade2ba`** (`render deploys create srv-dbq3qch5efls739jf6l0 --commit 6ade2ba --confirm`), not the tip of main, so B doesn't ship with it. Build the migrate and push images from that commit too (`git worktree add /tmp/stage4a 6ade2ba`). The API from this release refuses to start until every region has an approved season guide, so the push comes first; no web deploy. **B — no season-pack fallback**: API deploy, then the web (no migration, no push). Trees without reviewed care show "care is coming"; their pending season-pack tasks are cancelled the next time their reminders refresh. Rolling B back brings the old season packs back (the old API rebuilds its own version-1 rows). Once after B, a premium gardener with an active dryness adjustment gets its two watering reminders again (the adjustment moves to the new anchor row); the old pending pair is cancelled.
- **Hindi round 2** (tree care and season tips): API deploy, then the web (Vercel builds on push), **then**, only after the owner's yes on the Hindi, the catalogue push. The Hindi lives in the seed files, so deploying the code ships no Hindi: the API reads the catalogue from the database. Never push the catalogue before this API is live: the old API's strict schemas reject `hi`, and its next restart would refuse to boot. **Rollback after the push:** push the seed without `hi` first, then roll the code back.

- **Weather tips and reminders** (migration `20261125140000_task_source_weather`, new advice keys `weather.tip.*` and `weather.task.*`): migration → push → API deploy → web. The push adds advice rows only (no new field), so the old API ignores them, and the new API needs them to write a tip or reminder. The API registers a daily job at 05:00 IST (`weather-reminders`, BullMQ scheduler id `weather-reminders-daily` in Redis). Rolling back the API leaves that schedule in Redis with no worker; it does nothing until the API returns. To remove it: `redis-cli -n 1 DEL bull:weather-reminders:repeat:weather-reminders-daily` (or run `queue.removeJobScheduler('weather-reminders-daily')`).

- **OpenWeatherMap fallback** (no migration): set `OPENWEATHERMAP_API_KEY` on Render first, then deploy the API, and only then set `WEATHER_PROVIDERS=open-meteo,openweathermap`. An API older than this change does not know `openweathermap` and refuses to start when it is listed. Weather failures now log `provider`, `cell` and the upstream HTTP `status`.
- **Account deletion** (migrations `20261126100000_account_deletion` and `20261126110000_audit_report_redaction`): migration → API deploy → web. No catalogue push. Both migrations are additive: the first adds two nullable `users` columns, the second lets the audit trigger accept one narrow update (blanking `reason` and `content_excerpt` on report events). The old API ignores both. The API registers a daily job at 03:30 IST (`account-erasure`, scheduler id `account-erasure-daily`); removing it works the same way as the weather job: `redis-cli -n 1 DEL bull:account-erasure:repeat:account-erasure-daily`.
  - **Before the first erasure (AWS console, owner):** the media IAM user `bagicha-staging-media` needs `s3:ListBucket` on the bucket and `s3:DeleteObject` on `bucket/*`. Without them every erasure fails at the photo step, and the account is retried daily and reported to Sentry. If bucket versioning is on, add a lifecycle rule that expires noncurrent versions, or deleted photos stay recoverable.
  - Google Play's "delete account" link is `https://budtale.vercel.app/delete-account` (static, in `site/`; fill in its email). The app's own `/delete-account` page still exists for the in-app flow.

## Deploy the API (Render)

Render builds `backend/Dockerfile` and waits for `/api/v1/health/live`. The service was created with the Render CLI and, as of the first deploy, **did not auto-deploy on push**: after pushing `main`, start the deploy yourself with `render deploys create srv-dbq3qch5efls739jf6l0 --commit <sha> --confirm` (or Manual Deploy in the dashboard). Connecting the repo under bagicha-api → Settings → Build & Deploy may restore auto-deploy. To redeploy without a commit, use Manual Deploy → Deploy latest commit on `bagicha-api` in the Render dashboard.

## Deploy the web app (Vercel)

```bash
cd web
vercel deploy --prod --scope mannu-kumars-projects --archive=tgz --yes
```

Then open the production URL and hard-refresh.

## Settings and secrets

Secrets live only in the Render dashboard and the Neon console, never in git. Settings that aren't secret are in `render.yaml`.

| Setting | Where | What it does |
|---|---|---|
| `DATABASE_URL` | Render | Neon **pooled** connection string. Secret. |
| `JWT_SECRET` | Render (generated) | Signs sessions. Leave it alone. |
| `REDIS_URL` | `render.yaml` | `opd-redis` database 1; never database 0 (OPD's). |
| `MEDIA_BUCKET`, `MEDIA_ACCESS_KEY`, `MEDIA_SECRET_KEY` | Render | The S3 bucket and an IAM key that can read, write, list and delete only that bucket (delete and list are for account erasure). Secret. |
| `MEDIA_ENDPOINT`, `MEDIA_PORT`, `MEDIA_USE_SSL`, `MEDIA_REGION` | `render.yaml` | S3 in `ap-south-1`. |
| `GEMINI_API_KEY` | Render | Plant scan and diagnosis. Secret. |
| `AI_PROVIDER` | `render.yaml` | `gemini`. |
| `NODE_ENV` | `render.yaml` | `staging`. |
| `GOOGLE_CLIENT_ID` | Render | The Google OAuth **web** client id; the only audience sign-in tokens may have (the Android app asks for tokens for this same id). Without it the API starts and sign-in answers 503 `AUTH_GOOGLE_NOT_CONFIGURED`. Not secret. |
| `VITE_GOOGLE_CLIENT_ID` | `web/.env.production` | The same web client id, built into the website and the app. Without it the sign-in screen says Google sign-in isn't available. |
| `WEATHER_PROVIDERS` | `render.yaml` (optional) | Ordered weather sources, first tried first, e.g. `open-meteo`. Unset means `open-meteo`; `none` turns weather off. An unknown name stops the API from starting. |
| `OPEN_METEO_API_KEY` | Render (optional) | Open-Meteo's paid API, required once the app is commercial. Without it the free, non-commercial API is used (a warning is logged in production). Secret. |
| `OPENWEATHERMAP_API_KEY` | Render (required when `WEATHER_PROVIDERS` lists `openweathermap`) | OpenWeatherMap free API key (current weather + 5-day/3-hour forecast). The API refuses to start if the provider is listed without it. A new key can take a couple of hours to activate (401 until then). Secret. |
| `FCM_SERVICE_ACCOUNT` | Render (optional) | Firebase service-account JSON for push reminders, base64-encoded on one line (`base64 -i key.json`). Without it the API starts and sends no pushes (one warning at boot); an unreadable value stops it starting. Secret. |
| `SENTRY_DSN` | Render (optional) | Crash reports from the API to Sentry. Off when unset. |
| `VITE_SENTRY_DSN` | Vercel (optional) | Crash reports from the web app to Sentry. Off when unset; takes effect on the next build. |
| `VITE_SUPPORT_EMAIL` | Vercel | The address on the public `/delete-account` page for people who can't sign in. The line is hidden when unset. |

After changing a setting on Render, redeploy the service.

### Google sign-in setup (once, by the owner)

In the Google Cloud project that also holds Firebase for `com.budtale.app`:

1. **OAuth consent screen:** app name Budtale, a support email, privacy policy `https://budtale.vercel.app/privacy`, terms `https://budtale.vercel.app/terms`. Scopes: `openid`, `email`, `profile` only. Publish it (External).
2. **Web client** (Credentials → Create OAuth client ID → Web application). Authorised JavaScript origins: `https://bagicha-web.vercel.app` and `http://localhost:5173`. Its client id goes in `GOOGLE_CLIENT_ID` (Render) and `VITE_GOOGLE_CLIENT_ID` (`web/.env.production`).
3. **Android client** (→ Android): package `com.budtale.app` and the SHA-1 of each signing key: the debug key (`keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`) for local builds, and Play Console → App integrity → app signing key SHA-1 for store builds. The app never uses this id directly; Google checks it when the app asks for a token.

### Releasing Google sign-in (one time)

1. Set `GOOGLE_CLIENT_ID` on Render and `VITE_GOOGLE_CLIENT_ID` in `web/.env.production`.
2. Note the user id of the account to carry over (look it up by its phone number).
3. Apply migration `20261128100000_google_sign_in`. It only adds (`google_sub`, `email`, and lets `phone_number` be empty), so the server still running keeps working until the deploy, and rolling back the code stays possible. Then set `email` on that user id to the owner's Gmail, so the first Google sign-in with it claims the account.
4. Push, deploy Render, let Vercel build; redeploy `site/` (privacy and terms text).
5. Rebuild the APK and sign in on a phone.
6. Later, once Google sign-in has worked for a while and no rollback is wanted: a separate release drops `phone_number` (back up the `users` table first; this can't be undone).

## Check the deploy worked

```bash
curl -s https://bagicha-api.onrender.com/api/v1/health/live                 # status ok
curl -s -o /dev/null -w '%{http_code}\n' https://bagicha-api.onrender.com/api/v1/crops/calendar   # 401: reached the API
curl -s -o /dev/null -D - -X OPTIONS https://bagicha-api.onrender.com/api/v1/auth/google -H 'Origin: https://bagicha-web.vercel.app' -H 'Access-Control-Request-Method: POST' | grep -i access-control-allow-origin   # CORS allows the site
```

Then sign in on the web app with Google, add a tree, and log a moment with a photo.

- **Backend review release 2** (migration `20261125120000_chat_conversations`): migration → API deploy (no push, no web change). The migration fills the new `conversations` table from existing messages, but messages sent between the migration and the deploy go through the old API, which doesn't update it. Right after the API is live, run this catch-up once against Neon (safe to repeat; it only adds missing pairs and moves a pair's latest message forward):

  ```sql
  INSERT INTO "conversations" ("user_a", "user_b", "last_message_id", "last_at")
  SELECT DISTINCT ON (LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id"))
      LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id"), "id", "created_at"
  FROM "messages"
  ORDER BY LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id"), "created_at" DESC, "id" DESC
  ON CONFLICT ("user_a", "user_b") DO UPDATE
  SET "last_message_id" = EXCLUDED."last_message_id", "last_at" = EXCLUDED."last_at"
  WHERE "conversations"."last_at" <= EXCLUDED."last_at";
  ```

## When something goes wrong

| What you see | Why | What to do |
|---|---|---|
| `whoami` shows admin@folwork.co or admin-63113913 | The CLI is signed in to another account | `vercel logout && vercel login`, or `render login`, as mannu.ray@gmail.com |
| The first request takes about a minute | The free Render plan sleeps after 15 idle minutes | Wait; it wakes on its own |
| The API starts, then errors on save | A migration was not run | Run the migration step, then redeploy |
| Photos fail to upload | S3 key or bucket setting wrong | Check the `MEDIA_*` settings on Render |

**Rolling back:** web: `vercel rollback --scope mannu-kumars-projects`. API: Render dashboard → bagicha-api → Events → Rollback. A migration is not undone by a rollback.

**Rolling the API back past a catalogue field:** the catalogue schemas are strict, so an older API that meets a field it doesn't know (for example citrus care `kinds`) fails on its next restart. Before such a rollback, set the records using that field to `DRAFT` in the seed and push (the API never loads drafts), then roll back.
- **Push reminders** (migration `20261127100000_push_notifications`): migration → API deploy → web → Android build. No catalogue push. The migration is additive (two nullable `users` columns with defaults, two new tables); the old API ignores it. The API registers a quarter-hourly job (`push-reminders`, scheduler id `push-reminders-quarterly`, IST); remove it like the others: `redis-cli -n 1 DEL bull:push-reminders:repeat:push-reminders-quarterly`.
  - **Firebase (owner, free):** create a Firebase project, add the Android app `com.budtale.app`, download `google-services.json` into `web/android/app/` (not a secret). In *Project settings → Service accounts*, generate a private key and set it on Render as `FCM_SERVICE_ACCOUNT` (`base64 -i key.json | tr -d '\n'`), then deploy. Without the variable the API runs and sends nothing.
  - **Android:** `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`. The build checks for `google-services.json`: without it, reminders stay off in the app (no card, no Reminders section), because registering without Firebase would crash it. Add the file, then rebuild.
  - **Privacy policy:** mention the phone's push token and Firebase Cloud Messaging (Google) as the service that delivers reminders, before the Play Store release.
