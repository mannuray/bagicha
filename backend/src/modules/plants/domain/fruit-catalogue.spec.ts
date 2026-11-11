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
  // Phase 2: common home fruit trees
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
];

describe('the fruit catalogue', () => {
  it('has a plain entry for each fruit family, plus their popular varieties', () => {
    for (const family of FAMILIES) {
      expect(
        FRUIT_CATALOGUE.some((e) => e.species_family === family && !e.variety),
      ).toBe(true);
    }
    expect(FRUIT_CATALOGUE.length).toBeGreaterThanOrEqual(95);
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

  it('names every variety the same way: "Mango (Malda)"', () => {
    for (const e of FRUIT_CATALOGUE.filter((x) => x.variety))
      expect(e.display_name).toMatch(/^[A-Z][\w ]+ \(.+\)$/);
  });
});
