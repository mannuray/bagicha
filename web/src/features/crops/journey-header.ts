import { istDayDiff } from '../../lib/ist';
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
  if (!openSeasonStartedAt || (s !== 'NURSERY' && s !== 'IN_GROUND' && s !== 'HARVESTING')) return { stage: s, day: null, place: null };
  // IST calendar days, like the tasks' "Due in N days", so the two lines agree.
  const day = Math.max(0, istDayDiff(new Date(openSeasonStartedAt), now));
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
