import type { PlantDetail } from '../plants';
import { plantAge, type PlantAge } from './plant-age';

export interface Range {
  unit: 'months' | 'years';
  min: number;
  max: number;
}

export interface LifeLine {
  /** Before its first fruit, in its productive years, or past the typical productive age. */
  phase: 'beforeFruit' | 'productive' | 'past';
  age: PlantAge;
  /** First-fruit range before fruit; productive span otherwise; null in a container. */
  range: Range | null;
  container: boolean;
  noteKey: string | null;
}

const CONTAINERS = new Set(['POT', 'GROW_BAG']);

/** A months range as months under two years, otherwise whole years. */
export function formatRange([min, max]: [number, number]): Range {
  return max < 24 ? { unit: 'months', min, max } : { unit: 'years', min: Math.round(min / 12), max: Math.round(max / 12) };
}

const ageInMonths = (age: PlantAge) => (age.unit === 'years' ? age.count * 12 : age.count);

/**
 * Where the tree is in a typical life for its species. Ranges only, and nothing
 * at all without a profile or a planting date. Containers get no productive span
 * or replacement nudge: life in a pot varies too much to say.
 */
export function lifeLine(plant: PlantDetail, now: Date): LifeLine | null {
  const profile = plant.life_profile;
  const age = plantAge(plant.planting_date, plant.planting_date_precision, now);
  if (!profile || !age) return null;
  const container = CONTAINERS.has(plant.planted_context);
  const months = ageInMonths(age);
  const fruitRecorded = Boolean(plant.first_fruit_set_at || plant.first_harvest_at || plant.bearing_status === 'BEARING');
  const base = { age, container, noteKey: profile.note_key };
  if (!fruitRecorded && months < profile.first_fruit_months[1]) {
    return { ...base, phase: 'beforeFruit', range: formatRange(profile.first_fruit_months) };
  }
  if (!container && months >= profile.productive_until_months[0]) {
    return { ...base, phase: 'past', range: formatRange(profile.productive_until_months) };
  }
  return { ...base, phase: 'productive', range: container ? null : formatRange(profile.productive_until_months) };
}
