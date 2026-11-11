import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, cx, Icon, LoadingState } from '../../ui';
import { systemClock } from '../../lib/clock';
import { useAddJournalEntry, useTimeline } from '../journal';
import { dueLabel, usePlantTasks } from '../tasks';
import { useAllCycles, type PlantDetail } from '../plants';
import { useCropCalendar, usePlaces, useRemoveFromPlan, useRotation } from './api';
import { cropStatusLine, nextStep } from './journey-header';
import { StartSheet } from './StartSheet';

type Step = 'planned' | 'seeds' | 'sown' | 'transplanted' | 'harvesting' | 'ended';

/** Where a crop is on its way from Want to grow to harvest, and the next thing to do. */
export function JourneyCard({ plant }: { plant: PlantDetail }) {
  const { t } = useTranslation();
  const calendar = useCropCalendar();
  const log = useAddJournalEntry(plant.id);
  const [params, setParams] = useSearchParams();
  const startable = !plant.crop_stage || plant.crop_stage === 'PLANNED' || plant.crop_stage === 'RESTING';
  // Arriving from "Start now" on the crop page (?start=1) opens the start sheet once.
  const [sheet, setSheet] = useState<'start' | 'transplant' | null>(params.get('start') === '1' && startable ? 'start' : null);
  const tasks = usePlantTasks(plant.id);
  const harvests = useTimeline(plant.id, ['HARVEST']);
  const cycles = useAllCycles(plant.id);
  const places = usePlaces();
  const remove = useRemoveFromPlan();
  const navigate = useNavigate();
  const crop = calendar.data?.find((c) => c.id === plant.crop_id);
  const open = cycles.data?.find((c) => c.started_at && !c.closed_at) ?? null;
  const placeId = open?.place_id ?? null;
  const rotation = useRotation(placeId, plant.crop_id);
  if (!crop) return calendar.isPending ? <LoadingState /> : null;
  const now = systemClock.now();
  const status = cropStatusLine(plant.crop_stage ?? null, open?.started_at ?? null, null, now);
  const next = nextStep(tasks.data?.items ?? []);
  const due = next?.due_date ? dueLabel(next.due_date, now) : null;
  const harvestCount = open ? (harvests.data?.items ?? []).filter((e) => e.type === 'HARVEST' && e.plant_cycle_id === open.id).length : 0;
  const closeSheet = () => {
    setSheet(null);
    if (params.has('start')) setParams({}, { replace: true });
  };
  const place = places.data?.find((p) => p.id === placeId);
  const neverSown = cycles.data !== undefined && cycles.data.length === 0;

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
      {next && (
        <p className="flex items-center gap-2 font-body text-sm font-semibold text-primary">
          <Icon name="arrow_forward" className="text-base" />
          {t('crops.journey.next', { title: next.title, due: due ? t(`tasks.due.${due.key}`, { count: due.count }) : '' })}
        </p>
      )}
      {status.day !== null && (stage === 'NURSERY' || stage === 'IN_GROUND') && (
        <p className="font-body text-sm text-on-surface-variant">
          {t('crops.journey.progress', { day: status.day, min: crop.days_to_first_harvest[0], max: crop.days_to_first_harvest[1] })}
        </p>
      )}
      {harvestCount > 0 && <p className="font-body text-sm text-on-surface-variant">{t('crops.journey.harvests', { count: harvestCount })}</p>}
      {place && (
        <div className="space-y-1">
          <p className="font-body text-sm text-on-surface">{t('crops.journey.growingIn', { place: place.name })}</p>
          {rotation.data?.last &&
            (rotation.data.conflict ? (
              <p className="rounded-lg bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">
                {t('crops.place.rotation', { crop: rotation.data.last.crop_name, season: rotation.data.last.season_label })}
              </p>
            ) : (
              <p className="rounded-lg bg-primary/5 px-3 py-2 font-body text-sm text-primary">
                {t('crops.journey.goodRotation', { crop: rotation.data.last.crop_name })}
              </p>
            ))}
        </div>
      )}
      <p className="font-body text-xs text-on-surface-variant">
        {t('crops.journey.guide', { plants: crop.guide.plants_for_family_of_4, container: crop.guide.container, min: crop.guide.spacing_cm[0], max: crop.guide.spacing_cm[1] })}
      </p>
      {sheet ? (
        <StartSheet plantId={plant.id} crop={crop} path={sheet === 'transplant' ? 'transplant' : undefined} onClose={closeSheet} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(stage === 'PLANNED' || stage === 'RESTING') && <Button onClick={() => setSheet('start')}>{t('crops.journey.start')}</Button>}
          {stage === 'NURSERY' && <Button onClick={() => setSheet('transplant')}>{t('crops.journey.transplant')}</Button>}
          {(stage === 'IN_GROUND' || stage === 'HARVESTING') && (
            <Link to={`/plants/${plant.id}/log`} className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-5 font-label text-sm font-bold text-on-primary">
              {t('crops.journey.harvest')}
            </Link>
          )}
          {(stage === 'NURSERY' || stage === 'IN_GROUND' || stage === 'HARVESTING') && (
            <Button variant="tertiary" busy={log.isPending} onClick={() => log.mutate({ type: 'SEASON_END' })}>
              {t('crops.journey.end')}
            </Button>
          )}
          {stage === 'PLANNED' && neverSown && (
            <Button
              variant="tertiary"
              busy={remove.isPending}
              onClick={() => remove.mutate(plant.id, { onSuccess: () => navigate('/plants', { replace: true }) })}
            >
              {t('crops.journey.remove')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
