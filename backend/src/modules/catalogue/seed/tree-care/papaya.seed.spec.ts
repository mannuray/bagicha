import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { CATALOGUE_SEED } from '..';

const papaya = CATALOGUE_SEED.treeCare.find((c) => c.family === 'papaya')!;
const region = (r: keyof typeof papaya.regions) =>
  papaya.regions[r] as RegionCare;
const item = (r: keyof typeof papaya.regions, key: string): TreeCareItem =>
  region(r).items.find((i) => i.key === key)!;

/** Spot checks copied from the owner-approved table (docs/plant-care/papaya.md, 2026-11-23). */
describe('papaya care (owner-approved 2026-11-23)', () => {
  it('South Deccan: the first feed opens at day 90 for 30 days (TNAU)', () => {
    expect(item('SOUTH_DECCAN', 'feed_1')).toMatchObject({
      title: 'Give feed 1: 50 g each of N, P and K',
      when: { kind: 'FROM_PLANTING', fromDays: 90, toDays: 119 },
    });
  });

  it('Coastal humid: ring watering through the dry months (KAU)', () => {
    expect(item('COASTAL_HUMID', 'summer_water')).toMatchObject({
      title: 'Water in a ring through the dry months',
      when: { kind: 'CALENDAR', from: [1, 1], to: [5, 31] },
    });
  });

  it('North India: frost cover for young plants, Nov 1 to end Feb (PAU)', () => {
    expect(item('NORTH_INDIA', 'frost_cover')).toMatchObject({
      title: 'Cover young papaya against frost',
      stages: ['YOUNG'],
      when: { kind: 'CALENDAR', from: [11, 1], to: [2, 29] },
    });
  });

  it('East India: ten feeds from planting, every 60 days (Assam AU)', () => {
    const feeds = region('EAST_INDIA').items.filter((i) =>
      i.key.startsWith('feed_'),
    );
    expect(
      feeds.map((i) =>
        i.when.kind === 'FROM_PLANTING' ? i.when.fromDays : -1,
      ),
    ).toEqual([0, 60, 120, 180, 240, 300, 360, 420, 480, 540]);
  });

  it('west and central India stay pending; north is grown and has care', () => {
    expect(papaya.pendingRegions).toEqual(['WEST_INDIA', 'CENTRAL_INDIA']);
    expect(papaya.grownIn).toContain('NORTH_INDIA');
    expect(region('NORTH_INDIA').items.length).toBeGreaterThan(0);
  });

  it('a papaya planted on 1 Jun in Tamil Nadu gets its first feed from 30 Aug', () => {
    const { reminders, needsPlantingMonth } = treeCareDue(papaya, {
      region: 'SOUTH_DECCAN',
      stage: LifecycleStage.SAPLING,
      plantedAt: new Date('2026-06-01T00:00:00Z'),
      plantingPrecision: 'EXACT_DATE',
      now: new Date('2026-08-31T06:00:00+05:30'),
    });
    // The zinc spray at day 120 (29 Sep) is within the 30-day lookahead.
    expect(reminders.map((r) => r.sourceKey)).toEqual([
      'papaya:feed_1:d90',
      'papaya:zinc_boron_1:d120',
    ]);
    expect(needsPlantingMonth).toBe(false);
  });

  it('a papaya with no planting date in the north is never asked for one', () => {
    const { needsPlantingMonth, thisMonth } = treeCareDue(papaya, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.SAPLING,
      plantedAt: null,
      plantingPrecision: 'UNKNOWN',
      now: new Date('2026-12-10T06:00:00+05:30'),
    });
    expect(needsPlantingMonth).toBe(false);
    expect(thisMonth.map((l) => l.title)).toContain(
      'Cover young papaya against frost',
    );
  });
});
