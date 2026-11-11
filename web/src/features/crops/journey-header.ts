import type { Task } from '../tasks';

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const day = Math.max(0, Math.floor((now.getTime() - new Date(openSeasonStartedAt).getTime()) / DAY_MS));
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
