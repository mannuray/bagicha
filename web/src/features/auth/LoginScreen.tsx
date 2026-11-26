import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Screen } from '../../ui';
import { AuthHero } from './AuthHero';
import { useGoogleLogin } from './useGoogleLogin';

const SITE = 'https://budtale.vercel.app';

export function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { native, signIn, renderButton, sessionExpired, busy, failed, unavailable } = useGoogleLogin();

  return (
    <Screen>
      <AuthHero />
      <main className="relative z-10 -mt-8 rounded-t-[2rem] bg-surface px-5 pb-8 pt-8">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-headline text-2xl font-bold tracking-tight text-primary">{t('auth.login.title')}</h1>
          <p className="font-body text-sm font-medium uppercase tracking-[0.15em] text-on-surface-variant">
            {t('auth.google.subtitle')}
          </p>
        </div>
        {sessionExpired && (
          <p role="status" className="mb-3 rounded-xl bg-secondary-fixed px-4 py-3 text-center font-body text-sm text-on-secondary-fixed">
            {t('errors.UNAUTHORIZED')}
          </p>
        )}
        <div className="space-y-5">
          {native ? (
            <Button type="button" block busy={busy} onClick={() => void signIn()} className="py-3 text-lg">
              <GoogleMark />
              {t('auth.google.button')}
            </Button>
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
          <p className="text-center font-body text-xs leading-relaxed text-on-surface-variant">
            {t('auth.google.legalBefore')}{' '}
            <a href={`${SITE}/privacy`} className="font-bold text-secondary underline">
              {t('auth.google.privacy')}
            </a>{' '}
            {t('auth.google.legalAnd')}{' '}
            <a href={`${SITE}/terms`} className="font-bold text-secondary underline">
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
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden className="mr-2 inline-block rounded-full bg-white p-0.5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.7 7.1-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
