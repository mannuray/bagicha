import { useTranslation } from 'react-i18next';
import { cx } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { FLOWER_STAGES, flowerStage } from '../flower-stage';

/** The flower's at-a-glance: its stage, usual bloom months and lifespan. Never the fruit season pack. */
export function FlowerGlance({ plant }: { plant: PlantDetail }) {
  const { t } = useTranslation();
  const current = flowerStage(plant.lifecycle_stage);
  const life = plant.life_profile?.lifespan_months;
  return (
    <section aria-label={t('biography.glance')} className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <h2 className="font-headline text-lg text-primary">{t('biography.glance')}</h2>
      <ol className="grid grid-cols-2 gap-1" aria-label={t('biography.stage')}>
        {FLOWER_STAGES.map((stage, i) => (
          <li key={stage} aria-current={stage === current ? 'step' : undefined} className="flex flex-col items-center gap-1 text-center">
            <span className={cx('h-1.5 w-full rounded-full', i <= FLOWER_STAGES.indexOf(current) ? 'bg-primary' : 'bg-surface-container-highest')} aria-hidden />
            <span className={cx('font-label text-[10px] leading-tight', stage === current ? 'font-bold text-primary' : 'text-on-surface-variant')}>
              {t(`biography.flower.stage.${stage}`)}
            </span>
          </li>
        ))}
      </ol>
      {plant.bloom && (
        <p className="font-body text-sm font-semibold text-secondary">
          {t(plant.bloom.status === 'in_season' ? 'biography.flower.inSeason' : 'biography.flower.nextBloom', { window: plant.bloom.window_label })}
        </p>
      )}
      {life && (
        <p className="font-body text-sm text-on-surface-variant">
          {t('biography.flower.lives', { min: Math.round(life[0] / 12), max: Math.round(life[1] / 12) })}
          {plant.life_profile?.note_key === 'periwinkle' && ` ${t('biography.flower.shortLived')}`}
        </p>
      )}
    </section>
  );
}
