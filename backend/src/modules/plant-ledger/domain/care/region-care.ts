import { LifecycleStage, RegionCluster } from '@prisma/client';
import type { CareStage, FamilyCare, RegionCare } from './types';

export function stageOf(stage: LifecycleStage): CareStage {
  return stage === LifecycleStage.SAPLING || stage === LifecycleStage.JUVENILE
    ? 'YOUNG'
    : 'BEARING';
}

/** For each region, the others nearest first (climate and season timing). */
export const NEAREST_REGIONS: Record<RegionCluster, RegionCluster[]> = {
  NORTH_INDIA: [
    'CENTRAL_INDIA',
    'EAST_INDIA',
    'WEST_INDIA',
    'HILLS_COOL',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  EAST_INDIA: [
    'NORTH_INDIA',
    'CENTRAL_INDIA',
    'COASTAL_HUMID',
    'SOUTH_DECCAN',
    'WEST_INDIA',
    'HILLS_COOL',
  ],
  WEST_INDIA: [
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
    'NORTH_INDIA',
    'EAST_INDIA',
    'HILLS_COOL',
  ],
  CENTRAL_INDIA: [
    'NORTH_INDIA',
    'WEST_INDIA',
    'EAST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
    'HILLS_COOL',
  ],
  SOUTH_DECCAN: [
    'COASTAL_HUMID',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'EAST_INDIA',
    'NORTH_INDIA',
    'HILLS_COOL',
  ],
  COASTAL_HUMID: [
    'SOUTH_DECCAN',
    'WEST_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'NORTH_INDIA',
    'HILLS_COOL',
  ],
  HILLS_COOL: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
};

/**
 * The care a gardener in `region` gets. `sameAs` is followed one hop (a chain is
 * a data error). Outside `grownIn`, the nearest grown region is used and
 * `grownHere` is false, so the app can say timings may differ.
 */
export function resolveRegionCare(
  care: FamilyCare,
  region: RegionCluster,
): { care: RegionCare; from: RegionCluster; grownHere: boolean } {
  const grownHere = care.grownIn.includes(region);
  const source = grownHere
    ? region
    : NEAREST_REGIONS[region].find((r) => care.grownIn.includes(r));
  if (!source)
    throw new Error(`${care.family}: no grown region to fall back to`);
  const entry = care.regions[source];
  if (!entry) throw new Error(`${care.family}: no care for ${source}`);
  if ('items' in entry) return { care: entry, from: source, grownHere };
  const shared = care.regions[entry.sameAs];
  if (!shared || !('items' in shared)) {
    throw new Error(
      `${care.family}: ${source} sameAs ${entry.sameAs} must point at real care`,
    );
  }
  return { care: shared, from: entry.sameAs, grownHere };
}
