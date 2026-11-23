import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { treeCareSeedSchema } from '../../domain/tree-care.schema';
import { PLUM_CARE } from './plum.seed';

const region = (r: keyof typeof PLUM_CARE.regions) =>
  PLUM_CARE.regions[r] as RegionCare;
const item = (r: keyof typeof PLUM_CARE.regions, key: string): TreeCareItem =>
  region(r).items.find((i) => i.key === key)!;

/** Spot checks copied from the owner-approved table (docs/plant-care/plum.md, 2026-11-23). */
describe('plum care (owner-approved 2026-11-23)', () => {
  it('is a valid approved seed', () => {
    expect(
      treeCareSeedSchema.safeParse({
        ...PLUM_CARE,
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('North: December manure, FYM 6 kg + SSP 95 g + MOP 60 g × age up to 6 years (PAU, Q1)', () => {
    expect(item('NORTH_INDIA', 'manure_dec')).toMatchObject({
      title: "Spread the year's manure, SSP and potash",
      when: { kind: 'CALENDAR', from: [12, 1], to: [12, 31] },
      dose: {
        organic: [{ what: 'FYM', grams: 6000 }],
        chemical: [
          { what: 'SSP', grams: 95 },
          { what: 'MOP', grams: 60 },
        ],
        maxAgeYears: 6,
        together: true,
      },
    });
    expect(item('NORTH_INDIA', 'urea_bloom').dose).toMatchObject({
      chemical: [{ what: 'urea', grams: 30 }],
      maxAgeYears: 6,
    });
  });

  it('North: fruit fly trap in the second week of April, bearing trees only (PAU)', () => {
    expect(item('NORTH_INDIA', 'fruit_fly_apr')).toMatchObject({
      title: 'Hang a fruit fly trap; bury fallen fruit',
      stages: ['BEARING'],
      when: { kind: 'CALENDAR', from: [4, 8], to: [4, 14] },
    });
  });

  it('Hills: dormant-season prune Dec 1–Feb 29 and UHF P and K to 7 years (Q4, Q7)', () => {
    expect(item('HILLS_COOL', 'prune_winter')).toMatchObject({
      title: 'Prune and train the tree while it is bare',
      when: { kind: 'CALENDAR', from: [12, 1], to: [2, 29] },
    });
    expect(item('HILLS_COOL', 'manure_winter')).toMatchObject({
      when: { kind: 'CALENDAR', from: [12, 1], to: [1, 31] },
      dose: {
        chemical: [
          { what: 'SSP', grams: 219 },
          { what: 'MOP', grams: 167 },
        ],
        maxAgeYears: 7,
      },
    });
  });

  it('no held rows, growth regulators or lime sulphur; urea split only conditional', () => {
    const items = Object.values(PLUM_CARE.regions).flatMap((r) =>
      r && 'items' in r ? r.items : [],
    );
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain('urea_feb');
    expect(keys).not.toContain('urea_mar');
    const text = JSON.stringify(PLUM_CARE);
    expect(text).not.toMatch(/lime sulphur|NAA|ethrel/i);
    expect(items.filter((i) => i.key === 'urea_bloom')).toHaveLength(2);
    expect(items.every((i) => i.key !== 'urea_bloom' || i.conditional)).toBe(
      true,
    );
    expect(PLUM_CARE.pendingRegions).toBeUndefined();
  });

  it('a bearing tree in Punjab in mid-April gets the trap, watering and the coming harvest', () => {
    const { reminders, thisMonth } = treeCareDue(PLUM_CARE, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2020-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-04-10T06:00:00+05:30'),
    });
    expect(reminders.map((r) => r.key).sort()).toEqual([
      'fruit_fly_apr',
      'harvest',
      'water_summer',
    ]);
    expect(thisMonth.map((l) => l.title)).toContain(
      'Wash aphids off curled shoots',
    );
  });
});
