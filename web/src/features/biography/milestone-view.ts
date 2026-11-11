import type { PlantDetail } from '../plants';

export type FirstKey = 'firstFlowering' | 'firstFruitSet' | 'firstHarvest';

export type MilestoneView =
  | { kind: 'recorded'; at: string }
  | { kind: 'since'; year: number }
  | { kind: 'before' }
  | { kind: 'estimate'; from: number; to: number }
  | { kind: 'notYet' };

const FIELD = {
  firstFlowering: 'first_flowering_at',
  firstFruitSet: 'first_fruit_set_at',
  firstHarvest: 'first_harvest_at',
} as const;

const MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

/**
 * What a "first" milestone card says for a tree that may predate Bagicha
 * (spec 2026-11-11-old-tree-milestones §2): recorded date, then the gardener's
 * answer, then an estimate from the planted year and the species' first-fruit
 * age — only once the tree is past the latest usual age (the backend's rule).
 */
export function milestoneView(plant: PlantDetail, key: FirstKey, now: Date): MilestoneView {
  const at = plant[FIELD[key]];
  if (at) return { kind: 'recorded', at };
  if (plant.bearing_status === 'BEARING') {
    return plant.bearing_since_year ? { kind: 'since', year: plant.bearing_since_year } : { kind: 'before' };
  }
  const profile = plant.life_profile;
  if (plant.bearing_status === 'NOT_YET' || !profile || !plant.planting_date || plant.planting_date_precision === 'UNKNOWN') {
    return { kind: 'notYet' };
  }
  // A bare year is stored as 1 January; the tree may have gone in as late as December.
  const earliest = new Date(plant.planting_date);
  const latest =
    plant.planting_date_precision === 'YEAR' ? new Date(Date.UTC(earliest.getUTCFullYear() + 1, 0, 1)) : earliest;
  const [min, max] = profile.first_fruit_months;
  if ((now.getTime() - latest.getTime()) / MONTH_MS <= max) return { kind: 'notYet' };
  const yearAfter = (from: Date, months: number) => new Date(from.getTime() + months * MONTH_MS).getUTCFullYear();
  return {
    kind: 'estimate',
    from: yearAfter(earliest, min),
    to: Math.min(yearAfter(latest, max), now.getUTCFullYear()),
  };
}

export type PlantedView = { kind: 'year'; year: number } | { kind: 'date'; at: string } | { kind: 'unknown' };

/** How the Planted card reads: a bare year, a month and year, or unknown. */
export function plantedView(plant: Pick<PlantDetail, 'planting_date' | 'planting_date_precision'>): PlantedView {
  if (!plant.planting_date || plant.planting_date_precision === 'UNKNOWN') return { kind: 'unknown' };
  return plant.planting_date_precision === 'YEAR'
    ? { kind: 'year', year: new Date(plant.planting_date).getUTCFullYear() }
    : { kind: 'date', at: plant.planting_date };
}
