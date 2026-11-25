import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { fullDate } from '../../lib/format';
import { Screen } from '../../ui';

/** Where the fallback email goes; the line is left out until it is set (VITE_SUPPORT_EMAIL). */
const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() ?? '';

/**
 * The public "how to delete your account" page (no sign-in): the link given to
 * Google Play. Also where the app lands right after a deletion is scheduled.
 */
export function DeleteAccountInfoPage() {
  const { t, i18n } = useTranslation();
  const scheduled = (useLocation().state as { scheduled?: string | null } | null)?.scheduled;

  return (
    <Screen>
      <main className="mx-auto max-w-prose space-y-4 px-4 py-8">
        <h1 className="font-headline text-2xl font-bold text-primary">{t('account.info.title')}</h1>
        {scheduled && (
          <p role="status" className="rounded-xl bg-secondary-container/30 p-4 font-body text-sm font-bold text-on-surface">
            {t('account.info.scheduled', { date: fullDate(scheduled, i18n.language) })}
          </p>
        )}
        <p className="font-body text-sm text-on-surface">{t('account.info.steps')}</p>
        <p className="font-body text-sm text-on-surface">{t('account.info.notice')}</p>
        <p className="font-body text-sm text-on-surface-variant">{t('account.info.whatGoes')}</p>
        {SUPPORT_EMAIL && (
          <p className="select-all font-body text-sm text-on-surface">{t('account.info.email', { email: SUPPORT_EMAIL })}</p>
        )}
        <Link to="/login" className="inline-flex min-h-11 items-center font-label text-sm font-bold text-secondary">
          {t('account.info.signIn')}
        </Link>
      </main>
    </Screen>
  );
}
