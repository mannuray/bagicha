import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui';
import type { ServerWake } from './server-wake-store';

/** A quiet note at the top while the server wakes, so a long wait doesn't look broken. */
export function ServerWakeBanner({ wake }: { wake: ServerWake }) {
  const { t } = useTranslation();
  const slow = useSyncExternalStore(wake.subscribe, wake.get);
  if (!slow) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-md items-center gap-2 bg-secondary-container px-4 py-2 font-label text-xs font-semibold text-on-secondary-container shadow-md"
    >
      <Icon name="hourglass_top" className="animate-pulse text-base" />
      {t('app.waking')}
    </div>
  );
}
