import { CATALOGUE_SEED } from '../seed';
import { validateSeed } from './schemas';
import type { TreeCareItem, TreeCareSeed } from './tree-care';

const item = (over: Partial<TreeCareItem> = {}): TreeCareItem => ({
  key: 'feed',
  title: 'Feed the tree',
  category: 'FEEDING',
  stages: ['BEARING'],
  when: { kind: 'CALENDAR', from: [2, 1], to: [2, 28] },
  organic: '5 kg compost',
  why: 'Fruit set needs food',
  ...over,
});

const family = (over: Partial<TreeCareSeed> = {}): TreeCareSeed => ({
  family: 'mango',
  sources: ['https://example.org/mango'],
  grownIn: ['NORTH_INDIA'],
  regions: {
    NORTH_INDIA: {
      items: [item()],
      phases: [
        {
          when: { kind: 'CALENDAR', from: [2, 1], to: [3, 31] },
          stages: ['BEARING'],
          phase: 'flowering',
          avoid: ['heavy watering'],
          watch: ['hoppers'],
        },
      ],
    },
  },
  status: 'APPROVED',
  notes: null,
  ...over,
});

const check =
  (...treeCare: unknown[]) =>
  () =>
    validateSeed({ ...CATALOGUE_SEED, treeCare });

/** The seed's problems as one line each; empty when it is valid. */
const issuesOf = (...treeCare: unknown[]): string => {
  try {
    check(...treeCare)();
    return '';
  } catch (e) {
    const details = (e as { details?: { issues?: string[] } }).details;
    return (details?.issues ?? []).join('\n');
  }
};

const withItems = (...items: TreeCareItem[]) =>
  family({ regions: { NORTH_INDIA: { items, phases: [] } } });

describe('tree care records in the seed', () => {
  it('accepts a valid family', () => {
    expect(check(family())).not.toThrow();
  });

  it('rejects an unknown field', () => {
    expect(check({ ...family(), extra: 1 })).toThrow();
  });

  it('rejects month 13 and day 31 in April', () => {
    expect(
      check(
        withItems(
          item({ when: { kind: 'CALENDAR', from: [13, 1], to: [1, 5] } }),
        ),
      ),
    ).toThrow();
    expect(
      check(
        withItems(
          item({ when: { kind: 'CALENDAR', from: [4, 31], to: [5, 5] } }),
        ),
      ),
    ).toThrow();
  });

  it('rejects a title over 60 characters', () => {
    expect(check(withItems(item({ title: 'x'.repeat(61) })))).toThrow();
  });

  it('rejects zero grams and zero maxAgeYears in a dose', () => {
    const dose = (grams: number, maxAgeYears: number) =>
      withItems(
        item({
          dose: {
            organic: [{ what: 'FYM', grams }],
            chemical: [],
            maxAgeYears,
          },
        }),
      );
    expect(check(dose(0, 10))).toThrow();
    expect(check(dose(100, 0))).toThrow();
    expect(check(dose(100, 10))).not.toThrow();
  });

  it('rejects a sameAs chain and a sameAs to a region with no care', () => {
    const base = family().regions.NORTH_INDIA!;
    expect(
      issuesOf(
        family({
          grownIn: ['NORTH_INDIA', 'EAST_INDIA', 'WEST_INDIA'],
          regions: {
            NORTH_INDIA: base,
            EAST_INDIA: { sameAs: 'NORTH_INDIA' },
            WEST_INDIA: { sameAs: 'EAST_INDIA' },
          },
        }),
      ),
    ).toMatch(/sameAs/);
    expect(
      issuesOf(
        family({
          grownIn: ['NORTH_INDIA', 'EAST_INDIA'],
          regions: { NORTH_INDIA: base, EAST_INDIA: { sameAs: 'HILLS_COOL' } },
        }),
      ),
    ).toMatch(/sameAs/);
  });

  it('rejects a grownIn region with neither care nor pendingRegions', () => {
    expect(
      issuesOf(family({ grownIn: ['NORTH_INDIA', 'HILLS_COOL'] })),
    ).toMatch(/HILLS_COOL/);
    expect(
      check(
        family({
          grownIn: ['NORTH_INDIA', 'HILLS_COOL'],
          pendingRegions: ['HILLS_COOL'],
        }),
      ),
    ).not.toThrow();
  });

  it('rejects the same item key with the same window start in one region', () => {
    expect(issuesOf(withItems(item(), item()))).toMatch(/feed/);
  });

  it('accepts the same key with different starts', () => {
    expect(
      check(
        withItems(
          item(),
          item({ when: { kind: 'CALENDAR', from: [9, 1], to: [9, 30] } }),
        ),
      ),
    ).not.toThrow();
  });

  it('rejects a care record whose family is not a fruit type in the seed', () => {
    expect(issuesOf(family({ family: 'not_a_fruit' }))).toMatch(/not_a_fruit/);
  });

  it('rejects two records for one family', () => {
    expect(issuesOf(family(), family())).toMatch(/mango/);
  });
});
