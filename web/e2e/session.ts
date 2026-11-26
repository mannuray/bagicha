import { createHmac } from 'node:crypto';

const b64url = (data: string | Buffer) => Buffer.from(data).toString('base64url');

/**
 * A session token for the seeded e2e gardener, signed with the e2e backend's
 * JWT_SECRET (scripts/e2e-backend.sh). Google can't run in this test, so the
 * test starts signed in instead of going through the Google button.
 */
export function mintSession(secret: string, sub: string, tokenVersion = 0): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub, tv: tokenVersion, iat: now, exp: now + 3600 }));
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/** The seeded gardener as the app caches it after sign-in (what POST /auth/google would return). */
export const E2E_GARDENER = {
  id: 'e2e-gardener',
  email: 'e2e@example.test',
  name: null,
  district: null,
  region_cluster: null,
  garden_types: [],
  language_pref: 'en',
  subscription_tier: 'FREE',
  premium_expires_at: null,
  badge_level: 'Seedling',
  avatar_key: null,
  deletion_due_at: null,
  reminder_morning_min: 420,
  reminder_evening_min: 1080,
};
