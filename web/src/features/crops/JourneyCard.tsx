import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, cx, LoadingState } from '../../ui';
import { useAddJournalEntry } from '../journal';
import type { PlantDetail } from '../plants';
import { useCropCalendar } from './api';
import { StartSheet } from './StartSheet';

type Step = 'planned' | 'seeds' | 'sown' | 'transplanted' | 'harvesting' | 'ended';

/** Where a crop is on its way from Want to grow to harvest, and the next thing to do. */
export function JourneyCard({ plant }: { plant: PlantDetail }) {
  const { t } = useTranslation();
  const calendar = useCropCalendar();
  const log = useAddJournalEntry(plant.id);
  const [sheet, setSheet] = useState<'start' | 'transplant' | null>(null);
  const crop = calendar.data?.find((c) => c.id === plant.crop_id);
  if (!crop) return calendar.isPending ? <LoadingState /> : null;

  const nursery = crop.method === 'NURSERY_TRANSPLANT';
  const steps: Step[] = nursery ? ['planned', 'seeds', 'sown', 'transplanted', 'harvesting', 'ended'] : ['planned', 'seeds', 'sown', 'harvesting', 'ended'];
  const stage = plant.crop_stage ?? 'PLANNED';
  const current: Step =
    stage === 'NURSERY' ? 'sown'
    : stage === 'IN_GROUND' ? (nursery ? 'transplanted' : 'sown')
    : stage === 'HARVESTING' ? 'harvesting'
    : stage === 'RESTING' ? 'ended'
    : 'planned';
  const at = steps.indexOf(current);

  return (
    <section aria-label={t('crops.journey.title')} className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <h2 className="font-headline text-lg text-primary">{t('crops.journey.title')}</h2>
      <ol className="flex gap-1">
        {steps.map((step, i) => (
          <li key={step} aria-current={i === at ? 'step' : undefined} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className={cx('h-1.5 w-full rounded-full', i <= at ? 'bg-primary' : 'bg-surface-container-highest')} aria-hidden />
            <span className={cx('font-label text-[10px] leading-tight', i === at ? 'font-bold text-primary' : 'text-on-surface-variant')}>
              {t(`crops.journey.step.${step}`)}
            </span>
          </li>
        ))}
      </ol>
      <p className="font-body text-xs text-on-surface-variant">
        {t('crops.journey.guide', { plants: crop.guide.plants_for_family_of_4, container: crop.guide.container, min: crop.guide.spacing_cm[0], max: crop.guide.spacing_cm[1] })}
      </p>
      {sheet ? (
        <StartSheet plantId={plant.id} crop={crop} path={sheet === 'transplant' ? 'transplant' : undefined} onClose={() => setSheet(null)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(stage === 'PLANNED' || stage === 'RESTING') && <Button onClick={() => setSheet('start')}>{t('crops.journey.start')}</Button>}
          {stage === 'NURSERY' && <Button onClick={() => setSheet('transplant')}>{t('crops.journey.transplant')}</Button>}
          {(stage === 'IN_GROUND' || stage === 'HARVESTING') && (
            <>
              <Link to={`/plants/${plant.id}/log`} className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-5 font-label text-sm font-bold text-on-primary">
                {t('crops.journey.harvest')}
              </Link>
              <Button variant="tertiary" busy={log.isPending} onClick={() => log.mutate({ type: 'SEASON_END' })}>
                {t('crops.journey.end')}
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
