#!/usr/bin/env bash
# Starts the real backend for the web e2e run, against its own throwaway database.
# Assumes the docker-compose services (postgres, redis, minio) are already up.
set -euo pipefail
cd "$(dirname "$0")/../../backend"

PG_PORT="${E2E_PG_PORT:-5433}"
export DATABASE_URL="postgresql://postgres:postgres@localhost:${PG_PORT}/bagicha_e2e?schema=public"
case "$DATABASE_URL" in
  *"/bagicha_e2e?"*) ;;
  *) echo "refusing to reset a database that is not *_e2e" >&2; exit 1 ;;
esac

export NODE_ENV=test
export PORT="${E2E_API_PORT:-3001}"
export JWT_SECRET=e2e-secret
export RAZORPAY_WEBHOOK_SECRET=e2e-webhook
export AI_PROVIDER=fake
export WEB_ORIGINS="http://localhost:${E2E_WEB_PORT:-5174}"
export REDIS_HOST=localhost
export REDIS_PORT="${E2E_REDIS_PORT:-6380}"
export MEDIA_ENDPOINT=localhost
export MEDIA_PORT="${E2E_MINIO_PORT:-9100}"
export MEDIA_BUCKET=bagicha-media-e2e
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
export KATHAWACHAK_ENABLED=false
export LOG_LEVEL=warn

# Create the throwaway database if needed, apply migrations (non-destructive),
# then empty its tables — the same reset the backend e2e suite uses.
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
(async () => {
  const url = new URL(process.env.DATABASE_URL);
  const name = url.pathname.slice(1);
  if (!name.endsWith('_e2e')) throw new Error('refusing to touch ' + name);
  const adminUrl = new URL(url); adminUrl.pathname = '/postgres';
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  const [{ exists }] = await admin.$queryRawUnsafe(`SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${name}') AS "exists"`);
  if (!exists) await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  await admin.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE
npx prisma migrate deploy >/dev/null
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
(async () => {
  const db = new PrismaClient();
  // Keep the plant catalogue (the API refuses to start without it). The audit log
  // refuses TRUNCATE; only a test reset may wipe it, with its guard off for that moment.
  const tables = await db.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' AND tablename NOT LIKE 'catalogue\\_%'`);
  if (tables.length) {
    await db.$transaction([
      db.$executeRawUnsafe('ALTER TABLE "audit_events" DISABLE TRIGGER audit_events_no_truncate'),
      db.$executeRawUnsafe('TRUNCATE TABLE ' + tables.map((t) => `"public"."${t.tablename}"`).join(', ') + ' CASCADE'),
      db.$executeRawUnsafe('ALTER TABLE "audit_events" ENABLE TRIGGER audit_events_no_truncate'),
    ]);
  }
  // The one gardener the core-loop test signs in as (web/e2e/session.ts mints its token).
  await db.user.create({ data: { id: 'e2e-gardener', google_sub: 'e2e-sub', email: 'e2e@example.test' } });
  await db.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE
# Fill the plant catalogue if this database has none yet (the API needs it to start).
npm run catalogue:push >/dev/null
# Clear rate-limit counters from earlier runs.
node -e "const R=require('ioredis');const r=new R({host:process.env.REDIS_HOST,port:+process.env.REDIS_PORT});r.keys('{rl:*').then(k=>k.length?r.del(...k):0).then(()=>r.quit())"

npm run build >/dev/null
exec node --require ./dist/instrumentation.js dist/main.js
