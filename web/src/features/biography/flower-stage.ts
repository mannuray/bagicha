/** A perennial flower is young, then blooming (spec flowers §2.2); stored stages map onto those two. */
export const FLOWER_STAGES = ['YOUNG', 'BLOOMING'] as const;
export function flowerStage(lifecycle: string): (typeof FLOWER_STAGES)[number] {
  return lifecycle === 'SAPLING' || lifecycle === 'JUVENILE' ? 'YOUNG' : 'BLOOMING';
}
