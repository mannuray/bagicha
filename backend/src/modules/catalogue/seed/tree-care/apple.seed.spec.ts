import { LifecycleStage } from '@prisma/client';
import { treeCareDue } from '../../../plant-ledger/domain/care/engine';
import type { RegionCare, TreeCareItem } from '../../domain/tree-care';
import { treeCareSeedSchema } from '../../domain/tree-care.schema';
import { APPLE_CARE } from './apple.seed';

const hills = APPLE_CARE.regions.HILLS_COOL as RegionCare;
const item = (key: string): TreeCareItem =>
  hills.items.find((i) => i.key === key)!;

/** Spot checks copied from the owner-approved table (docs/plant-care/apple.md, 2026-11-23). */
describe('apple care (owner-approved 2026-11-23)', () => {
  it('winter feed Dec–Jan: 10 kg FYM + 219 g SSP + 117 g MOP × age, to 10 years (NIPHM, Q3)', () => {
    expect(item('feed_winter')).toMatchObject({
      title: 'Spread manure, phosphate and potash in winter',
      stages: ['YOUNG', 'BEARING'],
      when: { kind: 'CALENDAR', from: [12, 1], to: [1, 31] },
      dose: {
        organic: [{ what: 'FYM', grams: 10000 }],
        chemical: [
          { what: 'SSP', grams: 219 },
          { what: 'MOP', grams: 117 },
        ],
        maxAgeYears: 10,
        together: true,
      },
    });
  });

  it('nitrogen in two halves of 76 g urea × age: Feb–Mar and May 15–Jun 15', () => {
    const half = { chemical: [{ what: 'urea', grams: 76 }], maxAgeYears: 10 };
    expect(item('nitrogen_spring')).toMatchObject({
      title: "Give half the year's nitrogen before buds open",
      when: { kind: 'CALENDAR', from: [2, 1], to: [3, 31] },
      dose: half,
    });
    expect(item('nitrogen_fruitset')).toMatchObject({
      title: 'Give the other half of the nitrogen after fruit set',
      when: { kind: 'CALENDAR', from: [5, 15], to: [6, 15] },
      dose: half,
    });
  });

  it('harvest Aug–Oct for bearing trees; autumn urea and leaves Oct–Nov', () => {
    expect(item('harvest')).toMatchObject({
      title: 'Pick apples when the seeds turn brown',
      stages: ['BEARING'],
      when: { kind: 'CALENDAR', from: [8, 1], to: [10, 31] },
    });
    expect(item('leaves_autumn')).toMatchObject({
      title: 'Spray urea on old leaves, then rake them up',
      when: { kind: 'CALENDAR', from: [10, 1], to: [11, 30] },
    });
  });

  it('plains regions pending; lime sulphur before bloom only; no Chaubattia, phosmet or Bordeaux spray', () => {
    expect(APPLE_CARE.pendingRegions).toEqual([
      'NORTH_INDIA',
      'EAST_INDIA',
      'CENTRAL_INDIA',
      'WEST_INDIA',
      'SOUTH_DECCAN',
    ]);
    expect(Object.keys(APPLE_CARE.regions)).toEqual(['HILLS_COOL']);
    const text = JSON.stringify(APPLE_CARE);
    expect(text).not.toMatch(/chaubattia|red lead|phosmet|1% bordeaux/i);
    expect(text).not.toMatch(/post.blossom|cyanamide|dormex|paclobutrazol/i);
    expect(item('san_jose_scale').chemical).toMatch(
      /20 ml per litre.*before flowers open/,
    );
  });

  it('passes the seed schema', () => {
    expect(
      treeCareSeedSchema.safeParse({
        ...APPLE_CARE,
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('a bearing tree in the hills in late May gets three reminders, scab on the page', () => {
    const { reminders, thisMonth } = treeCareDue(APPLE_CARE, {
      region: 'HILLS_COOL',
      stage: LifecycleStage.MATURE_BEARING,
      plantedAt: new Date('2018-01-01T00:00:00Z'),
      plantingPrecision: 'YEAR',
      now: new Date('2026-05-25T06:00:00+05:30'),
    });
    expect(reminders.map((r) => r.key).sort()).toEqual([
      'nitrogen_fruitset',
      'summer_water',
      'thin_fruit',
    ]);
    expect(reminders.find((r) => r.key === 'nitrogen_fruitset')?.amount).toBe(
      'For an 8-year-old tree: 608 g urea',
    );
    expect(thisMonth.map((l) => l.title)).toContain(
      'Treat scab spots on leaves and fruit',
    );
  });
});
