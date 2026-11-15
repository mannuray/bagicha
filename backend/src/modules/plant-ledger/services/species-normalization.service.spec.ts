import { seededCatalogue, seededCatalogueStore } from '../../catalogue/testing';
import { SpeciesResolver } from '../domain/species-resolver';
import { SpeciesNormalizationService } from './species-normalization.service';

const species = new SpeciesResolver(seededCatalogue());
const family = (name: string) => species.family({ species: name });

describe('SpeciesNormalizationService', () => {
  it('hands out a resolver over the current catalogue', async () => {
    const resolver = await new SpeciesNormalizationService(
      seededCatalogueStore(),
    ).resolver();
    expect(
      resolver.family({ name: 'my desert rose', record_kind: 'FLOWER' }),
    ).toBe('adenium');
    expect(resolver.classificationBasis({ species: 'Dasheri' })).toBe(
      'normalized_alias:dasheri',
    );
    expect(resolver.classificationBasis({ species: 'Lotus' })).toBe(
      'species_text_fallback',
    );
  });
});

describe('the species beats a nickname', () => {
  it('reads the species and variety before the name', () => {
    // "Champa" is plumeria; the gardener said the plant is a rose.
    expect(
      species.family({
        name: "Champa's rose",
        species: 'Rose',
        record_kind: 'FLOWER',
      }),
    ).toBe('rose');
    expect(species.family({ name: 'Mango corner', species: 'Guava' })).toBe(
      'guava',
    );
    expect(
      species.classificationBasis({ name: 'Mango corner', species: 'Guava' }),
    ).toBe('normalized_alias:guava');
  });

  it('still uses the name when the species says nothing it knows', () => {
    expect(species.family({ name: 'Old mango', species: 'tree' })).toBe(
      'mango',
    );
    expect(
      species.family({
        name: 'Gulab',
        species: 'flower',
        record_kind: 'FLOWER',
      }),
    ).toBe('rose');
  });
});

describe('fruit trees named in Hindi script', () => {
  it.each([
    ['अमरूद', 'guava'],
    ['मेरा आम का पेड़', 'mango'],
    ['नींबू', 'citrus'],
    ['कटहल', 'jackfruit'],
    ['आड़ू', 'peach'],
  ])('%s → %s', (name, expected) => {
    expect(species.family({ name })).toBe(expected);
  });

  it('reads ड़ typed as one code point too', () => {
    expect(species.family({ name: 'आ\u095Cू' })).toBe('peach');
  });
});

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
  const flower = (name: string) =>
    species.family({ species: name, record_kind: 'FLOWER' });

  it('files roses and Indian flower names by their flower family, never litchi', () => {
    expect(flower('Rose')).toBe('rose');
    expect(flower('Gulab')).toBe('rose');
    expect(flower('China rose')).toBe('hibiscus');
    expect(flower('Desert rose')).toBe('adenium');
    expect(flower('Mogra')).toBe('jasmine');
    expect(flower('Lotus')).toBe('generic_flower');
  });

  it('still files a rose-scented litchi tree as litchi', () => {
    expect(species.family({ species: 'Litchi', variety: 'Rose scented' })).toBe(
      'litchi',
    );
    expect(species.family({ species: 'Rose' })).toBe('generic_perennial');
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

describe('common home fruit trees (catalogue phase 2)', () => {
  it.each([
    ['Jamun', 'jamun'],
    ['Ber', 'ber'],
    ['Apple ber', 'ber'],
    ['Bael', 'bael'],
    ['Fig', 'fig'],
    ['Anjeer', 'fig'],
    ['Mulberry', 'mulberry'],
    ['Shahtoot', 'mulberry'],
    ['Kamrakh', 'star_fruit'],
    ['Karonda', 'karonda'],
    ['Phalsa', 'phalsa'],
    ['Kaith', 'wood_apple'],
    ['Imli', 'tamarind'],
    ['Kokum', 'kokum'],
    ['Pitaya', 'dragon_fruit'],
  ])('%s → %s', (species, expected) => {
    expect(family(species)).toBe(expected);
  });

  it('matches whole words only: "ber" never hides inside mulberry or cucumber', () => {
    expect(family('Mulberry')).toBe('mulberry');
    expect(family('Cucumber')).toBe('generic_perennial');
    expect(family('Figment')).toBe('generic_perennial');
  });
});
