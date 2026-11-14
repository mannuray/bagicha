import type { CatalogueStore } from './catalogue.store';
import { Catalogue } from './domain/catalogue';
import { validateSeed } from './domain/schemas';
import type { CatalogueSeed } from './domain/types';
import { CATALOGUE_SEED } from './seed';

/** Test helper: a store serving the repo's seed (or a given one), no database. */
export function seededCatalogueStore(
  seed: CatalogueSeed = CATALOGUE_SEED,
): CatalogueStore {
  const catalogue = Catalogue.from(validateSeed(seed), 1);
  return {
    snapshot: () => Promise.resolve(catalogue),
  } as unknown as CatalogueStore;
}
