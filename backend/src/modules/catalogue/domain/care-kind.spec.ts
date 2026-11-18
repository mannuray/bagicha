import { treeCareFixture } from '../testing';
import { careForTree } from './care-kind';
import type { CareKind, FamilyCare } from './tree-care';

const regionCare = treeCareFixture().regions;
const kind = (key: string, words: string[]): CareKind => ({
  key,
  label: key,
  words,
  grownIn: ['EAST_INDIA'],
  regions: regionCare,
});

/** A citrus family whose care is all in its kinds. */
const CITRUS: FamilyCare = {
  family: 'citrus',
  sources: ['https://example.org/citrus'],
  grownIn: [],
  regions: {},
  kinds: [
    kind('lime', ['kagzi', 'कागज़ी']),
    kind('lemon', ['lemon', 'galgal']),
    kind('mandarin', ['kinnow', 'nagpur']),
  ],
};
const keyOf = (tree: Parameters<typeof careForTree>[1]) =>
  careForTree(CITRUS, tree)?.family ?? null;

describe('careForTree', () => {
  it('variety beats species', () => {
    expect(keyOf({ species: 'Lemon', variety: 'Kagzi' })).toBe('citrus:lime');
  });

  it('reads a kind word in Hindi script', () => {
    expect(keyOf({ name: 'कागज़ी नींबू' })).toBe('citrus:lime');
  });

  it('takes the earliest word within a field', () => {
    expect(keyOf({ species: 'kinnow lemon' })).toBe('citrus:mandarin');
    expect(keyOf({ species: 'lemon kinnow' })).toBe('citrus:lemon');
  });

  it('gives no kind for ambiguous words only', () => {
    expect(keyOf({ name: 'my nimbu plant', species: 'Citrus' })).toBeNull();
    expect(keyOf({})).toBeNull();
  });

  it('a place word counts in the variety or species, never in the name', () => {
    const withPlace: FamilyCare = {
      ...CITRUS,
      kinds: [
        { ...kind('mandarin', ['kinnow']), varietyWords: ['nagpur'] },
        kind('lime', ['kagzi']),
      ],
    };
    const keyIn = (tree: Parameters<typeof careForTree>[1]) =>
      careForTree(withPlace, tree)?.family ?? null;
    expect(keyIn({ variety: 'Nagpur' })).toBe('citrus:mandarin');
    expect(keyIn({ species: 'nagpur santra' })).toBe('citrus:mandarin');
    expect(keyIn({ name: 'Nimbu from Nagpur' })).toBeNull();
  });

  it('matches whole words only', () => {
    expect(keyOf({ name: 'lemongrass' })).toBeNull();
  });

  it('returns care without kinds unchanged', () => {
    const mango = treeCareFixture();
    expect(careForTree(mango, { species: 'Mango' })).toBe(mango);
  });

  it("gives the kind's own care under the kind's family key", () => {
    expect(careForTree(CITRUS, { variety: 'Kagzi' })).toEqual({
      family: 'citrus:lime',
      sources: CITRUS.sources,
      grownIn: ['EAST_INDIA'],
      regions: regionCare,
    });
  });
});
