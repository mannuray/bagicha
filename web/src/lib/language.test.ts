import { QueryClient } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import { applyLanguage, followLanguage } from './language';
import type { KeyValueStore } from './storage';

const memory = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) };
};

async function setup() {
  const i18n = createInstance();
  await i18n.init({ resources: { en: { translation: { hi: 'Hello' } }, hi: { translation: { hi: 'नमस्ते' } } }, lng: 'en', fallbackLng: 'en' });
  const queryClient = new QueryClient();
  let fetches = 0;
  await queryClient.fetchQuery({ queryKey: ['x'], queryFn: () => ++fetches });
  return { i18n, queryClient, fetched: () => fetches };
}

describe('the app language', () => {
  it('switches the words and drops data fetched in the old language', async () => {
    const { i18n, queryClient } = await setup();
    const storage = memory();
    await applyLanguage('hi', i18n, queryClient, storage);
    expect(i18n.t('hi')).toBe('नमस्ते');
    expect(queryClient.getQueryState(['x'])?.status).not.toBe('success');
    expect(storage.get('bagicha.lang')).toBe('hi');
  });

  it('does nothing when the language is already in use', async () => {
    const { i18n, queryClient } = await setup();
    await applyLanguage('en', i18n, queryClient, memory());
    expect(queryClient.getQueryState(['x'])?.status).toBe('success');
  });

  it("follows the signed-in user's choice, and the device's before sign-in", async () => {
    const { i18n, queryClient } = await setup();
    const storage = memory();
    storage.set('bagicha.lang', 'hi');
    let user: { language_pref?: string } | null = null;
    const listeners = new Set<() => void>();
    const session = {
      get: () => ({ user }),
      subscribe: (l: () => void) => (listeners.add(l), () => listeners.delete(l)),
    };
    followLanguage(session, i18n, queryClient, storage);
    await Promise.resolve();
    expect(i18n.language).toBe('hi');
    user = { language_pref: 'en' };
    listeners.forEach((l) => l());
    await new Promise((r) => setTimeout(r, 0));
    expect(i18n.language).toBe('en');
  });
});
