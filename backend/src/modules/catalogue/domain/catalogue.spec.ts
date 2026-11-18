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

describe('Catalogue: fruit types, fruit entries and perennial flowers', () => {
  const retire = <K extends 'fruitTypes' | 'perennialFlowers'>(
    list: K,
    key: string,
    status: 'RETIRED' | 'DRAFT',
  ): CatalogueSeed => ({
    ...CATALOGUE_SEED,
    [list]: CATALOGUE_SEED[list].map((r) =>
      ('key' in r ? r.key : r.family) === key ? { ...r, status } : r,
    ),
    // A served entry may not sit on a draft type, so drafts take their entries along.
    fruitPlants:
      list === 'fruitTypes' && status === 'DRAFT'
        ? CATALOGUE_SEED.fruitPlants.filter((p) => p.species_family !== key)
        : CATALOGUE_SEED.fruitPlants,
  });

  it('a retired fruit type keeps matching and its life profile, but leaves search', () => {
    const catalogue = Catalogue.from(
      validateSeed(retire('fruitTypes', 'mango', 'RETIRED')),
      1,
    );
    expect(catalogue.fruitType('mango')?.key).toBe('mango');
    expect(catalogue.lifeProfile('mango')).not.toBeNull();
    expect(catalogue.fruitFamilyIn('my mango tree')).toEqual({
      family: 'mango',
      alias: 'mango',
    });
    expect(
      catalogue.searchEntries().filter((e) => e.species_family === 'mango'),
    ).toEqual([]);
    expect(
      catalogue.searchEntries().some((e) => e.species_family === 'guava'),
    ).toBe(true);
  });

  it('a draft perennial flower is found by nothing', () => {
    const catalogue = Catalogue.from(
      validateSeed(retire('perennialFlowers', 'jasmine', 'DRAFT')),
      1,
    );
    expect(catalogue.perennialFlower('jasmine')).toBeNull();
    expect(catalogue.flowerFamilyIn('mogra')).toBeNull();
    expect(catalogue.lifeProfile('jasmine')).toBeNull();
    expect(catalogue.searchEntries().map((e) => e.key)).not.toContain(
      'jasmine',
    );
  });

  it('matches the longest flower alias first, whatever the seed order', () => {
    const roseFirst = {
      ...CATALOGUE_SEED,
      perennialFlowers: [...CATALOGUE_SEED.perennialFlowers].sort((a) =>
        a.family === 'rose' ? -1 : 1,
      ),
    };
    const catalogue = Catalogue.from(validateSeed(roseFirst), 1);
    expect(catalogue.flowerFamilyIn('My China Rose')).toBe('hibiscus');
    expect(catalogue.flowerFamilyIn('desert rose')).toBe('adenium');
    expect(catalogue.flowerFamilyIn('red rose')).toBe('rose');
  });

  it('finds a Hindi flower name typed in either Unicode form', () => {
    const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
    // ड़ as one code point (U+095C) or as ड + nukta (U+0921 U+093C).
    expect(catalogue.flowerFamilyIn('गु\u095Cहल')).toBe('hibiscus');
    expect(catalogue.flowerFamilyIn('गु\u0921\u093Cहल')).toBe('hibiscus');
  });

  it("gives a flower's life profile from its bloom and lifespan, with its note", () => {
    const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
    const periwinkle = catalogue.perennialFlower('periwinkle')!;
    expect(catalogue.lifeProfile('periwinkle')).toEqual({
      first_fruit_months: periwinkle.first_bloom_months,
      productive_until_months: periwinkle.lifespan_months,
      lifespan_months: periwinkle.lifespan_months,
      note_key: 'periwinkle',
    });
    expect(catalogue.lifeProfile('lotus')).toBeNull();
    expect(catalogue.lifeProfile(null)).toBeNull();
  });

  it('lists flowers in search the way the boot fill did', () => {
    const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
    const rose = catalogue.searchEntries().find((e) => e.key === 'rose');
    expect(rose).toEqual({
      key: 'rose',
      species_family: 'rose',
      species: 'rose',
      variety: null,
      display_name: 'Rose',
      plant_type: 'perennial_flower',
      aliases: ['rose', 'gulab'],
      languages: { hi: ['गुलाब'] },
      regions: [],
      confidence_weight: 0.85,
      hi: { display_name: 'गुलाब' },
    });
    const weights = catalogue.searchEntries().map((e) => e.confidence_weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });
});

describe('Catalogue: tree care', () => {
  const mango = CATALOGUE_SEED.treeCare.find((c) => c.family === 'mango')!;
  const withMango = (status: 'APPROVED' | 'RETIRED' | 'DRAFT') =>
    Catalogue.from(
      validateSeed({
        ...CATALOGUE_SEED,
        treeCare: CATALOGUE_SEED.treeCare.map((c) =>
          c.family === 'mango' ? { ...c, status } : c,
        ),
      }),
      1,
    );

  it('treeCare serves approved care, without its seed status and notes', () => {
    const { status: _s, notes: _n, ...care } = mango;
    expect(withMango('APPROVED').treeCare('mango')).toEqual(care);
  });

  it('treeCare is null for a retired or draft record and an unknown family', () => {
    expect(withMango('RETIRED').treeCare('mango')).toBeNull();
    expect(withMango('DRAFT').treeCare('mango')).toBeNull();
    expect(withMango('APPROVED').treeCare('banana')).toBeNull();
    expect(withMango('APPROVED').treeCare(null)).toBeNull();
  });
});

describe('Catalogue.treeCareFor', () => {
  const mango = CATALOGUE_SEED.treeCare.find((c) => c.family === 'mango')!;
  const citrus = {
    ...mango,
    family: 'citrus',
    grownIn: [],
    regions: {},
    kinds: [
      {
        key: 'lime',
        label: 'Lime',
        words: ['kagzi'],
        grownIn: mango.grownIn,
        regions: mango.regions,
      },
    ],
  };
  const catalogue = Catalogue.from(
    validateSeed({
      ...CATALOGUE_SEED,
      treeCare: [...CATALOGUE_SEED.treeCare, citrus],
    }),
    1,
  );

  it("gives a citrus tree its kind's care", () => {
    expect(catalogue.treeCareFor('citrus', { variety: 'Kagzi' })?.family).toBe(
      'citrus:lime',
    );
  });

  it('gives a citrus tree of no known kind no care', () => {
    expect(catalogue.treeCareFor('citrus', { name: 'nimbu' })).toBeNull();
  });

  it('gives a family without kinds its own care', () => {
    expect(catalogue.treeCareFor('mango', { name: 'Aam' })?.family).toBe(
      'mango',
    );
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

  const withList = <K extends 'fruitPlants' | 'perennialFlowers'>(
    list: K,
    change: (items: CatalogueSeed[K]) => CatalogueSeed[K],
  ): unknown => ({ ...CATALOGUE_SEED, [list]: change(CATALOGUE_SEED[list]) });

  it('rejects a fruit plant naming a missing fruit type', () => {
    expect(
      reason(
        withList('fruitPlants', (items) => [
          ...items,
          {
            ...items[0],
            key: 'durian',
            species_family: 'durian',
            species: 'durian',
          },
        ]),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it("rejects a fruit plant whose key doesn't match its variety", () => {
    expect(
      reason(
        withList('fruitPlants', (items) =>
          items.map((p) =>
            p.key === 'mango:malda' ? { ...p, variety: 'langra' } : p,
          ),
        ),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects two perennial flowers sharing an alias', () => {
    expect(
      reason(
        withList('perennialFlowers', (items) =>
          items.map((f) =>
            f.family === 'hibiscus'
              ? { ...f, aliases: [...f.aliases, 'rose'] }
              : f,
          ),
        ),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects a care month of 13', () => {
    expect(
      reason(
        withList('perennialFlowers', (items) =>
          items.map((f) =>
            f.family === 'rose'
              ? {
                  ...f,
                  care: {
                    ...f.care,
                    PLAINS: [{ ...f.care.PLAINS[0], month: 13 }],
                  },
                }
              : f,
          ),
        ),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  const withTypes = (
    change: (items: CatalogueSeed['fruitTypes']) => CatalogueSeed['fruitTypes'],
  ): unknown => ({
    ...CATALOGUE_SEED,
    fruitTypes: change(CATALOGUE_SEED.fruitTypes),
  });

  it.each(['Sindhuri', 'jack-fruit', 'star  fruit', ' mango'])(
    'rejects a fruit word the matcher could never find: %j',
    (alias) => {
      expect(
        reason(
          withTypes((items) =>
            items.map((t) =>
              t.key === 'mango'
                ? { ...t, match_aliases: [...t.match_aliases, alias] }
                : t,
            ),
          ),
        ),
      ).toBe('CATALOGUE_INVALID');
    },
  );

  it.each(['Rose', 'desert-rose', 'red  rose'])(
    'rejects a flower alias the matcher could never find: %j',
    (alias) => {
      expect(
        reason(
          withList('perennialFlowers', (items) =>
            items.map((f) =>
              f.family === 'rose'
                ? { ...f, aliases: [...f.aliases, alias] }
                : f,
            ),
          ),
        ),
      ).toBe('CATALOGUE_INVALID');
    },
  );

  it('rejects one fruit word on two fruit types', () => {
    expect(
      reason(
        withTypes((items) =>
          items.map((t) =>
            t.key === 'guava'
              ? { ...t, match_aliases: [...t.match_aliases, 'langra'] }
              : t,
          ),
        ),
      ),
    ).toBe('CATALOGUE_INVALID');
  });

  it('rejects a perennial flower that reuses a fruit type key', () => {
    expect(
      reason(
        withList('perennialFlowers', (items) =>
          items.map((f) =>
            f.family === 'rose' ? { ...f, family: 'mango' } : f,
          ),
        ),
      ),
    ).toBe('CATALOGUE_INVALID');
  });
});
