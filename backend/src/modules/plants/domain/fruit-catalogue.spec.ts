import { lifeProfileFor } from '../../plant-ledger/domain/species-life-profiles';
import { FRUIT_CATALOGUE } from './fruit-catalogue';

const FAMILIES = [
  'mango',
  'citrus',
  'guava',
  'litchi',
  'pomegranate',
  'banana',
  'papaya',
  'grape',
  'jackfruit',
  'coconut',
  'sapota',
  'amla',
  'custard_apple',
  'moringa',
];

describe('the fruit catalogue', () => {
  it('has a plain entry for each of the 14 fruit families, plus their popular varieties', () => {
    for (const family of FAMILIES) {
      expect(
        FRUIT_CATALOGUE.some((e) => e.species_family === family && !e.variety),
      ).toBe(true);
    }
    expect(FRUIT_CATALOGUE.length).toBeGreaterThanOrEqual(60);
  });

  it('uses only families that have a life profile, and never repeats a name', () => {
    const names = new Set<string>();
    for (const e of FRUIT_CATALOGUE) {
      expect(lifeProfileFor(e.species_family)).not.toBeNull();
      expect(names.has(e.display_name)).toBe(false);
      names.add(e.display_name);
      expect(e.plant_type).toBe('fruit_tree');
    }
  });

  it('gives every plain fruit a Hindi name', () => {
    for (const e of FRUIT_CATALOGUE.filter((x) => !x.variety)) {
      expect(e.languages?.hi?.some((n) => /[ऀ-ॿ]/.test(n))).toBe(true);
    }
  });
});
