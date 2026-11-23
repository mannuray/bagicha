import type { FamilyCare, TreeCareSeed } from '../../domain/tree-care';
import { AMLA_CARE } from './amla.seed';
import { CITRUS_CARE } from './citrus.seed';
import { GUAVA_CARE } from './guava.seed';
import { JACKFRUIT_CARE } from './jackfruit.seed';
import { LITCHI_CARE } from './litchi.seed';
import { MANGO_CARE } from './mango.seed';
import { PAPAYA_CARE } from './papaya.seed';
import { SAPOTA_CARE } from './sapota.seed';

const approved = (care: FamilyCare): TreeCareSeed => ({
  ...care,
  status: 'APPROVED',
  notes: null,
});

/** Tree care written by the add-plant playbook, one record per fruit family. */
export const TREE_CARE_SEED: TreeCareSeed[] = [
  MANGO_CARE,
  GUAVA_CARE,
  LITCHI_CARE,
  SAPOTA_CARE,
  JACKFRUIT_CARE,
  AMLA_CARE,
  CITRUS_CARE,
  PAPAYA_CARE,
].map(approved);

/**
 * Catalogue families still on generic season packs. This list only shrinks:
 * when a family's care ships, it moves from here into TREE_CARE_SEED.
 */
export const CARE_PENDING: readonly string[] = [
  'pomegranate',
  'banana',
  'grape',
  'coconut',
  'custard_apple',
  'moringa',
  'jamun',
  'ber',
  'bael',
  'fig',
  'mulberry',
  'star_fruit',
  'karonda',
  'phalsa',
  'wood_apple',
  'tamarind',
  'kokum',
  'dragon_fruit',
  // Phase 3: hill and cool-climate fruit
  'apple',
  'pear',
  'peach',
  'plum',
  'apricot',
  'cherry',
  'walnut',
  'almond',
  'kiwi',
  'persimmon',
];
