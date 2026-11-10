import { istParts } from '../../lib/ist';
import type { PlantDetail } from '../plants';

export interface Memory {
  kind: 'planted' | 'firstHarvest';
  years: number;
}

/**
 * An anniversary that falls this month (IST): the planting month (when the month is
 * known), otherwise the first harvest's month. Shown in the app only for now.
 * TODO(push-memory): send this as a reminder too. Needs a notification service,
 * scheduling and permission, none of which exist yet.
 */
export function memoryFor(p: PlantDetail, now: Date): Memory | null {
  const today = istParts(now);
  const anniversary = (iso: string | null) => {
    if (!iso) return null;
    const then = istParts(new Date(iso));
    const years = today.year - then.year;
    return then.month === today.month && years >= 1 ? years : null;
  };
  const monthKnown = p.planting_date_precision === 'MONTH_YEAR' || p.planting_date_precision === 'EXACT_DATE';
  const planted = monthKnown ? anniversary(p.planting_date) : null;
  if (planted) return { kind: 'planted', years: planted };
  const harvest = anniversary(p.first_harvest_at);
  return harvest ? { kind: 'firstHarvest', years: harvest } : null;
}
