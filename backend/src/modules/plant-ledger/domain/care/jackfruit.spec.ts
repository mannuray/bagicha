import { LifecycleStage } from '@prisma/client';
import { NOT_GROWN_NOTE, treeCareDue } from './engine';
import { JACKFRUIT_CARE } from './jackfruit';
import { careApplies } from './region-care';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the approved table (docs/plant-care/jackfruit.md). */
describe('jackfruit care (approved table)', () => {
  it('East: trunk band against mealybug from Dec 1', () => {
    const { reminders } = treeCareDue(JACKFRUIT_CARE, {
      region: 'EAST_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-12-02'),
    });
    expect(reminders.find((r) => r.key === 'mealybug_band')).toMatchObject({
      title: 'Band the trunk against mealybug',
      sourceKey: 'jackfruit:mealybug_band:2026-12-01',
    });
  });

  it('South Deccan: feed before the monsoon from May 1, per split', () => {
    const { reminders } = treeCareDue(JACKFRUIT_CARE, {
      region: 'SOUTH_DECCAN',
      stage: bearing,
      plantedAt: ist('2023-01-01'),
      now: ist('2026-05-02'),
    });
    expect(reminders.find((r) => r.key === 'pre_monsoon_feed')).toMatchObject({
      title: 'Feed before the monsoon',
      sourceKey: 'jackfruit:pre_monsoon_feed:2026-05-01',
      // The table's 250 g MOP is 83 g × 3 = 249 g.
      amount:
        'For a 3-year-old tree: 15 kg FYM; or 489 g urea + 750 g SSP + 249 g MOP',
    });
  });

  it('Coastal: harvest from Jun 1, and no feeding reminders (rarely manured)', () => {
    const { reminders } = treeCareDue(JACKFRUIT_CARE, {
      region: 'COASTAL_HUMID',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-06-02'),
    });
    expect(reminders.find((r) => r.key === 'cut_ripe_fruit')).toMatchObject({
      title: 'Cut ripe fruit off by the stalk',
      sourceKey: 'jackfruit:cut_ripe_fruit:2026-06-01',
    });
    expect(reminders.map((r) => r.category)).not.toContain('FEEDING');
  });

  it('no grown region is pending: elsewhere the nearest region is used, with a note', () => {
    expect(JACKFRUIT_CARE.pendingRegions ?? []).toEqual([]);
    expect(careApplies(JACKFRUIT_CARE, 'NORTH_INDIA')).toBe(true);
    expect(
      treeCareDue(JACKFRUIT_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        plantedAt: null,
        now: ist('2026-06-02'),
      }).note,
    ).toBe(NOT_GROWN_NOTE);
  });
});
