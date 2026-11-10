import { SpeciesNormalizationService } from './species-normalization.service';

const family = (species: string) =>
  new SpeciesNormalizationService().resolveSpeciesFamily({ species });

describe('resolveSpeciesFamily for the new fruit families', () => {
  it.each([
    ['Drumstick', 'moringa'],
    ['Sitaphal', 'custard_apple'],
    ['Chikoo', 'sapota'],
    ['Papita', 'papaya'],
    ['Angoor', 'grape'],
    ['Kathal', 'jackfruit'],
    ['Nariyal', 'coconut'],
    ['Aonla', 'amla'],
  ])('%s → %s', (species, expected) => {
    expect(family(species)).toBe(expected);
  });

  it('still falls back for unknown plants', () => {
    expect(family('Rose')).toBe('generic_perennial');
  });
});
