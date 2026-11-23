import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { treeCareSeedSchema } from '../../domain/tree-care.schema';
import { PEACH_CARE } from './peach.seed';

const region = (r: keyof typeof PEACH_CARE.regions) =>
  PEACH_CARE.regions[r] as RegionCare;
const item = (r: keyof typeof PEACH_CARE.regions, key: string): TreeCareItem =>
  region(r).items.find((i) => i.key === key)!;

/** Spot checks copied from the owner-approved table (docs/plant-care/peach.md, 2026-11-23). */
describe('peach care (owner-approved 2026-11-23)', () => {
  it('passes the seed schema', () => {
    expect(
      treeCareSeedSchema.safeParse({
        ...PEACH_CARE,
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('North: January prune, March thinning and May fruit-fly trap (PAU); doses as text (Q1)', () => {
    expect(item('NORTH_INDIA', 'prune_jan')).toMatchObject({
      title: 'Prune and train the bare tree in January',
      when: { kind: 'CALENDAR', from: [1, 1], to: [1, 31] },
    });
    expect(item('NORTH_INDIA', 'thin_fruit')).toMatchObject({
      title: "Thin the fruit to a hand's width apart",
      stages: ['BEARING'],
      when: { kind: 'CALENDAR', from: [3, 8], to: [3, 31] },
    });
    expect(item('NORTH_INDIA', 'fruit_fly_may')).toMatchObject({
      title: 'Hang a fruit fly trap; bury fallen fruit',
      when: { kind: 'CALENDAR', from: [5, 1], to: [5, 7] },
    });
    for (const key of ['manure_dec', 'urea_jan', 'urea_mar'])
      expect(item('NORTH_INDIA', key).dose).toBeUndefined();
  });

  it('Hills: only the four month-based rows are dated (Q2), with April–June water', () => {
    const dated = region('HILLS_COOL').items.filter((i) => !i.conditional);
    expect(dated.map((i) => i.key)).toEqual([
      'manure_dec',
      'prune_jan',
      'water_apr_jun',
      'fruit_fly_trap',
    ]);
    expect(item('HILLS_COOL', 'water_apr_jun')).toMatchObject({
      title: 'Water every 8–10 days while fruit grows',
      when: { kind: 'CALENDAR', from: [4, 1], to: [6, 30] },
    });
  });

  it('Hills: UHF per-year dose up to 7 years, urea split on bud swell (Q3)', () => {
    expect(item('HILLS_COOL', 'manure_dec').dose).toEqual({
      organic: [],
      chemical: [
        { what: 'SSP', grams: 219 },
        { what: 'MOP', grams: 167 },
      ],
      maxAgeYears: 7,
    });
    expect(item('HILLS_COOL', 'urea_bloom')).toMatchObject({
      conditional: expect.any(String),
      dose: { chemical: [{ what: 'urea', grams: 76 }], maxAgeYears: 7 },
    });
  });

  it('no chemical spray: no dormant Bordeaux spray, oxydemeton or growth regulator (Q4–Q6)', () => {
    const items = Object.values(PEACH_CARE.regions).flatMap((r) =>
      r && 'items' in r ? r.items : [],
    );
    const text = JSON.stringify(items).toLowerCase();
    expect(text).not.toMatch(/oxydemeton|ethephon|cyanamide|spray oil/);
    expect(text).not.toMatch(/bordeaux (mixture|spray)|1% bordeaux/);
    expect(
      items.filter((i) => i.category === 'PROTECTION' && i.chemical),
    ).toEqual([]);
    expect(PEACH_CARE.pendingRegions).toBeUndefined();
  });

  it('a bearing tree in Punjab in mid-March gets the urea, thinning and watering reminders', () => {
    const { reminders, thisMonth } = treeCareDue(PEACH_CARE, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2020-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-03-10T06:00:00+05:30'),
    });
    expect(reminders.map((r) => r.key)).toEqual([
      'urea_mar',
      'thin_fruit',
      'water_fruit',
    ]);
    expect(thisMonth.map((l) => l.title)).toContain(
      'Wash aphids off buds and shoots',
    );
  });
});
