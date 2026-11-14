import { CATALOGUE_SEED } from '../seed';
import { Catalogue } from './catalogue';
import { validateSeed } from './schemas';
import type { CatalogueSeed } from './types';

const withCrop = (
  change: (crop: CatalogueSeed['crops'][number]) => object,
): unknown => ({
  ...CATALOGUE_SEED,
  crops: CATALOGUE_SEED.crops.map((c) =>
    c.id === 'carrot' ? { ...c, ...change(c) } : c,
  ),
});

describe('Catalogue', () => {
  it('a retired crop is found by id but not listed', () => {
    const catalogue = Catalogue.from(
      validateSeed(withCrop(() => ({ status: 'RETIRED' }))),
      1,
    );
    expect(catalogue.crop('carrot')?.name).toBe('Carrot');
    expect(catalogue.listedCrops().map((c) => c.id)).not.toContain('carrot');
  });

  it('a draft crop is found by nothing', () => {
    const catalogue = Catalogue.from(
      validateSeed(withCrop(() => ({ status: 'DRAFT' }))),
      1,
    );
    expect(catalogue.crop('carrot')).toBeNull();
    expect(catalogue.listedCrops().map((c) => c.id)).not.toContain('carrot');
  });

  it('adds the quick tag to fast vegetables only', () => {
    const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
    expect(catalogue.crop('methi')?.tags).toContain('quick');
    expect(catalogue.crop('tomato')?.tags).not.toContain('quick');
  });

  it('an unknown method key is a programmer error', () => {
    const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
    expect(() => catalogue.method('NOPE')).toThrow();
  });
});

describe('validateSeed', () => {
  const reason = (seed: unknown) => {
    try {
      validateSeed(seed);
      return 'valid';
    } catch (e) {
      return (e as { reason?: string }).reason;
    }
  };

  it('rejects a crop whose method is missing', () => {
    expect(reason(withCrop(() => ({ method: 'CORM' })))).toBe(
      'CATALOGUE_INVALID',
    );
  });

  it('rejects a crop whose care step is missing', () => {
    expect(
      reason(
        withCrop(() => ({ care: [{ key: 'lift', after: 'SOWING', days: 9 }] })),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects an unknown field', () => {
    expect(reason(withCrop(() => ({ colour: 'orange' })))).toBe(
      'CATALOGUE_INVALID',
    );
  });

  it('accepts the real seed', () => {
    expect(reason(CATALOGUE_SEED)).toBe('valid');
  });
});
