import { isDiagnosis, withinIstDays } from './diagnosis';

const ATTENTION_WINDOW_DAYS = 30;
const SERIOUS = new Set(['MEDIUM', 'HIGH']);

type EntryLike = { type: string; metadata: Record<string, unknown> | null; timestamp: string };

/**
 * The backend has no health score: `health_status` is a label nothing updates.
 * A recent MEDIUM/HIGH diagnosis means "needs attention"; otherwise show the label.
 */
export function healthLabel(
  plant: { health_status: string },
  entries: EntryLike[],
  now: Date,
): { label: string | null; tone: 'good' | 'attention' } {
  const recentSerious = entries.some(
    (e) => isDiagnosis(e) && SERIOUS.has(String(e.metadata?.severity ?? '')) && withinIstDays(e, ATTENTION_WINDOW_DAYS, now),
  );
  return recentSerious ? { label: null, tone: 'attention' } : { label: plant.health_status, tone: 'good' };
}
