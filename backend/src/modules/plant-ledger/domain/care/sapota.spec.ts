import { LifecycleStage } from '@prisma/client';
import { NOT_GROWN_NOTE, treeCareDue } from './engine';
import { careApplies } from './region-care';
import { SAPOTA_CARE } from './sapota';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the approved table (docs/plant-care/sapota.md). */
describe('sapota care (approved table)', () => {
  it('West: monsoon feed from Jun 15, FYM and urea per year of age', () => {
    const { reminders } = treeCareDue(SAPOTA_CARE, {
      region: 'WEST_INDIA',
      stage: bearing,
      plantedAt: ist('2023-01-01'),
      now: ist('2026-06-16'),
    });
    const feed = reminders.find((r) => r.key === 'monsoon_feed');
    expect(feed).toMatchObject({
      title: 'Feed at the start of the monsoon',
      sourceKey: 'sapota:monsoon_feed:2026-06-15',
      amount: 'For a 3-year-old tree: 30 kg FYM; or 651 g urea',
    });
    expect(feed?.chemical).toMatch(/SSP 1560 g \+ MOP 415 g/);
  });

  it('South Deccan: one feed from Sep 1, the whole year’s FYM and urea', () => {
    const { reminders } = treeCareDue(SAPOTA_CARE, {
      region: 'SOUTH_DECCAN',
      stage: bearing,
      plantedAt: ist('2023-01-01'),
      now: ist('2026-09-02'),
    });
    const feed = reminders.find((r) => r.key === 'post_monsoon_feed');
    expect(feed).toMatchObject({
      title: 'Feed after the monsoon',
      sourceKey: 'sapota:post_monsoon_feed:2026-09-01',
      // The table's 1305 g, as the engine rounds it.
      amount: 'For a 3-year-old tree: 30 kg FYM; or 1.3 kg urea',
    });
    expect(feed?.chemical).toMatch(/SSP 3125 g \+ MOP 833 g/);
  });

  it('Coastal: fruit fly trap from Mar 1; bud borer only on the plant page', () => {
    const { reminders, onPage } = treeCareDue(SAPOTA_CARE, {
      region: 'COASTAL_HUMID',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-03-02'),
    });
    expect(reminders.find((r) => r.key === 'fruit_fly_trap')).toMatchObject({
      title: 'Hang a fruit fly trap, bag fallen fruit',
      sourceKey: 'sapota:fruit_fly_trap:2026-03-01',
    });
    expect(reminders.map((r) => r.key)).not.toContain('pick_bored_buds');
    expect(onPage.find((i) => i.key === 'bud_borer_seen')?.conditional).toMatch(
      /webbed leaves/i,
    );
  });

  it('no grown region is pending: elsewhere the nearest region is used, with a note', () => {
    expect(SAPOTA_CARE.pendingRegions ?? []).toEqual([]);
    expect(careApplies(SAPOTA_CARE, 'NORTH_INDIA')).toBe(true);
    expect(
      treeCareDue(SAPOTA_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        plantedAt: null,
        now: ist('2026-06-16'),
      }).note,
    ).toBe(NOT_GROWN_NOTE);
  });
});
