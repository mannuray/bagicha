import { CATALOGUE_SEED } from '../seed';
import { hindiSeed } from '../testing';
import { Catalogue } from './catalogue';
import { pick } from './pick';
import { validateSeed } from './schemas';

const withCrop = (hi: unknown): unknown => ({
  ...CATALOGUE_SEED,
  crops: CATALOGUE_SEED.crops.map((c) =>
    c.id === 'tomato' ? { ...c, hi } : c,
  ),
});

describe('Hindi texts in the catalogue', () => {
  it('accepts Hindi texts and rejects Latin, empty or unknown ones', () => {
    expect(() => validateSeed(hindiSeed())).not.toThrow();
    for (const bad of [{ name: 'Tamatar' }, { name: '' }, { title: 'टमाटर' }])
      expect(() => validateSeed(withCrop(bad))).toThrow(
        expect.objectContaining({ reason: 'CATALOGUE_INVALID' }),
      );
    const careTitle = {
      ...CATALOGUE_SEED,
      careSteps: CATALOGUE_SEED.careSteps.map((s, i) =>
        i === 0 ? { ...s, hi: { title: 'x {name}' } } : s,
      ),
    };
    expect(() => validateSeed(careTitle)).toThrow(
      expect.objectContaining({ reason: 'CATALOGUE_INVALID' }),
    );
  });

  it('names a plant in Hindi only while it keeps its catalogue name', () => {
    const c = Catalogue.from(validateSeed(hindiSeed()), 1);
    expect(
      c.hindiPlantName({
        name: 'Tomato',
        crop_id: 'tomato',
        species_family: null,
      }),
    ).toBe('टमाटर');
    expect(
      c.hindiPlantName({
        name: "Dadi's tomato",
        crop_id: 'tomato',
        species_family: null,
      }),
    ).toBeNull();
    expect(
      c.hindiPlantName({
        name: 'Mango (Dasheri)',
        crop_id: null,
        species_family: 'mango',
      }),
    ).toBe('आम (दशहरी)');
    expect(
      c.hindiPlantName({
        name: 'Mango (Dasheri)',
        crop_id: null,
        species_family: 'guava',
      }),
    ).toBeNull();
    expect(
      c.hindiPlantName({ name: 'Rose', crop_id: null, species_family: 'rose' }),
    ).toBe('गुलाब');
    expect(
      c.hindiPlantName({
        name: 'Brinjal (Baingan)',
        crop_id: 'brinjal',
        species_family: null,
      }),
    ).toBeNull();
  });

  it('picks Hindi only when asked and present', () => {
    expect(pick('a', undefined, 'hi')).toBe('a');
    expect(pick('a', 'ब', 'en')).toBe('a');
    expect(pick('a', 'ब', 'hi')).toBe('ब');
  });
});
