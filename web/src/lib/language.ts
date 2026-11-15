import type { QueryClient } from '@tanstack/react-query';
import type { i18n as I18n } from 'i18next';
import type { KeyValueStore } from './storage';

export type AppLanguage = 'en' | 'hi';

/** The device's last language, for the screens before sign-in. */
const LANG_KEY = 'bagicha.lang';

const asLanguage = (value: string | null | undefined): AppLanguage | null =>
  value === 'hi' || value === 'en' ? value : null;

/** The language to start in: the last one used on this device, so a Hindi user sees no English first. */
export function initialLanguage(storage: KeyValueStore): AppLanguage {
  return asLanguage(storage.get(LANG_KEY)) ?? 'en';
}

/**
 * Shows the app in this language. Data already fetched came in the old one,
 * so it is dropped and refetched; nothing happens when it is already in use.
 */
export async function applyLanguage(lang: AppLanguage, i18n: I18n, queryClient: QueryClient, storage: KeyValueStore): Promise<void> {
  storage.set(LANG_KEY, lang);
  // Screen readers, fonts and hyphenation follow the page's declared language.
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (i18n.language === lang) return;
  await i18n.changeLanguage(lang);
  await queryClient.resetQueries();
}

/** Keeps the app in the signed-in user's language, or the device's before sign-in. */
export function followLanguage(
  session: { get(): { user: { language_pref?: string | null } | null }; subscribe(listener: () => void): () => void },
  i18n: I18n,
  queryClient: QueryClient,
  storage: KeyValueStore,
): () => void {
  const sync = () => {
    const lang = asLanguage(session.get().user?.language_pref) ?? asLanguage(storage.get(LANG_KEY)) ?? 'en';
    void applyLanguage(lang, i18n, queryClient, storage);
  };
  sync();
  return session.subscribe(sync);
}
