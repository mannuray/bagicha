import type {
  LifecycleStage,
  PlantingDatePrecision,
  RegionCluster,
} from '@prisma/client';
import type { FamilyCare } from '../../../catalogue';
import { carePhaseView, treeCareDue } from './engine';

/**
 * What a tree's season looks like to readers other than the plant page (AI
 * diagnosis, the seasonal-state endpoint): its reviewed care, or "care coming"
 * with no advice — never generic filler.
 */
export type TreeSeasonView =
  | {
      care_status: 'reviewed';
      current_phase: string;
      upcoming_phase: string;
      avoid_now: string[];
      watch_for: string[];
      /** This month's care titles, the "if you see it" ones included. */
      this_month: string[];
    }
  | { care_status: 'coming' };

export function treeSeasonView(
  care: FamilyCare | null,
  input: {
    region: RegionCluster;
    stage: LifecycleStage;
    plantedAt: Date | null;
    plantingPrecision: PlantingDatePrecision;
    now: Date;
  },
): TreeSeasonView {
  if (!care) return { care_status: 'coming' };
  const phase = carePhaseView(care, input);
  return {
    care_status: 'reviewed',
    current_phase: phase.current_phase,
    upcoming_phase: phase.upcoming_phase,
    avoid_now: phase.avoid_now,
    watch_for: phase.watch_for,
    this_month: treeCareDue(care, input).thisMonth.map((l) => l.title),
  };
}
