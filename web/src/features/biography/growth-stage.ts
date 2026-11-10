const ORDER = ['SAPLING', 'JUVENILE', 'FIRST_FLOWERING', 'FIRST_HARVEST', 'MATURE_BEARING'] as const;

/** Which growth ring is lit (0 = innermost sapling ring). */
export function growthRing(stage: string): number {
  const index = ORDER.indexOf(stage as (typeof ORDER)[number]);
  return index < 0 ? 0 : index;
}
export const RING_COUNT = ORDER.length;
