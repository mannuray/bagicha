import { useTranslation } from 'react-i18next';
import { istParts } from '../../../lib/ist';
import { ErrorState, LoadingState } from '../../../ui';
import { BLOOM_TYPES, useTimeline } from '../../journal';

/** Year on year for a flower: how many blooms were logged each year, and when the first came. */
export function FlowerYears({ plantId }: { plantId: string }) {
  const { t, i18n } = useTranslation();
  const blooms = useTimeline(plantId, BLOOM_TYPES);
  const entries = (blooms.data?.items ?? []).filter((e) => BLOOM_TYPES.includes(e.type));
  const years = new Map<number, { count: number; first: Date }>();
  for (const e of entries) {
    const at = new Date(e.timestamp);
    const year = istParts(at).year;
    const cur = years.get(year);
    years.set(year, { count: (cur?.count ?? 0) + 1, first: cur && cur.first < at ? cur.first : at });
  }
  const rows = [...years.entries()].sort(([a], [b]) => b - a);
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
          rows.map(([year, row]) => (
            <p key={year} className="flex justify-between font-body text-sm text-on-surface">
              <span className="font-label text-xs font-bold text-on-surface-variant">{year}</span>
              <span>
                {t('biography.flower.bloomsLogged', { count: row.count })} ·{' '}
                {t('biography.flower.firstIn', {
                  month: row.first.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }),
                })}
              </span>
            </p>
          ))
        )}
      </div>
    </section>
  );
}
