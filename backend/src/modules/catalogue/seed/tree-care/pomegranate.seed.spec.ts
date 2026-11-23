import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { CATALOGUE_SEED } from '..';

const pomegranate = CATALOGUE_SEED.treeCare.find(
  (c) => c.family === 'pomegranate',
)!;
const region = (r: keyof typeof pomegranate.regions) =>
  pomegranate.regions[r] as RegionCare;
const item = (r: keyof typeof pomegranate.regions, key: string): TreeCareItem =>
  region(r).items.find((i) => i.key === key)!;

/** Spot checks copied from the owner-approved table (docs/plant-care/pomegranate.md, 2026-11-23). */
describe('pomegranate care (owner-approved 2026-11-23, natural flowering)', () => {
  it('North: the yearly manure in December, 5 kg × age up to 5 years (PAU)', () => {
    expect(item('NORTH_INDIA', 'manure_dec')).toMatchObject({
      title: 'Spread the yearly manure in December',
      when: { kind: 'CALENDAR', from: [12, 1], to: [12, 31] },
      dose: { organic: [{ what: 'FYM', grams: 5000 }], maxAgeYears: 5 },
    });
  });

  it('North: black-spot guard May–July for bearing trees, labelled spray (PAU, Q6)', () => {
    const guard = item('NORTH_INDIA', 'black_spot_rains');
    expect(guard).toMatchObject({
      stages: ['BEARING'],
      when: { kind: 'CALENDAR', from: [5, 1], to: [7, 31] },
    });
    expect(guard.chemical).toMatch(/kasugamycin.*10 days/i);
  });

  it('South Deccan: only the December prune is dated (TNAU; feed held, Q1)', () => {
    const dated = region('SOUTH_DECCAN').items.filter((i) => !i.conditional);
    expect(dated.map((i) => i.key)).toEqual(['prune_dec']);
  });

  it('no bahar steps and no held rows', () => {
    const keys = Object.values(pomegranate.regions)
      .flatMap((r) => (r && 'items' in r ? r.items : []))
      .map((i) => i.key);
    expect(keys).not.toContain('deblossom');
    expect(keys).not.toContain('feed_after_prune');
    expect(pomegranate.pendingRegions).toEqual(['WEST_INDIA']);
  });

  it('a bearing tree in Punjab in May gets its reminders, the bagging step on the page', () => {
    const { reminders, thisMonth } = treeCareDue(pomegranate, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2020-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-05-10T06:00:00+05:30'),
    });
    expect(reminders.map((r) => r.key).sort()).toEqual([
      'black_spot_rains',
      'summer_water',
    ]);
    expect(thisMonth.map((l) => l.title)).toContain(
      'Bag young fruits against the anar butterfly',
    );
  });
});
