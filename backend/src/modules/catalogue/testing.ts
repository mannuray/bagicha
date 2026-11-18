import type { CatalogueStore } from './catalogue.store';
import { Catalogue } from './domain/catalogue';
import { validateSeed } from './domain/schemas';
import type { TreeCareSeed } from './domain/tree-care';
import type { CatalogueSeed } from './domain/types';
import { CATALOGUE_SEED } from './seed';

/** Test helper: the repo's seed (or a given one) as a loaded catalogue. */
export function seededCatalogue(
  seed: CatalogueSeed = CATALOGUE_SEED,
): Catalogue {
  return Catalogue.from(validateSeed(seed), 1);
}

/** Test helper: a store serving the repo's seed (or a given one), no database. */
export function seededCatalogueStore(
  seed: CatalogueSeed = CATALOGUE_SEED,
): CatalogueStore {
  const catalogue = seededCatalogue(seed);
  return {
    snapshot: () => Promise.resolve(catalogue),
  } as unknown as CatalogueStore;
}

/** The repo seed with a few Hindi texts, as Task 7 will add them. */
export const hindiSeed = (): CatalogueSeed => ({
  ...CATALOGUE_SEED,
  crops: CATALOGUE_SEED.crops.map((c) =>
    c.id === 'tomato' ? { ...c, hi: { name: 'टमाटर' } } : c,
  ),
  methods: CATALOGUE_SEED.methods.map((m) =>
    m.key === 'NURSERY_TRANSPLANT'
      ? { ...m, hi: { label: 'नर्सरी, फिर रोपाई' } }
      : m,
  ),
  fruitPlants: CATALOGUE_SEED.fruitPlants.map((p) =>
    p.key === 'mango:Dasheri'
      ? { ...p, hi: { display_name: 'आम (दशहरी)' } }
      : p,
  ),
  perennialFlowers: CATALOGUE_SEED.perennialFlowers.map((f) =>
    f.family === 'rose' ? { ...f, hi: { name: 'गुलाब' } } : f,
  ),
});

/** Test helper: a small valid care record (one region, one feed, one phase). */
export const treeCareFixture = (
  over: Partial<TreeCareSeed> = {},
): TreeCareSeed => ({
  family: 'mango',
  sources: ['https://example.org/care'],
  grownIn: ['EAST_INDIA'],
  regions: {
    EAST_INDIA: {
      items: [
        {
          key: 'feed',
          title: 'Feed the tree',
          category: 'FEEDING',
          stages: ['BEARING'],
          when: { kind: 'CALENDAR', from: [2, 1], to: [2, 28] },
          organic: '5 kg compost',
          why: 'Fruit set needs food',
        },
      ],
      phases: [
        {
          when: { kind: 'CALENDAR', from: [2, 1], to: [3, 31] },
          stages: ['BEARING'],
          phase: 'flowering',
          avoid: ['heavy watering'],
          watch: ['hoppers'],
        },
      ],
    },
  },
  status: 'APPROVED',
  notes: null,
  ...over,
});
