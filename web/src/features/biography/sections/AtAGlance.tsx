import { useTranslation } from 'react-i18next';
import { cx, ErrorState, LoadingState } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { usePlantIntelligence } from '../../seasonal';
import { STAGES } from '../growth-stage';
import { lifeLine } from '../life-line';
import { humanize } from './format';

/** Lifelong stage (a 5-step track) next to this season's phase, so the two read as different things. */
export function AtAGlance({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const intel = usePlantIntelligence(plant.id);
  const pack = intel.data?.seasonal_pack;
  const overlay = intel.data?.personalized_overlay;
  const current = STAGES.indexOf(plant.lifecycle_stage);
  return (
    <section aria-label={t('biography.glance')} className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <h2 className="font-headline text-lg text-primary">{t('biography.glance')}</h2>
      <ol className="grid grid-cols-5 gap-1" aria-label={t('biography.stage')}>
        {STAGES.map((stage, i) => (
          <li key={stage} aria-current={i === current ? 'step' : undefined} className="flex flex-col items-center gap-1 text-center">
            <span className={cx('h-1.5 w-full rounded-full', i <= current ? 'bg-primary' : 'bg-surface-container-highest')} aria-hidden />
            <span className={cx('font-label text-[10px] leading-tight', i === current ? 'font-bold text-primary' : 'text-on-surface-variant')}>
              {t(`plants.stage.${stage}`)}
            </span>
          </li>
        ))}
      </ol>
      <LifeLineText plant={plant} now={now} />
      {intel.isError ? (
        <ErrorState error={intel.error} onRetry={() => void intel.refetch()} />
      ) : !pack ? (
        <LoadingState />
      ) : (
        <p className="font-body text-sm text-on-surface">
          <span className="font-bold">{t('biography.now', { current: humanize(overlay?.adjusted_phase ?? pack.current_phase) })}</span>
          {' → '}
          <span className="text-on-surface-variant">{t('biography.next', { next: humanize(pack.upcoming_phase) })}</span>
        </p>
      )}
    </section>
  );
}

/** Where the tree is in a typical life for its species (spec: tree-life-and-loss §2.5). */
function LifeLineText({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const line = lifeLine(plant, now);
  if (!line) return null;
  const range = line.range ? t(`biography.life.range_${line.range.unit}`, { min: line.range.min, max: line.range.max }) : '';
  const age = t(`biography.life.age_${line.age.unit}`, { count: line.age.count });
  const text =
    line.phase === 'beforeFruit'
      ? t('biography.life.beforeFruit', { range })
      : line.phase === 'past'
        ? t('biography.life.past', { range })
        : line.range
          ? t('biography.life.productive', { age, range })
          : t('biography.life.productiveContainer', { age });
  return (
    <div className="space-y-1">
      <p
        className={cx(
          'font-body text-sm',
          line.phase === 'past' ? 'rounded-lg bg-secondary-container/25 px-3 py-2 text-on-secondary-fixed-variant' : 'text-on-surface',
        )}
      >
        {text}
      </p>
      {line.noteKey && <p className="font-body text-xs text-on-surface-variant">{t(`biography.life.note.${line.noteKey}`)}</p>}
      {line.container && <p className="font-body text-xs text-on-surface-variant">{t('biography.life.container')}</p>}
    </div>
  );
}
