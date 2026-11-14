/**
 * Care steps: the reminder title and the step on the crop page. Edit here, then run the catalogue push (docs/deploy.md); the
 * API reads the database, not this file. Change crop values only through the
 * add-plant playbook: source check, then the owner's yes.
 */
import type { CareStepSeed } from '../domain/types';

export const CARE_STEP_SEED: CareStepSeed[] = [
  {
    key: 'stake',
    title: 'Stake the {name} plants',
    label_title: 'Stake',
    label_body: 'Tie the plant to a stake as it grows tall.',
    status: 'APPROVED',
  },
  {
    key: 'earth_up',
    title: 'Earth up the {name}',
    label_title: 'Earth up',
    label_body:
      "Pile soil around the base to cover what's growing underground.",
    status: 'APPROVED',
  },
  {
    key: 'trellis',
    title: 'Give the {name} a trellis to climb',
    label_title: 'Trellis',
    label_body: 'Give the vines something to climb.',
    status: 'APPROVED',
  },
  {
    key: 'support',
    title: 'Give the {name} support to climb',
    label_title: 'Support',
    label_body: 'Add a few sticks or a net to hold the plants up.',
    status: 'APPROVED',
  },
  {
    key: 'pinch',
    title: 'Pinch the {name} tips for a bushier plant',
    label_title: 'Pinch',
    label_body:
      'Nip the growing tips once for a bushier plant with more flowers.',
    status: 'APPROVED',
  },
  {
    key: 'deadhead',
    title: 'Deadhead the {name} to keep it blooming',
    label_title: 'Deadhead',
    label_body: 'Pick off faded flowers so the plant keeps blooming.',
    status: 'APPROVED',
  },
];
