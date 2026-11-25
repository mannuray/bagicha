import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useNow } from '../../lib/clock';
import { messageFor } from '../../lib/error-messages';
import { fullDate } from '../../lib/format';
import { Button, Screen, TextField, TopBar, formSubmit } from '../../ui';
import { useRequestDeletion } from './api';

const NOTICE_DAYS = 30;
const GOES = ['profile', 'garden', 'photos', 'community', 'messages'] as const;

/** Profile → Delete my account: what goes, when, and a typed confirmation. */
export function DeleteAccountScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const now = useNow();
  const request = useRequestDeletion();
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim() === t('account.delete.word');
  const due = new Date(now.getTime() + NOTICE_DAYS * 86_400_000).toISOString();

  const submit = () => {
    if (!confirmed) return;
    request.mutate(undefined, {
      onSuccess: (user) =>
        navigate('/delete-account', { replace: true, state: { scheduled: user.deletion_due_at } }),
    });
  };

  return (
    <Screen>
      <TopBar title={t('account.delete.title')} />
      <main className="space-y-5 px-4 pb-8 pt-4">
        <p className="font-body text-sm text-on-surface">{t('account.delete.intro', { date: fullDate(due, i18n.language) })}</p>
        <section className="space-y-2 rounded-xl bg-surface-container-low p-4">
          <h2 className="font-headline text-base font-bold text-primary">{t('account.delete.whatGoes')}</h2>
          <ul className="list-disc space-y-1 pl-5 font-body text-sm text-on-surface">
            {GOES.map((key) => (
              <li key={key}>{t(`account.delete.goes.${key}`)}</li>
            ))}
          </ul>
        </section>
        <p className="font-body text-sm text-on-surface-variant">{t('account.delete.kept')}</p>
        <p className="font-body text-sm font-bold text-on-surface">{t('account.delete.noRefund')}</p>
        <form onSubmit={formSubmit(submit)} className="space-y-4">
          <TextField
            label={t('account.delete.typeLabel')}
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
          />
          {request.error && (
            <p role="alert" className="font-body text-sm text-error">
              {messageFor(request.error, t)}
            </p>
          )}
          <Button type="submit" disabled={!confirmed} busy={request.isPending}>
            {t('account.delete.confirm')}
          </Button>
        </form>
      </main>
    </Screen>
  );
}
