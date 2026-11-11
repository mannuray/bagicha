import { istDayDiff } from '../../lib/ist';
import type { Plant } from './schemas';

/**
 * Plant status rules shared by the plant list, the plant page and the crop pages
 * (they live in plants because those features depend on it, not the reverse).
 */

/** A perennial flower is young, then blooming (spec flowers §2.2); stored stages map onto those two. */
export const FLOWER_STAGES = ['YOUNG', 'BLOOMING'] as const;
export function flowerStage(lifecycle: string): (typeof FLOWER_STAGES)[number] {
  return lifecycle === 'SAPLING' || lifecycle === 'JUVENILE' ? 'YOUNG' : 'BLOOMING';
}

/** A crop stage's translation key: a flower in HARVESTING is blooming. */
export function cropStageKey(stage: string, kind: string | null | undefined): string {
  return kind === 'FLOWER' && stage === 'HARVESTING' ? 'crops.stage.BLOOMING' : `crops.stage.${stage}`;
}

const GROWING = new Set(['NURSERY', 'IN_GROUND', 'HARVESTING']);

/** IST calendar days into the open season, only while the crop is growing; else null. */
export function cropDay(stage: string | null, seasonStartedAt: string | null, now: Date): number | null {
  if (!seasonStartedAt || !stage || !GROWING.has(stage)) return null;
  return Math.max(0, istDayDiff(new Date(seasonStartedAt), now));
}

export interface PlantStatus {
  stageKey: string;
  /** Day of a growing crop's season. */
  day: number | null;
  /** A tree's or perennial flower's planted year, when known. */
  plantedYear: number | null;
}

type StatusInput = Pick<Plant, 'record_kind' | 'crop_stage' | 'lifecycle_stage' | 'planting_date' | 'planting_date_precision'> & {
  season_started_at?: string | null;
};

/** "Harvesting · day 40" for a growing crop; "Mature · planted 2015" for a tree; flowers bloom. */
export function plantStatus(plant: StatusInput, now: Date): PlantStatus {
  if (plant.crop_stage) {
    return { stageKey: cropStageKey(plant.crop_stage, plant.record_kind), day: cropDay(plant.crop_stage, plant.season_started_at ?? null, now), plantedYear: null };
  }
  const plantedYear = plant.planting_date && plant.planting_date_precision !== 'UNKNOWN' ? new Date(plant.planting_date).getUTCFullYear() : null;
  const stageKey = plant.record_kind === 'FLOWER' ? `biography.flower.stage.${flowerStage(plant.lifecycle_stage)}` : `plants.stage.${plant.lifecycle_stage}`;
  return { stageKey, day: null, plantedYear };
}
