import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { treeCareSeedSchema } from '../../domain/tree-care.schema';
import { BER_CARE } from './ber.seed';

const region = (r: keyof typeof BER_CARE.regions) =>
  BER_CARE.regions[r] as RegionCare;
const item = (r: keyof typeof BER_CARE.regions, key: string): TreeCareItem =>
  region(r).items.find((i) => i.key === key)!;
const allItems = () =>
  Object.values(BER_CARE.regions).flatMap((r) =>
    r && 'items' in r ? r.items : [],
  );

/** Spot checks copied from the owner-approved table (docs/plant-care/ber.md, 2026-11-24). */
describe('ber care (owner-approved 2026-11-24)', () => {
  it('passes the seed schema', () => {
    expect(
      treeCareSeedSchema.safeParse({
        ...BER_CARE,
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('North: May prune, PAU per-year manure and urea up to 5 years, October split (Q5)', () => {
    expect(item('NORTH_INDIA', 'prune_may')).toMatchObject({
      title: 'Prune the tree hard after the harvest',
      when: { kind: 'CALENDAR', from: [5, 16], to: [5, 31] },
    });
    expect(item('NORTH_INDIA', 'manure_may').dose).toEqual({
      organic: [{ what: 'FYM', grams: 20000 }],
      chemical: [],
      maxAgeYears: 5,
    });
    expect(item('NORTH_INDIA', 'urea_fruit_set')).toMatchObject({
      title: 'Give the rest of the urea, then mulch',
      when: { kind: 'CALENDAR', from: [10, 1], to: [10, 31] },
      dose: { chemical: [{ what: 'urea', grams: 100 }], maxAgeYears: 5 },
    });
  });

  it('West: CAZRI rows only, feeds W5 and W7 held (Q2, Q4)', () => {
    const dated = region('WEST_INDIA').items.filter((i) => !i.conditional);
    expect(dated.map((i) => i.key)).toEqual([
      'prune_may',
      'turn_soil',
      'first_water',
      'water_flowering',
      'water_fruit',
    ]);
    expect(item('WEST_INDIA', 'water_fruit')).toMatchObject({
      title: 'Water every 15 days while fruit grows',
      when: { kind: 'CALENDAR', from: [10, 16], to: [2, 29] },
    });
  });

  it('South and East: prune plus flat bearing manure only (Q3, Q6, Q7); S3 held', () => {
    expect(item('SOUTH_DECCAN', 'manure_after_prune')).toMatchObject({
      title: 'Dig in manure right after pruning',
      stages: ['BEARING'],
      when: { kind: 'CALENDAR', from: [2, 1], to: [3, 31] },
    });
    expect(item('SOUTH_DECCAN', 'manure_after_prune').organic).toMatch(/50 kg/);
    expect(item('EAST_INDIA', 'prune_march')).toMatchObject({
      title: 'Head back the branches after harvest',
      when: { kind: 'CALENDAR', from: [3, 1], to: [3, 31] },
    });
    expect(item('EAST_INDIA', 'manure_march').organic).toMatch(
      /10 kg \+ borax 25 g/,
    );
    for (const r of ['SOUTH_DECCAN', 'EAST_INDIA'] as const) {
      const dated = region(r).items.filter((i) => !i.conditional);
      expect(dated).toHaveLength(2);
      expect(dated.every((i) => !i.chemical && !i.dose)).toBe(true);
      expect(dated.some((i) => i.stages.includes('YOUNG'))).toBe(false);
    }
  });

  it('no chemical spray, no held rows, pending regions have no care', () => {
    const items = allItems();
    const keys = items.map((i) => i.key);
    for (const held of ['feed_july', 'urea_nov', 'kno3_spray'])
      expect(keys).not.toContain(held);
    const text = JSON.stringify(items).toLowerCase();
    expect(text).not.toMatch(
      /carbendazim|methyl eugenol|1% bordeaux|bordeaux (mixture|spray)/,
    );
    expect(
      items.filter((i) => i.category === 'PROTECTION' && i.chemical),
    ).toEqual([]);
    expect(BER_CARE.pendingRegions).toEqual(['CENTRAL_INDIA', 'COASTAL_HUMID']);
    expect(BER_CARE.regions.CENTRAL_INDIA).toBeUndefined();
    expect(BER_CARE.regions.COASTAL_HUMID).toBeUndefined();
  });

  it('a bearing tree in Punjab in late May gets the prune and the capped manure', () => {
    const { reminders, thisMonth } = treeCareDue(BER_CARE, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2018-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-05-20T06:00:00+05:30'),
    });
    expect(reminders.length).toBeLessThanOrEqual(3);
    expect(reminders.map((r) => r.key).sort()).toEqual([
      'manure_may',
      'prune_may',
    ]);
    expect(reminders.find((r) => r.key === 'manure_may')!.amount).toMatch(
      /5 years or older: 100 kg FYM/,
    );
    expect(thisMonth.map((l) => l.title)).toContain(
      'Bury fruit with fruit-fly maggots',
    );
  });
});
