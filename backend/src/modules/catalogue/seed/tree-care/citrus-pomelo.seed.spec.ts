import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import { careForTree } from '../../domain/care-kind';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { CATALOGUE_SEED } from '..';

const citrus = CATALOGUE_SEED.treeCare.find((c) => c.family === 'citrus')!;
const northItems = (kind: string, key: string): TreeCareItem[] => {
  const k = citrus.kinds!.find((c) => c.key === kind)!;
  return (k.regions.NORTH_INDIA as RegionCare).items.filter(
    (i) => i.key === key,
  );
};
const pomelo = careForTree(citrus, {
  variety: 'Chakotra',
  species: 'pomelo',
  name: 'Pomelo (Chakotra)',
});

/** Spot checks copied from the owner-approved table (docs/plant-care/citrus-pomelo.md, 2026-11-24). */
describe('citrus pomelo kind (owner-approved 2026-11-24)', () => {
  it('the Chakotra tree is a pomelo; a grapefruit is no kind', () => {
    expect(pomelo?.family).toBe('citrus:pomelo');
    expect(careForTree(citrus, { name: 'grapefruit' })).toBeNull();
    expect(careForTree(citrus, { name: 'batabi lebu' })?.family).toBe(
      'citrus:pomelo',
    );
  });

  it('P1: manure Dec–Jan, 10 kg FYM × age up to 5 years (IH 2026)', () => {
    expect(northItems('pomelo', 'manure')).toEqual([
      expect.objectContaining({
        title: "Spread the year's manure under the tree",
        when: { kind: 'CALENDAR', from: [12, 1], to: [1, 31] },
        dose: {
          organic: [{ what: 'FYM', grams: 10000 }],
          chemical: [],
          maxAgeYears: 5,
        },
      }),
    ]);
  });

  it('P10: pick pomelos Oct–Nov', () => {
    expect(northItems('pomelo', 'pick_pomelo')).toEqual([
      expect.objectContaining({
        title: 'Pick pomelos when the rind turns bright yellow',
        when: { kind: 'CALENDAR', from: [10, 1], to: [11, 30] },
      }),
    ]);
  });

  it('K: the March Bordeaux spray now reaches pomelo as well', () => {
    for (const kind of ['mandarin', 'sweet_orange', 'pomelo'])
      expect(northItems(kind, 'bordeaux_spray')).toHaveLength(1);
    expect(northItems('lime', 'bordeaux_spray')).toHaveLength(0);
  });

  it('X: the 2–3-week summer watering stays with the four kinds; pomelo gets 7–10 days', () => {
    for (const kind of ['lime', 'lemon', 'mandarin', 'sweet_orange']) {
      expect(northItems(kind, 'summer_water')).toHaveLength(1);
      expect(northItems(kind, 'summer_water_pomelo')).toHaveLength(0);
    }
    expect(northItems('pomelo', 'summer_water')).toHaveLength(0);
    expect(northItems('pomelo', 'summer_water_pomelo')).toEqual([
      expect.objectContaining({
        title: 'Water every 7–10 days through the summer',
        when: { kind: 'CALENDAR', from: [4, 1], to: [6, 30] },
      }),
    ]);
  });

  it('a bearing pomelo in Punjab in April gets the second feed and summer watering', () => {
    const { reminders } = treeCareDue(pomelo!, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2018-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-04-10T06:00:00+05:30'),
    });
    expect(reminders.length).toBeLessThanOrEqual(3);
    expect(reminders.map((r) => r.key).sort()).toEqual([
      'second_feed',
      'summer_water_pomelo',
    ]);
  });

  it('East India is pending for pomelo', () => {
    expect(pomelo?.pendingRegions).toContain('EAST_INDIA');
    expect(Object.keys(pomelo!.regions)).toEqual(['NORTH_INDIA']);
  });
});
