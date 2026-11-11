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
  const planted = new Date(plant.planting_date);
  const [min, max] = profile.first_fruit_months;
  if ((now.getTime() - planted.getTime()) / MONTH_MS <= max) return { kind: 'notYet' };
  const year = planted.getUTCFullYear();
  return { kind: 'estimate', from: year + Math.floor(min / 12), to: year + Math.ceil(max / 12) };
}
