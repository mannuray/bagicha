import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAddJournalEntry, useTimeline } from '../journal';
import { useAllCycles, type PlantDetail } from '../plants';
import { dueLabel, usePlantTasks } from '../tasks';
import { useCropCalendar, usePlaces, useRemoveFromPlan, useRotation } from './api';
import { cropStatusLine, harvestsIn, journeyStep, journeySteps, nextStep, openCycle } from './journey-header';

/**
 * ViewModel for the crop journey card: the crop, its open season and place, the
 * step it's on, the next task, rotation, the start/transplant sheet and the actions.
 */
export function useCropJourney(plant: PlantDetail, now: Date) {
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
  const crop = calendar.data?.find((c) => c.id === plant.crop_id) ?? null;
  const open = openCycle(cycles.data);
  const placeId = open?.place_id ?? null;
  const rotation = useRotation(placeId, plant.crop_id);

  const nursery = crop?.method === 'NURSERY_TRANSPLANT';
  const stage = plant.crop_stage ?? 'PLANNED';
  const steps = journeySteps(nursery);
  const next = nextStep(tasks.data?.items ?? []);

  return {
    crop,
    loading: calendar.isPending,
    stage,
    steps,
    at: steps.indexOf(journeyStep(plant.crop_stage ?? null, nursery)),
    // Seasonal flowers bloom where vegetables are harvested, and skip rotation.
    flower: crop?.kind === 'FLOWER',
    status: cropStatusLine(plant.crop_stage ?? null, open?.started_at ?? null, null, now),
    next,
    due: next?.due_date ? dueLabel(next.due_date, now) : null,
    harvestCount: harvestsIn(harvests.data?.items ?? [], open?.id ?? null),
    place: places.data?.find((p) => p.id === placeId) ?? null,
    rotation: rotation.data ?? null,
    neverSown: cycles.data !== undefined && cycles.data.length === 0,
    sheet,
    openSheet: setSheet,
    closeSheet: () => {
      setSheet(null);
      if (params.has('start')) setParams({}, { replace: true });
    },
    endSeason: () => log.mutate({ type: 'SEASON_END' }),
    ending: log.isPending,
    removeFromPlan: () => remove.mutate(plant.id, { onSuccess: () => navigate('/plants', { replace: true }) }),
    removing: remove.isPending,
  };
}
