import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, cx, Icon, LoadingState } from '../../ui';
import type { PlantDetail } from '../plants';
import { useCropJourney } from './useCropJourney';
import { StartSheet } from './StartSheet';

/** Where a crop is on its way from Want to grow to harvest, and the next thing to do. */
export function JourneyCard({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const j = useCropJourney(plant, now);
  const { crop, stage, steps, at, flower, status, next, due, harvestCount, place, rotation, neverSown, sheet } = j;
  if (!crop) return j.loading ? <LoadingState /> : null;

  return (
    <section aria-label={t('crops.journey.title')} className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <h2 className="font-headline text-lg text-primary">{t('crops.journey.title')}</h2>
      <ol className="flex gap-1">
        {steps.map((step, i) => (
          <li key={step} aria-current={i === at ? 'step' : undefined} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className={cx('h-1.5 w-full rounded-full', i <= at ? 'bg-primary' : 'bg-surface-container-highest')} aria-hidden />
            <span className={cx('font-label text-[10px] leading-tight', i === at ? 'font-bold text-primary' : 'text-on-surface-variant')}>
              {t(`crops.journey.step.${flower && step === 'harvesting' ? 'blooming' : step}`)}
            </span>
          </li>
        ))}
      </ol>
      {next && (
        <p className="flex items-center gap-2 font-body text-sm font-semibold text-primary">
          <Icon name="arrow_forward" className="text-base" />
          {t('crops.journey.next', { title: next.title, due: due ? t(`tasks.due.${due.key}`, { count: due.count }) : '' })}
        </p>
      )}
      {status.day !== null && (stage === 'NURSERY' || stage === 'IN_GROUND') && (
        <p className="font-body text-sm text-on-surface-variant">
          {t(flower ? 'crops.journey.progressBloom' : 'crops.journey.progress', { day: status.day, min: crop.days_to_first_harvest[0], max: crop.days_to_first_harvest[1] })}
        </p>
      )}
      {harvestCount > 0 && <p className="font-body text-sm text-on-surface-variant">{t('crops.journey.harvests', { count: harvestCount })}</p>}
      {place && (
        <div className="space-y-1">
          <p className="font-body text-sm text-on-surface">{t('crops.journey.growingIn', { place: place.name })}</p>
          {!flower &&
            rotation?.last &&
            (rotation.conflict ? (
              <p className="rounded-lg bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">
                {t('crops.place.rotation', { crop: rotation.last.crop_name, season: rotation.last.season_label })}
              </p>
            ) : (
              <p className="rounded-lg bg-primary/5 px-3 py-2 font-body text-sm text-primary">
                {t('crops.journey.goodRotation', { crop: rotation.last.crop_name })}
              </p>
            ))}
        </div>
      )}
      <p className="font-body text-xs text-on-surface-variant">
        {t('crops.journey.guide', { plants: crop.guide.plants_for_family_of_4, container: crop.guide.container, min: crop.guide.spacing_cm[0], max: crop.guide.spacing_cm[1] })}
      </p>
      {sheet ? (
        <StartSheet plantId={plant.id} crop={crop} path={sheet === 'transplant' ? 'transplant' : undefined} onClose={j.closeSheet} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(stage === 'PLANNED' || stage === 'RESTING') && <Button onClick={() => j.openSheet('start')}>{t('crops.journey.start')}</Button>}
          {stage === 'NURSERY' && <Button onClick={() => j.openSheet('transplant')}>{t('crops.journey.transplant')}</Button>}
          {(stage === 'IN_GROUND' || stage === 'HARVESTING') && (
            <Link to={`/plants/${plant.id}/log`} className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-5 font-label text-sm font-bold text-on-primary">
              {t(flower ? 'crops.journey.bloom' : 'crops.journey.harvest')}
            </Link>
          )}
          {(stage === 'NURSERY' || stage === 'IN_GROUND' || stage === 'HARVESTING') && (
            <Button variant="tertiary" busy={j.ending} onClick={j.endSeason}>
              {t('crops.journey.end')}
            </Button>
          )}
          {stage === 'PLANNED' && neverSown && (
            <Button
              variant="tertiary"
              busy={j.removing}
              onClick={j.removeFromPlan}
            >
              {t('crops.journey.remove')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
