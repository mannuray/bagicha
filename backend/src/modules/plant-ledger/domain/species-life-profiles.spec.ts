import { LIFE_PROFILE_FAMILIES, lifeProfileFor } from './species-life-profiles';

describe('lifeProfileFor', () => {
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

  it('covers the 26 fruit families and the ten perennial flowers', () => {
    expect([...LIFE_PROFILE_FAMILIES].sort()).toEqual([
      'adenium',
      'amla',
      'bael',
      'banana',
      'ber',
      'bougainvillea',
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
      'kokum',
      'litchi',
      'mango',
      'moringa',
      'mulberry',
      'oleander',
      'papaya',
      'parijat',
      'periwinkle',
      'phalsa',
      'plumeria',
      'pomegranate',
      'rose',
      'sapota',
      'star_fruit',
      'tamarind',
      'wood_apple',
    ]);
  });
});
