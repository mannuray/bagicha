import { istParts } from '../../lib/ist';
import type { Plant } from '../plants';

export interface PlantAge {
  unit: 'years' | 'months';
  count: number;
  year: number;
}

/**
 * How long the plant has been in the ground, at the precision it was entered with.
 * A year-only date can't give months, so a planting this year reads as 0 years.
 */
export function plantAge(plantingDate: string | null, precision: Plant['planting_date_precision'], now: Date): PlantAge | null {
  if (!plantingDate || precision === 'UNKNOWN') return null;
  const planted = istParts(new Date(plantingDate));
  const today = istParts(now);
  if (precision === 'YEAR') return { unit: 'years', count: Math.max(today.year - planted.year, 0), year: planted.year };
  let months = (today.year - planted.year) * 12 + (today.month - planted.month);
  if (precision === 'EXACT_DATE' && today.day < planted.day) months -= 1;
  months = Math.max(months, 0);
  return months < 12
    ? { unit: 'months', count: months, year: planted.year }
    : { unit: 'years', count: Math.floor(months / 12), year: planted.year };
}
