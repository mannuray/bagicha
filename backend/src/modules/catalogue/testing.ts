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
