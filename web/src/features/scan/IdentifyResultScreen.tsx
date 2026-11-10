import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { Surface } from '../../ui';
import { useIdentify } from './api';
import { ResultFrame } from './ResultFrame';
import { useScanState } from './scan-state';
import { useRunOnce } from './use-run-once';

export function IdentifyResultScreen() {
  const { t } = useTranslation();
  const { scan } = useScanState();
  const identify = useIdentify();
  const send = () => scan && identify.mutate({ image_base64: scan.base64 });
  useRunOnce(send);
  if (!scan || scan.mode !== 'identify') return <Navigate to="/scan" replace />;

  const result = identify.data;
  const care = result?.care_summary;
  return (
    <ResultFrame title={t('scan.identifyTitle')} previewUrl={scan.previewUrl} pending={!result} error={identify.error} onRetry={send}>
      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-headline text-4xl text-primary">{result.common_name ?? t('scan.unknownPlant')}</h2>
            {result.scientific_name && <p className="font-body italic text-on-surface-variant">{result.scientific_name}</p>}
          </div>
          {result.description && <Surface className="p-5 font-body text-sm text-on-surface">{result.description}</Surface>}
          {care && (
            <Surface className="space-y-1 p-5 font-body text-sm text-on-surface">
              {typeof care === 'string'
                ? care
                : Object.entries(care).map(([k, v]) => (
                    <p key={k}>
                      <span className="font-bold capitalize">{k}: </span>
                      {String(v)}
                    </p>
                  ))}
            </Surface>
          )}
          {result.common_name && (
            <Link
              to={`/plants/new?prefill=${encodeURIComponent(result.common_name)}`}
              className="bg-primary-gradient flex min-h-12 items-center justify-center rounded-full font-label text-sm font-bold text-on-primary"
            >
              {t('scan.addAsPlant')}
            </Link>
          )}
        </div>
      )}
    </ResultFrame>
  );
}
