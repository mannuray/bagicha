import { parseCareKey } from './source-key';

describe('parseCareKey', () => {
  it('reads a planting-timed key', () => {
    expect(parseCareKey('papaya:feed_1:d90')).toEqual({
      family: 'papaya',
      key: 'feed_1',
      start: { days: 90 },
    });
  });

  it('reads a citrus kind and a calendar date', () => {
    expect(parseCareKey('citrus:lime:canker_spray:2026-10-01')).toEqual({
      family: 'citrus:lime',
      key: 'canker_spray',
      start: { month: 10, day: 1 },
    });
  });

  it('refuses keys that are not tree care', () => {
    expect(parseCareKey('pack1:seasonal_primary_action')).toBeNull();
    expect(parseCareKey('lifecycle:p1:SAPLING:WATER')).toBeNull();
    expect(parseCareKey('')).toBeNull();
  });
});

describe('careItemForKey', () => {
  const { Catalogue, CATALOGUE_SEED } =
    jest.requireActual('../../../catalogue');
  const { careItemForKey } = jest.requireActual('./source-key');
  const catalogue = Catalogue.from(CATALOGUE_SEED, 1);

  it("finds a citrus kind's item in the gardener's region", () => {
    const lime = CATALOGUE_SEED.treeCare
      .find((c: { family: string }) => c.family === 'citrus')
      .kinds.find((k: { key: string }) => k.key === 'lime');
    const item = lime.regions.SOUTH_DECCAN.items[0];
    const [m, d] = item.when.from;
    const key = `citrus:lime:${item.key}:2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    expect(careItemForKey(catalogue, key, 'SOUTH_DECCAN')?.key).toBe(item.key);
  });

  it('gives nothing, never an error, for a kinds family without a kind', () => {
    expect(
      careItemForKey(catalogue, 'citrus:feed:d90', 'NORTH_INDIA'),
    ).toBeNull();
  });

  it('matches a calendar start exactly, except Feb 29 shown as Feb 28', () => {
    const fam = {
      family: 'fixture',
      sources: ['t'],
      grownIn: ['NORTH_INDIA'],
      regions: {
        NORTH_INDIA: {
          items: [
            {
              key: 'feed',
              title: 'Feed A',
              category: 'FEEDING',
              stages: ['BEARING'],
              when: { kind: 'CALENDAR', from: [3, 1], to: [3, 9] },
              organic: 'a',
              why: 'a',
            },
            {
              key: 'feed',
              title: 'Feed B',
              category: 'FEEDING',
              stages: ['BEARING'],
              when: { kind: 'CALENDAR', from: [3, 2], to: [3, 9] },
              organic: 'b',
              why: 'b',
            },
            {
              key: 'leap',
              title: 'Leap',
              category: 'FEEDING',
              stages: ['BEARING'],
              when: { kind: 'CALENDAR', from: [2, 29], to: [3, 9] },
              organic: 'c',
              why: 'c',
            },
          ],
          phases: [],
        },
      },
    };
    const stub = { treeCare: (f: string) => (f === 'fixture' ? fam : null) };
    expect(
      careItemForKey(stub, 'fixture:feed:2026-03-02', 'NORTH_INDIA')?.title,
    ).toBe('Feed B');
    expect(
      careItemForKey(stub, 'fixture:leap:2026-02-28', 'NORTH_INDIA')?.title,
    ).toBe('Leap');
  });
});
