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

  it('covers the fourteen fruit families and the ten perennial flowers', () => {
    expect([...LIFE_PROFILE_FAMILIES].sort()).toEqual([
      'adenium',
      'amla',
      'banana',
      'bougainvillea',
      'citrus',
      'coconut',
      'custard_apple',
      'grape',
      'guava',
      'hibiscus',
      'ixora',
      'jackfruit',
      'jasmine',
      'litchi',
      'mango',
      'moringa',
      'oleander',
      'papaya',
      'parijat',
      'periwinkle',
      'plumeria',
      'pomegranate',
      'rose',
      'sapota',
    ]);
  });
});
