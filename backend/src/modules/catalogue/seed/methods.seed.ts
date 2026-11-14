/**
 * Planting methods: the journey shape each follows and its wording. Edit here, then run the catalogue push (docs/deploy.md); the
 * API reads the database, not this file. Change crop values only through the
 * add-plant playbook: source check, then the owner's yes.
 */
import type { MethodSeed } from '../domain/types';

export const METHOD_SEED: MethodSeed[] = [
  {
    key: 'NURSERY_TRANSPLANT',
    journey: 'NURSERY',
    material: null,
    label: 'Nursery, then transplant',
    short: 'nursery',
    material_title: null,
    material_body: null,
    status: 'APPROVED',
  },
  {
    key: 'DIRECT_SOW',
    journey: 'DIRECT',
    material: null,
    label: 'Sow straight in the bed',
    short: 'direct',
    material_title: null,
    material_body: null,
    status: 'APPROVED',
  },
  {
    key: 'TUBER',
    journey: 'PLANT',
    material: 'seed potatoes',
    label: 'Plant seed potatoes',
    short: 'tubers',
    material_title: 'Seed potatoes',
    material_body: 'Use sprouted potatoes from a nursery or your kitchen.',
    status: 'APPROVED',
  },
  {
    key: 'CLOVE',
    journey: 'PLANT',
    material: 'garlic cloves',
    label: 'Plant cloves',
    short: 'cloves',
    material_title: 'Cloves',
    material_body: 'Split a healthy bulb into cloves.',
    status: 'APPROVED',
  },
  {
    key: 'RHIZOME',
    journey: 'PLANT',
    material: 'healthy rhizomes',
    label: 'Plant rhizomes',
    short: 'rhizomes',
    material_title: 'Rhizomes',
    material_body: 'Use plump rhizome pieces with a bud each.',
    status: 'APPROVED',
  },
];
