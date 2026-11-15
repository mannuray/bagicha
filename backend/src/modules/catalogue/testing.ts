import type { CatalogueStore } from './catalogue.store';
import { Catalogue } from './domain/catalogue';
import { validateSeed } from './domain/schemas';
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
