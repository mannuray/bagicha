import { useTranslation } from 'react-i18next';
import treeHero from '../../../assets/stitch/tree-hero.jpg';
import { cx, Icon } from '../../../ui';
import { useMediaUrl } from '../../journal';
import type { PlantDetail } from '../../plants';
import type { healthLabel } from '../health-label';
import { plantAge } from '../plant-age';

/** Stitch "Sanctuary Window": the tree's own latest photo (or the Stitch mango), name, age and health. */
export function Hero({ plant, health, photoKey, now }: { plant: PlantDetail; health: ReturnType<typeof healthLabel>; photoKey: string | null; now: Date }) {
  const { t } = useTranslation();
  const photo = useMediaUrl(photoKey);
  // An ended tree's age stops at its end.
  const age = plantAge(plant.planting_date, plant.planting_date_precision, plant.ended_at ? new Date(plant.ended_at) : now);
  const ageLine = !age
    ? null
    : age.unit === 'months'
      ? t('biography.age.months', { count: age.count, year: age.year })
      : age.count === 0
        ? t('biography.age.thisYear', { year: age.year })
        : t('biography.age.years', { count: age.count, year: age.year });
  return (
    <header className="relative mb-4 h-[260px] w-full overflow-hidden rounded-b-[32px] bg-primary-container">
      {/* The Stitch photo only stands in when the tree has no photo of its own (or it failed),
          never while the tree's own photo is still loading. */}
      {(photo.data ?? (!photoKey || photo.isError ? treeHero : null)) && (
        <img src={photo.data ?? treeHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-5 left-4 right-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 font-label text-xs font-bold uppercase tracking-[0.15em] text-secondary-container">
            {[plant.species, plant.variety].filter(Boolean).join(' · ')}
          </p>
          <h1 className="font-headline text-3xl font-bold leading-none text-on-primary">{plant.name}</h1>
          {ageLine && <p className="mt-1.5 font-body text-sm text-on-primary/85">{ageLine}</p>}
        </div>
        {/* TODO(vitality): Stitch shows a "Vitality 94%" score here. It needs a backend
            health score; plants only have a health_status label today, so we show that. */}
        {!plant.ended_at && (
        <div
          className={cx(
            'glass-panel pebble-large flex min-w-[80px] flex-col items-center justify-center p-3 text-center text-on-primary shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
            health.tone === 'attention' && 'bg-secondary/70',
          )}
        >
          <Icon name={health.tone === 'attention' ? 'warning' : 'favorite'} filled />
          <span className="mt-1 font-label text-[11px] font-bold uppercase tracking-wider">{health.label ?? t('biography.needsAttention')}</span>
        </div>
        )}
      </div>
    </header>
  );
}
