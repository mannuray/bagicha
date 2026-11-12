import { LifecycleStage, RegionCluster } from '@prisma/client';
import { resolveRegionCare, stageOf } from './region-care';
import type { FamilyCare, RegionCare } from './types';

const care = (tag: string): RegionCare => ({
  items: [],
  phases: [
    {
      when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
      stages: ['YOUNG', 'BEARING'],
      phase: tag,
      avoid: [],
      watch: [],
    },
  ],
});

const family = (
  regions: FamilyCare['regions'],
  grownIn: RegionCluster[],
): FamilyCare => ({
  family: 'fixture',
  sources: ['test'],
  grownIn,
  regions,
});

describe('stageOf', () => {
  it('maps SAPLING and JUVENILE to YOUNG, the rest to BEARING', () => {
    expect(stageOf(LifecycleStage.SAPLING)).toBe('YOUNG');
    expect(stageOf(LifecycleStage.JUVENILE)).toBe('YOUNG');
    expect(stageOf(LifecycleStage.FIRST_FLOWERING)).toBe('BEARING');
    expect(stageOf(LifecycleStage.FIRST_HARVEST)).toBe('BEARING');
    expect(stageOf(LifecycleStage.MATURE_BEARING)).toBe('BEARING');
  });
});

describe('resolveRegionCare', () => {
  it('follows sameAs to the shared region', () => {
    const f = family(
      { NORTH_INDIA: care('north'), EAST_INDIA: { sameAs: 'NORTH_INDIA' } },
      ['NORTH_INDIA', 'EAST_INDIA'],
    );
    const r = resolveRegionCare(f, 'EAST_INDIA');
    expect(r.care.phases[0].phase).toBe('north');
    expect(r.from).toBe('NORTH_INDIA');
    expect(r.grownHere).toBe(true);
  });

  it('uses the nearest grown region with grownHere false', () => {
    const f = family({ NORTH_INDIA: care('north') }, ['NORTH_INDIA']);
    const r = resolveRegionCare(f, 'HILLS_COOL');
    expect(r).toMatchObject({ from: 'NORTH_INDIA', grownHere: false });
    expect(r.care.phases[0].phase).toBe('north');
  });

  it('throws on a sameAs chain', () => {
    const f = family(
      {
        NORTH_INDIA: care('north'),
        EAST_INDIA: { sameAs: 'NORTH_INDIA' },
        CENTRAL_INDIA: { sameAs: 'EAST_INDIA' },
      },
      ['NORTH_INDIA', 'EAST_INDIA', 'CENTRAL_INDIA'],
    );
    expect(() => resolveRegionCare(f, 'CENTRAL_INDIA')).toThrow(/sameAs/);
  });
});
