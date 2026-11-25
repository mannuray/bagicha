import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { fullDate } from '../../lib/format';
import { Button, Screen } from '../../ui';
import { homeFor, useSession, useSignOut } from '../auth';
import { useKeepAccount } from './api';

/** Signed in during the 30 days: keep the account, or carry on with the deletion and sign out. */
export function DeletionPendingScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const keep = useKeepAccount();
  const signOut = useSignOut();
  if (!user?.deletion_due_at) return null;

  const onKeep = () => keep.mutate(undefined, { onSuccess: (kept) => navigate(homeFor(kept), { replace: true }) });
  const onContinue = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Screen>
      <main className="flex min-h-[70vh] flex-col justify-center space-y-6 px-6">
        <h1 className="font-headline text-2xl font-bold text-primary">{t('account.pending.title')}</h1>
        <p className="font-body text-base text-on-surface">
          {t('account.pending.body', { date: fullDate(user.deletion_due_at, i18n.language) })}
        </p>
        {keep.error && (
          <p role="alert" className="font-body text-sm text-error">
            {messageFor(keep.error, t)}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={onKeep} busy={keep.isPending}>
            {t('account.pending.keep')}
          </Button>
          <Button variant="tertiary" onClick={onContinue} disabled={keep.isPending}>
            {t('account.pending.continue')}
          </Button>
        </div>
      </main>
    </Screen>
  );
}
