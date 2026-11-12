import { LifecycleStage } from '@prisma/client';
import { carePhaseView, NOT_GROWN_NOTE, treeCareDue } from './engine';
import { LITCHI_CARE } from './litchi';
import { careApplies } from './region-care';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the approved table (docs/plant-care/litchi.md). */
describe('litchi care (approved table)', () => {
  it('East: main fertiliser after harvest from Jun 15, with the E split', () => {
    const { reminders } = treeCareDue(LITCHI_CARE, {
      region: 'EAST_INDIA',
      stage: bearing,
      plantedAt: ist('2018-01-01'),
      now: ist('2026-06-16'),
    });
    expect(reminders.find((r) => r.key === 'main_feed')).toMatchObject({
      title: 'Feed the main fertiliser after harvest',
      sourceKey: 'litchi:main_feed:2026-06-15',
      amount: 'For a 8-year-old tree: 480 g urea + 800 g SSP + 440 g MOP',
    });
  });

  it('North: the year’s manure in December, with SSP and MOP', () => {
    const { reminders } = treeCareDue(LITCHI_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: ist('2018-01-01'),
      now: ist('2026-12-02'),
    });
    const manure = reminders.find((r) => r.key === 'manure');
    expect(manure).toMatchObject({
      title: "Spread the year's manure",
      sourceKey: 'litchi:manure:2026-12-01',
      // The table's 665 g is 83 g × 8 = 664 g.
      amount: 'For a 8-year-old tree: 32 kg FYM; or 800 g SSP + 664 g MOP',
    });
    expect(manure?.organic).toBe(
      "All the year's FYM + all the SSP + all the MOP",
    );
  });

  it('East: manure in September, FYM only', () => {
    const { reminders } = treeCareDue(LITCHI_CARE, {
      region: 'EAST_INDIA',
      stage: bearing,
      plantedAt: ist('2018-01-01'),
      now: ist('2026-09-02'),
    });
    expect(reminders.find((r) => r.key === 'manure')).toMatchObject({
      sourceKey: 'litchi:manure:2026-09-01',
      amount: 'For a 8-year-old tree: 32 kg FYM',
    });
  });

  it('North young trees: dhaincha sown from Feb 10; never in the East', () => {
    const at = ist('2026-02-11');
    const young = LifecycleStage.SAPLING;
    const north = treeCareDue(LITCHI_CARE, {
      region: 'NORTH_INDIA',
      stage: young,
      plantedAt: null,
      now: at,
    });
    expect(north.reminders.find((r) => r.key === 'dhaincha')).toMatchObject({
      title: 'Sow dhaincha around the young tree',
      sourceKey: 'litchi:dhaincha:2026-02-10',
    });
    const east = treeCareDue(LITCHI_CARE, {
      region: 'EAST_INDIA',
      stage: young,
      plantedAt: null,
      now: at,
    });
    expect([...east.reminders, ...east.onPage].map((r) => r.key)).not.toContain(
      'dhaincha',
    );
  });

  it('phases: both groups flower in Feb–Mar; frost is watched only in the North', () => {
    const at = ist('2026-12-15');
    expect(
      carePhaseView(LITCHI_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        now: at,
      }).watch_for,
    ).toContain('Frost');
    expect(
      carePhaseView(LITCHI_CARE, {
        region: 'EAST_INDIA',
        stage: bearing,
        now: at,
      }).watch_for,
    ).not.toContain('Frost');
    expect(
      carePhaseView(LITCHI_CARE, {
        region: 'EAST_INDIA',
        stage: bearing,
        now: ist('2026-02-15'),
      }).current_phase,
    ).toBe('flowering');
  });

  it('no grown region is pending: elsewhere the nearest region is used, with a note', () => {
    expect(LITCHI_CARE.pendingRegions ?? []).toEqual([]);
    expect(careApplies(LITCHI_CARE, 'CENTRAL_INDIA')).toBe(true);
    expect(
      treeCareDue(LITCHI_CARE, {
        region: 'CENTRAL_INDIA',
        stage: bearing,
        plantedAt: null,
        now: ist('2026-06-16'),
      }).note,
    ).toBe(NOT_GROWN_NOTE);
  });
});
