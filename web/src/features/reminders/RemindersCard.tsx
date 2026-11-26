import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../../lib/storage';
import { Button, Icon } from '../../ui';
import { enablePush, usePushPort } from './push';
import { usePushPermission } from './usePushPermission';

const DISMISSED_KEY = 'bagicha.reminders.cardDismissed';

/**
 * Asks once, with context, for permission to send reminders: only on the
 * phone, only while Android has not been asked yet, and never again after
 * "Not now".
 */
export function RemindersCard() {
  const { t } = useTranslation();
  const port = usePushPort();
  const storage = useStorage();
  const { permission, setPermission } = usePushPermission(port);
  const [dismissed, setDismissed] = useState(() => storage.get(DISMISSED_KEY) === '1');
  const [busy, setBusy] = useState(false);

  if (!port.native || permission !== 'prompt' || dismissed) return null;

  const turnOn = async () => {
    setBusy(true);
    try {
      setPermission((await enablePush(port)) ? 'granted' : 'denied');
    } finally {
      setBusy(false);
    }
  };
  const notNow = () => {
    storage.set(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <section aria-labelledby="reminders-card-title" className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <Icon name="notifications" className="text-primary" />
        <div className="space-y-1">
          <h2 id="reminders-card-title" className="font-headline text-base font-bold text-primary">
            {t('reminders.card.title')}
          </h2>
          <p className="font-body text-sm text-on-surface-variant">{t('reminders.card.body')}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button busy={busy} onClick={() => void turnOn()}>
          {t('reminders.card.turnOn')}
        </Button>
        <Button variant="tertiary" onClick={notNow}>
          {t('reminders.card.notNow')}
        </Button>
      </div>
    </section>
  );
}
