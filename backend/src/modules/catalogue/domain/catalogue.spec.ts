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
    expect(catalogue.listedCrop('carrot')).toBeNull();
    expect(catalogue.listedCrop('tomato')?.name).toBe('Tomato');
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
    expect(reason(withCrop(() => ({ method: 'NO_SUCH_METHOD' })))).toBe(
      'CATALOGUE_INVALID',
    );
  });

  it('rejects a crop whose care step is missing', () => {
    expect(
      reason(
        withCrop(() => ({
          care: [{ key: 'no_such_step', after: 'SOWING', days: 9 }],
        })),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects a listed crop whose method is a draft (the API could not load it)', () => {
    expect(
      reason({
        ...CATALOGUE_SEED,
        methods: CATALOGUE_SEED.methods.map((m) =>
          m.key === 'CLOVE' ? { ...m, status: 'DRAFT' } : m,
        ),
      }),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects a listed crop whose care step is a draft', () => {
    expect(
      reason({
        ...CATALOGUE_SEED,
        careSteps: CATALOGUE_SEED.careSteps.map((s) =>
          s.key === 'stake' ? { ...s, status: 'DRAFT' } : s,
        ),
      }),
    ).toBe('CATALOGUE_INVALID');
  });

  it('a draft crop may use a draft method', () => {
    expect(
      reason({
        ...CATALOGUE_SEED,
        crops: CATALOGUE_SEED.crops.map((c) =>
          c.id === 'garlic' ? { ...c, status: 'DRAFT' } : c,
        ),
        methods: CATALOGUE_SEED.methods.map((m) =>
          m.key === 'CLOVE' ? { ...m, status: 'DRAFT' } : m,
        ),
      }),
    ).toBe('valid');
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
