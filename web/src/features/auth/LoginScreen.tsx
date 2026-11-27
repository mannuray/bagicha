import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Screen } from '../../ui';
import { AuthHero } from './AuthHero';
import { useGoogleLogin } from './useGoogleLogin';

const SITE = 'https://budtale.vercel.app';

/** What Budtale does, each a real feature: push reminders, district seasons, the plant journal. */
const POINTS = [
  { icon: 'wb_twilight', key: 'auth.google.pointReminders' },
  { icon: 'calendar_month', key: 'auth.google.pointSeasons' },
  { icon: 'menu_book', key: 'auth.google.pointJournal' },
] as const;

export function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { native, signIn, renderButton, sessionExpired, busy, failed, unavailable } = useGoogleLogin();

  return (
    <Screen className="flex flex-col">
      <AuthHero />
      <main className="relative z-10 -mt-4 flex flex-1 flex-col justify-between gap-6 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-headline text-[27px] font-semibold leading-[1.2] tracking-tight text-primary">{t('auth.google.title')}</h1>
          <p className="mt-2 max-w-[20rem] font-body text-[13px] leading-relaxed text-primary/75">{t('auth.google.tagline')}</p>
          <ul className="mt-5 flex w-full flex-col gap-2 text-left">
            {POINTS.map(({ icon, key }) => (
              <li key={key} className="flex items-center gap-3.5 rounded-xl bg-surface-container-low px-3.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                  <Icon name={icon} className="text-[18px]" />
                </span>
                <span className="min-w-0 font-body text-[13px] font-medium text-on-surface">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          {sessionExpired && (
            <p role="status" className="rounded-xl bg-secondary-fixed px-4 py-3 text-center font-body text-sm text-on-secondary-fixed">
              {t('errors.UNAUTHORIZED')}
            </p>
          )}
          {native ? (
            <button
              type="button"
              disabled={busy}
              aria-busy={busy}
              onClick={() => void signIn()}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 font-body text-[15px] font-semibold text-[#1f2937] shadow-[0_4px_22px_rgba(23,49,36,0.08)] transition active:scale-[0.98] disabled:opacity-70"
            >
              <GoogleMark />
              {t('auth.google.button')}
            </button>
          ) : (
            <GoogleWebButton render={renderButton} locale={i18n.language} />
          )}
          {native && unavailable && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {t('auth.google.unavailable')}
            </p>
          )}
          {failed && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {t('auth.google.failed')}
            </p>
          )}
          <p className="px-2 text-center font-body text-[11px] leading-relaxed text-primary/60">
            {t('auth.google.legalBefore')}{' '}
            <a href={`${SITE}/privacy`} className="font-medium text-secondary underline underline-offset-2">
              {t('auth.google.privacy')}
            </a>{' '}
            {t('auth.google.legalAnd')}{' '}
            <a href={`${SITE}/terms`} className="font-medium text-secondary underline underline-offset-2">
              {t('auth.google.terms')}
            </a>
            .
          </p>
        </div>
      </main>
    </Screen>
  );
}

/** Google's own button, drawn by Google Identity Services; a note if it can't load. */
function GoogleWebButton({ render, locale }: { render: (el: HTMLElement, locale: string) => Promise<void>; locale: string }) {
  const { t } = useTranslation();
  const slot = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (slot.current) render(slot.current, locale).catch(() => setUnavailable(true));
  }, [render, locale]);
  return (
    <>
      <div ref={slot} className="flex min-h-11 justify-center" />
      {unavailable && (
        <p role="alert" className="text-center font-body text-sm text-error">
          {t('auth.google.unavailable')}
        </p>
      )}
    </>
  );
}

/** Google's "G", as its brand rules ask on a custom sign-in button. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.7 7.1-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
