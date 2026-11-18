import { careForTree } from '../../domain/care-kind';
import { CATALOGUE_SEED } from '..';

const citrus = CATALOGUE_SEED.treeCare.find((c) => c.family === 'citrus')!;
const entries = CATALOGUE_SEED.fruitPlants.filter(
  (p) => p.species_family === 'citrus' && p.status === 'APPROVED',
);
/** The kind a tree added from this entry gets (its name defaults to the entry's). */
const kindOf = (key: string): string | null => {
  const e = entries.find((p) => p.key === key)!;
  const care = careForTree(citrus, {
    variety: e.variety,
    species: e.species,
    name: e.display_name,
  });
  return care ? care.family.replace('citrus:', '') : null;
};

describe('citrus care by kind (owner-approved 2026-11-18)', () => {
  it('every citrus add-tree entry gets the kind the review approved', () => {
    const approved: Record<string, string | null> = {
      citrus: null,
      'citrus:Kagzi': 'lime',
      'citrus:Baramasi': 'lemon',
      'citrus:Galgal': 'lemon',
      'citrus:Assam lemon': 'lemon',
      'citrus:Gondhoraj': null,
      'citrus:kinnow': 'mandarin',
      'citrus:Nagpur': 'mandarin',
      'citrus:Darjeeling': 'mandarin',
      'citrus:mosambi': 'sweet_orange',
      'citrus:Malta': 'sweet_orange',
      'citrus:Sathgudi': 'sweet_orange',
      'citrus:Chakotra': null,
    };
    expect(
      Object.fromEntries(entries.map((e) => [e.key, kindOf(e.key)])),
    ).toEqual(approved);
  });

  it('Seedless leaves search; trees already added from it keep the season pack', () => {
    const seedless = CATALOGUE_SEED.fruitPlants.find(
      (p) => p.key === 'citrus:Seedless',
    );
    expect(seedless?.status).toBe('RETIRED');
  });

  it('words that fit several kinds pick none', () => {
    for (const name of ['nimbu', 'Lemon', 'santra', 'orange', 'नींबू'])
      expect(careForTree(citrus, { name })).toBeNull();
  });

  it('sweet lime is sweet orange, plain lime is lime', () => {
    expect(careForTree(citrus, { name: 'sweet lime' })?.family).toBe(
      'citrus:sweet_orange',
    );
    expect(careForTree(citrus, { name: 'lime' })?.family).toBe('citrus:lime');
  });

  it('ships North India for every kind, and South Deccan for lime and sweet orange', () => {
    const ships = Object.fromEntries(
      (citrus.kinds ?? []).map((k) => [k.key, Object.keys(k.regions).sort()]),
    );
    expect(ships).toEqual({
      lime: ['NORTH_INDIA', 'SOUTH_DECCAN'],
      lemon: ['NORTH_INDIA'],
      mandarin: ['NORTH_INDIA'],
      sweet_orange: ['NORTH_INDIA', 'SOUTH_DECCAN'],
    });
  });
});
