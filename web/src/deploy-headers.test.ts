import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const all = Object.fromEntries((vercel.headers?.find((h) => h.source === '/(.*)')?.headers ?? []).map((h) => [h.key, h.value]));
const apiOrigin = new URL(
  /VITE_API_URL=(\S+)/.exec(readFileSync(resolve(root, '.env.production'), 'utf8'))?.[1] ?? 'http://missing',
).origin;

describe('security headers on every page (vercel.json)', () => {
  it('can never be framed, embed plugins or change the base URL', () => {
    const csp = all['Content-Security-Policy'] ?? '';
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(all['X-Content-Type-Options']).toBe('nosniff');
    expect(all['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('trials the full policy (report-only), allowing the API, photos and previews', () => {
    const trial = all['Content-Security-Policy-Report-Only'] ?? '';
    expect(trial).toContain("script-src 'self'");
    expect(trial).toMatch(new RegExp(`connect-src 'self' ${apiOrigin.replace(/[.]/g, '\\.')}`));
    expect(trial).toMatch(/img-src [^;]*blob:/);
    expect(trial).toMatch(/img-src [^;]*https:/);
  });
});
