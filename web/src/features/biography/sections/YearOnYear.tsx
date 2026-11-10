import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cx, ErrorState, LoadingState } from '../../../ui';
import { useAllCycles } from '../../plants';
import { compareRows, yearOnYear, type Trend } from '../year-on-year';
import { monthYear } from './format';

const TREND_STYLE: Record<Exclude<Trend, null>, string> = {
  better: 'bg-primary-fixed text-on-primary-fixed-variant',
  worse: 'bg-error-container text-on-error-container',
  same: 'bg-surface-container-highest text-on-surface-variant',
};

/** Yield per season and the latest finished season against the one before. */
export function YearOnYear({ plantId, now, crop = false }: { plantId: string; now: Date; crop?: boolean }) {
  const { t } = useTranslation();
  const cycles = useAllCycles(plantId);
  return (
    <section aria-label={t(crop ? 'biography.seasons' : 'biography.yearOnYear')} className="space-y-3">
      <h2 className="font-headline text-xl text-primary">{t(crop ? 'biography.seasons' : 'biography.yearOnYear')}</h2>
      {cycles.isError ? (
        <ErrorState error={cycles.error} onRetry={() => void cycles.refetch()} />
      ) : !cycles.data ? (
        <LoadingState />
      ) : (
        <Comparison data={yearOnYear(cycles.data, now, crop ? 'season' : 'year')} plantId={plantId} />
      )}
    </section>
  );
}

function Comparison({ data, plantId }: { data: ReturnType<typeof yearOnYear>; plantId: string }) {
  const { t, i18n } = useTranslation();
  const max = Math.max(0, ...data.years.filter((y) => y.barred).map((y) => y.value ?? 0));
  const shown = (key: string, value: string) =>
    value === '—' || key === 'yield' || key === 'pests' ? value : t(`biography.drop.${value}`, { defaultValue: value });
  return (
    <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
      {data.years.length > 0 && (
        <ul className="space-y-1.5">
          {data.years.map((y) => (
            <li key={y.key} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-label text-xs font-bold text-on-surface-variant">{y.startedAt ? monthYear(y.startedAt, i18n.language) : y.year}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container-highest" aria-hidden>
                {y.barred && max > 0 && <span className="block h-full rounded-full bg-primary" style={{ width: `${((y.value ?? 0) / max) * 100}%` }} />}
              </span>
              <span className="w-24 shrink-0 text-right font-body text-xs text-on-surface">
                {y.value !== null ? `${y.value} ${y.unit ?? ''}`.trim() : '—'}
                {y.soFar && <span className="text-on-surface-variant"> · {t('biography.soFar')}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data.latest && data.previous ? (
        <div className="space-y-1.5">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
            {t('biography.latestVsPrevious', {
              latest: data.latest.started_at ? monthYear(data.latest.started_at, i18n.language) : data.latest.cycle_year,
              previous: data.previous.started_at ? monthYear(data.previous.started_at, i18n.language) : data.previous.cycle_year,
            })}
          </p>
          {compareRows(data.latest, data.previous).map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2 font-body text-sm">
              <span className="text-on-surface-variant">{t(`biography.compare.${row.key}`)}</span>
              <span className="flex items-center gap-2 text-on-surface">
                {shown(row.key, row.now)}
                <span className="text-xs text-on-surface-variant">({shown(row.key, row.before)})</span>
                {row.trend && (
                  <span className={cx('rounded-full px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider', TREND_STYLE[row.trend])}>
                    {t(`biography.trend.${row.trend}`)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-sm text-on-surface-variant">{t('biography.logHarvests')}</p>
      )}
      {data.years.length > 0 && (
        <Link to={`/plants/${plantId}/season`} className="flex min-h-11 items-center justify-between rounded-xl bg-surface px-4 text-primary">
          <span className="font-headline text-base">{t('biography.seasonReview')}</span>
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
