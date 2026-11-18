// Temporary: proves the move changed nothing; deleted with the old care code.
import { TREE_CARE } from '../../../plant-ledger/domain/care';
import { seededCatalogue } from '../../testing';
import { CATALOGUE_SEED } from '..';

const served = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown;

describe('tree care moved into the catalogue', () => {
  const catalogue = seededCatalogue();

  it('holds the same families as the old code', () => {
    expect(CATALOGUE_SEED.treeCare.map((c) => c.family).sort()).toEqual(
      Object.keys(TREE_CARE).sort(),
    );
  });

  it.each(Object.keys(TREE_CARE))('%s is word for word the same', (family) => {
    expect(served(catalogue.treeCare(family))).toEqual(
      served(TREE_CARE[family]),
    );
  });
});
