import { seededCatalogue } from '../testing';
import { CATALOGUE_SEED } from '.';

const catalogue = seededCatalogue();

describe('fruit type matching words in the seed', () => {
  // The first type in seed order wins, so a type added above another can
  // take over its words ("apple" above "custard apple").
  it('resolves every matching word to its own fruit type', () => {
    const stolen = CATALOGUE_SEED.fruitTypes.flatMap((t) =>
      t.match_aliases
        .filter((a) => catalogue.fruitFamilyIn(a)?.family !== t.key)
        .map((a) => `${a} → ${catalogue.fruitFamilyIn(a)?.family}`),
    );
    expect(stolen).toEqual([]);
  });

  it("resolves every fruit type's Hindi names to that type", () => {
    const stolen = CATALOGUE_SEED.fruitTypes.flatMap((t) => {
      const hi =
        CATALOGUE_SEED.fruitPlants.find((p) => p.key === t.key)?.languages
          ?.hi ?? [];
      return hi
        .filter((n) => catalogue.fruitFamilyIn(n)?.family !== t.key)
        .map((n) => `${n} → ${catalogue.fruitFamilyIn(n)?.family}`);
    });
    expect(stolen).toEqual([]);
  });

  it.each([
    ['custard apple', 'custard_apple'],
    ['wood apple', 'wood_apple'],
    ['apple ber', 'ber'],
    ['java plum', 'jamun'],
    ['black plum', 'jamun'],
    ['kath bel', 'wood_apple'],
    ['bel', 'bael'],
    ['my seb tree', 'apple'],
    ['gola pear', 'pear'],
    ['satluj purple', 'plum'],
    ['japani phal', 'persimmon'],
    // Common names, 2026-11-15 review
    ['amrood', 'guava'],
    ['jamrukh', 'guava'],
    ['nimbu', 'citrus'],
    ['malta', 'citrus'],
    ['aam ka ped', 'mango'],
    ['anaar', 'pomegranate'],
    ['shevga', 'moringa'],
    ['kaitha bel', 'wood_apple'],
    ['katbel', 'wood_apple'],
    ['bel ka ped', 'bael'],
    ['chikku', 'sapota'],
  ])('keeps "%s" as %s', (text, family) => {
    expect(catalogue.fruitFamilyIn(text)?.family).toBe(family);
  });
});

// Owner's call (phase 3 review, 2026-11-15): "badam" also means Indian
// almond, and words that are also people's names never mark a tree's type.
it.each([
  'badam',
  'desi badam',
  "kaki's neem",
  'stella',
  'allison',
  'bruno',
  'partap',
  'mishri',
  'shalimar',
  'waris',
  'william',
])('does not take "%s" as a fruit type', (text) => {
  expect(catalogue.fruitFamilyIn(text.replace(/[^a-z ]/g, ' '))).toBeNull();
});
