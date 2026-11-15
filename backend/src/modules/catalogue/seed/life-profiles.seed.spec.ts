import { seededCatalogue } from '../testing';
import { CATALOGUE_SEED } from '.';

const catalogue = seededCatalogue();
const lifeProfileFor = (family: string | null) => catalogue.lifeProfile(family);
const LIFE_PROFILE_FAMILIES = [
  ...CATALOGUE_SEED.fruitTypes.map((t) => t.key),
  ...CATALOGUE_SEED.perennialFlowers.map((f) => f.family),
];

describe('life profiles in the seed', () => {
  it('stores short-lived species in months', () => {
    expect(lifeProfileFor('papaya')).toMatchObject({
      first_fruit_months: [8, 12],
      productive_until_months: [24, 36],
      note_key: 'papaya',
    });
    expect(lifeProfileFor('banana')?.first_fruit_months).toEqual([9, 15]);
    expect(lifeProfileFor('moringa')?.first_fruit_months).toEqual([6, 8]);
  });

  it('converts long-lived species from years', () => {
    expect(lifeProfileFor('mango')).toMatchObject({
      first_fruit_months: [36, 60],
      productive_until_months: [480, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    });
  });

  it('has no profile for an unknown family', () => {
    expect(lifeProfileFor('lotus')).toBeNull();
    expect(lifeProfileFor('generic_perennial')).toBeNull();
    expect(lifeProfileFor(null)).toBeNull();
  });

  it('covers every fruit family in the catalogue', () => {
    for (const family of [
      'jamun',
      'ber',
      'bael',
      'fig',
      'mulberry',
      'star_fruit',
      'karonda',
      'phalsa',
      'wood_apple',
      'tamarind',
      'kokum',
      'dragon_fruit',
    ]) {
      expect(lifeProfileFor(family)).not.toBeNull();
    }
    expect(
      lifeProfileFor('dragon_fruit')?.first_fruit_months[0],
    ).toBeLessThanOrEqual(18);
  });

  it('covers the 36 fruit families and the ten perennial flowers', () => {
    expect([...LIFE_PROFILE_FAMILIES].sort()).toEqual([
      'adenium',
      'almond',
      'amla',
      'apple',
      'apricot',
      'bael',
      'banana',
      'ber',
      'bougainvillea',
      'cherry',
      'citrus',
      'coconut',
      'custard_apple',
      'dragon_fruit',
      'fig',
      'grape',
      'guava',
      'hibiscus',
      'ixora',
      'jackfruit',
      'jamun',
      'jasmine',
      'karonda',
      'kiwi',
      'kokum',
      'litchi',
      'mango',
      'moringa',
      'mulberry',
      'oleander',
      'papaya',
      'parijat',
      'peach',
      'pear',
      'periwinkle',
      'persimmon',
      'phalsa',
      'plum',
      'plumeria',
      'pomegranate',
      'rose',
      'sapota',
      'star_fruit',
      'tamarind',
      'walnut',
      'wood_apple',
    ]);
  });

  // Approved in the phase 3 review (2026-11-15), in years × 12.
  it.each([
    ['apple', [36, 96], [360, 480], [480, 600]],
    ['peach', [24, 36], [120, 180], [180, 240]],
    ['walnut', [48, 72], [600, 900], [900, 1200]],
    ['kiwi', [24, 60], [360, 480], [480, 600]],
    ['persimmon', [48, 72], [300, 480], [360, 600]],
  ])(
    'pins the approved %s life profile',
    (family, first, productive, lifespan) => {
      expect(lifeProfileFor(family)).toEqual({
        first_fruit_months: first,
        productive_until_months: productive,
        lifespan_months: lifespan,
        note_key: null,
      });
    },
  );
});
