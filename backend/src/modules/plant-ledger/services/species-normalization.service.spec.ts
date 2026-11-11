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

describe('flowers', () => {
  const svc = new SpeciesNormalizationService();
  const flower = (species: string) =>
    svc.resolveSpeciesFamily({ species, record_kind: 'FLOWER' });

  it('files roses and Indian flower names by their flower family, never litchi', () => {
    expect(flower('Rose')).toBe('rose');
    expect(flower('Gulab')).toBe('rose');
    expect(flower('China rose')).toBe('hibiscus');
    expect(flower('Desert rose')).toBe('adenium');
    expect(flower('Mogra')).toBe('jasmine');
    expect(flower('Lotus')).toBe('generic_flower');
  });

  it('still files a rose-scented litchi tree as litchi', () => {
    expect(
      svc.resolveSpeciesFamily({ species: 'Litchi', variety: 'Rose scented' }),
    ).toBe('litchi');
    expect(svc.resolveSpeciesFamily({ species: 'Rose' })).toBe(
      'generic_perennial',
    );
  });
});

describe('variety names typed as the species', () => {
  it.each([
    ['Hapus', 'mango'],
    ['Banganapalli', 'mango'],
    ['Kagzi', 'citrus'],
    ['Gondhoraj', 'citrus'],
    ['Santra', 'citrus'],
    ['Chakotra', 'citrus'],
    ['Malbhog', 'banana'],
    ['Nendran', 'banana'],
    ['Bhagwa', 'pomegranate'],
    ['Kalipatti', 'sapota'],
  ])('%s → %s', (species, expected) => {
    expect(family(species)).toBe(expected);
  });
});
