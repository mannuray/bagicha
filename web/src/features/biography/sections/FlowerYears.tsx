import { useTranslation } from 'react-i18next';
import { monthShort } from '../../../lib/format';
import { ErrorState, LoadingState } from '../../../ui';
import { BLOOM_TYPES, useTimeline } from '../../journal';
import { bloomYears } from '../bloom-years';

/** Year on year for a flower: how many blooms were logged each year, and when the first came. */
export function FlowerYears({ plantId }: { plantId: string }) {
  const { t, i18n } = useTranslation();
  const blooms = useTimeline(plantId, BLOOM_TYPES);
  const rows = bloomYears(blooms.data?.items ?? []);
  return (
    <section aria-label={t('biography.flower.years')} className="space-y-3">
      <h2 className="font-headline text-xl text-primary">{t('biography.flower.years')}</h2>
      <div className="space-y-1.5 rounded-xl bg-surface-container-low p-4">
        {blooms.isError ? (
          <ErrorState error={blooms.error} onRetry={() => void blooms.refetch()} />
        ) : !blooms.data ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant">{t('biography.flower.logBlooms')}</p>
        ) : (
          rows.map((row) => (
            <p key={row.year} className="flex justify-between font-body text-sm text-on-surface">
              <span className="font-label text-xs font-bold text-on-surface-variant">{row.year}</span>
              <span>
                {t('biography.flower.bloomsLogged', { count: row.count })} ·{' '}
                {t('biography.flower.firstIn', {
                  month: monthShort(row.first, i18n.language),
                })}
              </span>
            </p>
          ))
        )}
      </div>
    </section>
  );
}
