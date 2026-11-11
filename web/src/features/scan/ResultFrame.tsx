import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, LoadingState, Screen, TopBar } from '../../ui';

/** Photo preview plus loading / error-with-retry / result for a scan. */
export function ResultFrame({
  title,
  previewUrl,
  pending,
  error,
  onRetry,
  children,
}: {
  title: string;
  previewUrl: string | null;
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Screen>
      <TopBar title={title} />
      <main className="space-y-4 px-4 pb-10 pt-4">
        {previewUrl && (
          <div className="pebble-large mx-auto h-28 w-28 overflow-hidden">
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {error ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-error-container px-4 py-8 text-center text-on-error-container">
            <p className="font-body text-base">{messageFor(error, t)}</p>
            <Button variant="quiet" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          </div>
        ) : pending ? (
          <LoadingState label={t('scan.thinking')} />
        ) : (
          children
        )}
      </main>
    </Screen>
  );
}
