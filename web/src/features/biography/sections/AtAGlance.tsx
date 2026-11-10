import { useTranslation } from 'react-i18next';
import { cx, ErrorState, LoadingState } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { usePlantIntelligence } from '../../seasonal';
import { STAGES } from '../growth-stage';
import { humanize } from './format';

/** Lifelong stage (a 5-step track) next to this season's phase, so the two read as different things. */
export function AtAGlance({ plant }: { plant: PlantDetail }) {
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
