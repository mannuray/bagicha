import { cropDay } from '../plants';
import type { Task } from '../tasks';

export type CropStatus = { stage: string; day: number | null; place: string | null };

/**
 * The crop header line's parts: the stage, the day of the open season and where it grows.
 * Nursery trays have no place; Want to grow and Resting have neither day nor place.
 */
export function cropStatusLine(
  stage: string | null,
  openSeasonStartedAt: string | null,
  placeName: string | null,
  now: Date,
): CropStatus {
  const s = stage ?? 'PLANNED';
  // IST calendar days, like the tasks' "Due in N days", so the two lines agree.
  const day = cropDay(s, openSeasonStartedAt, now);
  if (day === null) return { stage: s, day: null, place: null };
  return { stage: s, day, place: s === 'NURSERY' ? null : placeName };
}

/** The earliest pending crop-plan task: what to do next. */
export function nextStep(tasks: Task[]): Task | null {
  return (
    tasks
      .filter((task) => task.status === 'PENDING' && task.source === 'CROP_PLAN')
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))[0] ?? null
  );
}

export type JourneyStep = 'planned' | 'seeds' | 'sown' | 'transplanted' | 'harvesting' | 'ended';
type CropStage = 'PLANNED' | 'NURSERY' | 'IN_GROUND' | 'HARVESTING' | 'RESTING';

/** The steps a crop's journey shows: nursery crops are transplanted, direct-sown ones are not. */
export function journeySteps(nursery: boolean): JourneyStep[] {
  return nursery ? ['planned', 'seeds', 'sown', 'transplanted', 'harvesting', 'ended'] : ['planned', 'seeds', 'sown', 'harvesting', 'ended'];
}

/** Which journey step a crop stage stands for. */
export function journeyStep(stage: CropStage | null, nursery: boolean): JourneyStep {
  if (stage === 'NURSERY') return 'sown';
  if (stage === 'IN_GROUND') return nursery ? 'transplanted' : 'sown';
  if (stage === 'HARVESTING') return 'harvesting';
  if (stage === 'RESTING') return 'ended';
  return 'planned';
}

/** The season that has started and not closed, if any. */
export function openCycle<C extends { started_at: string | null; closed_at: string | null }>(cycles: C[] | undefined): C | null {
  return cycles?.find((c) => c.started_at && !c.closed_at) ?? null;
}

/** Harvests logged in one season. */
export function harvestsIn(entries: Array<{ type: string; plant_cycle_id: string | null }>, cycleId: string | null): number {
  if (!cycleId) return 0;
  return entries.filter((e) => e.type === 'HARVEST' && e.plant_cycle_id === cycleId).length;
}
