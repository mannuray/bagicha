import { LifecycleStage } from '@prisma/client';
import { carePhaseView, treeCareDue } from './engine';
import { GUAVA_CARE } from './guava';
import { careApplies } from './region-care';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the approved table (docs/plant-care/guava.md). */
describe('guava care (approved table)', () => {
  it('North: manure and half the fertiliser from May 15, with the per-age dose', () => {
    const { reminders } = treeCareDue(GUAVA_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: ist('2022-01-01'),
      now: ist('2026-05-16'),
    });
    const feed = reminders.find((r) => r.key === 'feed_manure');
    expect(feed).toMatchObject({
      title: 'Feed manure and half the fertiliser',
      sourceKey: 'guava:feed_manure:2026-05-15',
      amount: 'For a 4-year-old tree: 440 g urea + 620 g SSP + 160 g MOP',
    });
    expect(feed?.organic).toMatch(/30–40 kg/);
  });

  it('North: the owner-approved Bordeaux spray after pruning, May 1–10', () => {
    const { reminders } = treeCareDue(GUAVA_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-05-02'),
    });
    expect(reminders.find((r) => r.key === 'bordeaux_spray')).toMatchObject({
      title: 'Spray Bordeaux mixture after pruning',
      sourceKey: 'guava:bordeaux_spray:2026-05-01',
    });
  });

  it('South Deccan: urea and zinc spray on the October flush', () => {
    const { reminders } = treeCareDue(GUAVA_CARE, {
      region: 'SOUTH_DECCAN',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-10-02'),
    });
    const spray = reminders.find((r) => r.key === 'nutrient_spray');
    expect(spray).toMatchObject({
      title: 'Spray urea and zinc on the new flush',
      sourceKey: 'guava:nutrient_spray:2026-10-01',
    });
    expect(spray?.chemical).toMatch(/Urea 10 g \+ zinc sulphate 5 g per litre/);
  });

  it('young trees: the last third of the fertiliser from Feb 1, same in North and South', () => {
    for (const region of ['NORTH_INDIA', 'SOUTH_DECCAN'] as const) {
      const { reminders } = treeCareDue(GUAVA_CARE, {
        region,
        stage: LifecycleStage.SAPLING,
        plantedAt: ist('2024-06-01'),
        now: ist('2026-02-03'),
      });
      expect(reminders.find((r) => r.key === 'feed_young_third')).toMatchObject(
        {
          title: 'Feed the last third of the fertiliser',
          sourceKey: 'guava:feed_young_third:2026-02-01',
          amount: 'For a 1-year-old tree: 72 g urea + 104 g SSP + 28 g MOP',
        },
      );
    }
  });

  it('phases: North flowers in Aug–Sep', () => {
    expect(
      carePhaseView(GUAVA_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        now: ist('2026-08-15'),
      }).current_phase,
    ).toBe('flowering');
  });

  it('pending regions keep the season pack', () => {
    for (const region of [
      'EAST_INDIA',
      'CENTRAL_INDIA',
      'WEST_INDIA',
      'COASTAL_HUMID',
    ] as const) {
      expect(careApplies(GUAVA_CARE, region)).toBe(false);
    }
    expect(careApplies(GUAVA_CARE, 'NORTH_INDIA')).toBe(true);
  });
});
