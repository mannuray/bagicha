import { TREE_CARE } from '../plant-ledger';

/** The tree-care families in use; a token so tests can supply a fixture family. */
export const TREE_CARE_REGISTRY = Symbol('TREE_CARE_REGISTRY');
export const treeCareRegistryProvider = {
  provide: TREE_CARE_REGISTRY,
  useValue: TREE_CARE,
};
