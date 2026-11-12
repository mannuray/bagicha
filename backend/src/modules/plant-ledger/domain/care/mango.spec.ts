import { LifecycleStage } from '@prisma/client';
import { carePhaseView, treeCareDue } from './engine';
import { MANGO_CARE } from './mango';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the verified table (mango-verified.md, 2026-11-12). */
describe('mango care (verified table)', () => {
  it('North/East: hoppers spray from Feb 10, with the 45-day waiting period', () => {
    const { reminders } = treeCareDue(MANGO_CARE, {
      region: 'EAST_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-02-12'),
    });
    const hopper = reminders.find((r) => r.key === 'hopper_spray');
    expect(hopper).toMatchObject({
      title: 'Spray for hoppers as flowers appear',
      sourceKey: 'mango:hopper_spray:2026-02-10',
    });
    expect(hopper?.chemical).toMatch(/not within 45 days of picking/);
  });

  it('Coastal: second feed opens Aug 15 with the per-age dose', () => {
    const { reminders } = treeCareDue(MANGO_CARE, {
      region: 'COASTAL_HUMID',
      stage: bearing,
      plantedAt: ist('2020-01-01'),
      now: ist('2026-08-20'),
    });
    const feed = reminders.find((r) => r.key === 'second_feed');
    expect(feed?.sourceKey).toBe('mango:second_feed:2026-08-15');
    expect(feed?.amount).toBe(
      'For a 6-year-old tree: 660 g urea + 930 g SSP + 510 g MOP',
    );
  });

  it('South Deccan: copper spray in October; no mealybug band outside North/East', () => {
    const oct = treeCareDue(MANGO_CARE, {
      region: 'SOUTH_DECCAN',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-10-05'),
    });
    expect(oct.reminders.map((r) => r.key)).toContain('copper_spray');
    const nov = treeCareDue(MANGO_CARE, {
      region: 'CENTRAL_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-11-20'),
    });
    expect([...nov.reminders, ...nov.onPage].map((r) => r.key)).not.toContain(
      'mealybug_band',
    );
  });

  it('frost cover for young trees in Central, never in West (Gujarat unverified)', () => {
    const young = LifecycleStage.SAPLING;
    const at = ist('2026-12-22');
    expect(
      treeCareDue(MANGO_CARE, {
        region: 'CENTRAL_INDIA',
        stage: young,
        plantedAt: null,
        now: at,
      }).reminders.map((r) => r.key),
    ).toContain('frost_cover');
    expect(
      treeCareDue(MANGO_CARE, {
        region: 'WEST_INDIA',
        stage: young,
        plantedAt: null,
        now: at,
      }).reminders.map((r) => r.key),
    ).not.toContain('frost_cover');
  });

  it('phases: North flowering in February, Coastal in November', () => {
    expect(
      carePhaseView(MANGO_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        now: ist('2026-02-15'),
      }).current_phase,
    ).toBe('flowering');
    expect(
      carePhaseView(MANGO_CARE, {
        region: 'COASTAL_HUMID',
        stage: bearing,
        now: ist('2026-11-15'),
      }).current_phase,
    ).toBe('flowering');
  });

  it('matches the approved table: shoot gall watched before flowering in the North', () => {
    const v = carePhaseView(MANGO_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      now: ist('2026-11-15'),
    });
    expect(v.current_phase).toBe('pre_flowering');
    expect(v.watch_for).toEqual(['Mealybug', 'Shoot gall']);
  });

  it('adds nothing the table lacks: young trees have no invented phases', () => {
    const v = carePhaseView(MANGO_CARE, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.SAPLING,
      now: ist('2026-05-15'),
    });
    expect(v).toMatchObject({
      current_phase: 'growing',
      avoid_now: [],
      watch_for: [],
    });
  });

  it('"only if you see it" items appear only in their season', () => {
    const july = treeCareDue(MANGO_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-07-15'),
    });
    expect(july.onPage.map((i) => i.key)).not.toContain('malformation');
    expect(july.onPage.map((i) => i.key)).not.toContain('hopper_repeat');
    const feb = treeCareDue(MANGO_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-02-20'),
    });
    expect(feb.onPage.map((i) => i.key)).toContain('malformation');
  });

  it('blossom blight: coastal flowering only, azoxystrobin as the approved option', () => {
    const item = (
      MANGO_CARE.regions.COASTAL_HUMID as {
        items: {
          key: string;
          when: unknown;
          organic: string;
          chemical?: string;
        }[];
      }
    ).items.find((i) => i.key === 'blossom_blight');
    expect(item?.when).toEqual({
      kind: 'CALENDAR',
      from: [11, 1],
      to: [12, 31],
    });
    expect(item?.organic).not.toMatch(/copper/i);
    expect(item?.chemical).toMatch(/Azoxystrobin 23 SC 1 ml per litre/);
  });
});
