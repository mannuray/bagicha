# Bagicha staging: how to deploy

Staging runs on four hosted pieces, under the same accounts as OPD staging.

| Piece | Where | Account |
|---|---|---|
| Web app | Vercel project `bagicha-web` (`web/`) | Vercel `mannuray`, team mannu-kumars-projects |
| API + Redis | Render `bagicha-api` and `bagicha-redis` (free, Singapore), from `render.yaml` | Render, mannu.ray@gmail.com |
| Database | Neon project `bagicha-staging` (`lucky-band-03541719`, Singapore) | Neon, mannu.ray@gmail.com |
| Photos | S3 bucket in `ap-south-1` | AWS account 114823617214 |
| Code | github.com/mannuray/bagicha, branch `main` | GitHub `mannuray` |

The browser only talks to the Vercel site. `web/vercel.json` forwards every `/api/...` request to `bagicha-api.onrender.com`, and the production build uses `VITE_API_URL=/api/v1` (`web/.env.production`), so there is no CORS.

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
- `--dns 1.1.1.1` is needed because the local router refuses `*.neon.tech`. `--add-host` pins the host to an IPv4 address: Neon also returns IPv6 addresses, which Docker on the Mac can't route, and Prisma's engine gives up with `P1001`. If Neon's address ever changes, look it up with `nslookup ep-misty-mud-a1byhelm.ap-southeast-1.aws.neon.tech 1.1.1.1`.
- Run it in your own terminal, not through Claude, so the password never lands in a chat. It ends with `All migrations have been successfully applied.`

## Deploy the API (Render)

Render builds `backend/Dockerfile` when `main` is pushed and waits for `/api/v1/health/live`. To redeploy without a commit, use Manual Deploy → Deploy latest commit on `bagicha-api` in the Render dashboard.

## Deploy the web app (Vercel)

```bash
cd web
vercel deploy --prod --scope mannu-kumars-projects --yes
```

Then open the production URL and hard-refresh.

## Settings and secrets

Secrets live only in the Render dashboard and the Neon console, never in git. Settings that aren't secret are in `render.yaml`.

| Setting | Where | What it does |
|---|---|---|
| `DATABASE_URL` | Render | Neon **pooled** connection string. Secret. |
| `JWT_SECRET` | Render (generated) | Signs sessions. Leave it alone. |
| `REDIS_URL` | Render (from bagicha-redis) | Filled in automatically. |
| `MEDIA_BUCKET`, `MEDIA_ACCESS_KEY`, `MEDIA_SECRET_KEY` | Render | The S3 bucket and an IAM key that can read and write only that bucket. Secret. |
| `MEDIA_ENDPOINT`, `MEDIA_PORT`, `MEDIA_USE_SSL`, `MEDIA_REGION` | `render.yaml` | S3 in `ap-south-1`. |
| `GEMINI_API_KEY` | Render | Plant scan and diagnosis. Secret. |
| `AI_PROVIDER` | `render.yaml` | `gemini`. |
| `NODE_ENV` | `render.yaml` | `staging`. `production` refuses the on-screen OTP. |
| `AUTH_EXPOSE_OTP` | `render.yaml` | `true`: the sign-in code is shown on the page until an SMS provider is chosen. |

After changing a setting on Render, redeploy the service.

## Check the deploy worked

```bash
curl -s https://bagicha-api.onrender.com/api/v1/health/live                 # status ok
curl -s -o /dev/null -w '%{http_code}\n' https://<web url>/api/v1/crops/calendar   # 401: reached the API
```

Then sign in on the web app (the code is shown on screen), add a tree, and log a moment with a photo.

## When something goes wrong

| What you see | Why | What to do |
|---|---|---|
| `whoami` shows admin@folwork.co or admin-63113913 | The CLI is signed in to another account | `vercel logout && vercel login`, or `render login`, as mannu.ray@gmail.com |
| The first request takes about a minute | The free Render plan sleeps after 15 idle minutes | Wait; it wakes on its own |
| The API starts, then errors on save | A migration was not run | Run the migration step, then redeploy |
| Photos fail to upload | S3 key or bucket setting wrong | Check the `MEDIA_*` settings on Render |

**Rolling back:** web: `vercel rollback --scope mannu-kumars-projects`. API: Render dashboard → bagicha-api → Events → Rollback. A migration is not undone by a rollback.
