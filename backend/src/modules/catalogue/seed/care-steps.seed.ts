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
    hi: {
      label_title: 'डंडी लगाएं',
      label_body: 'पौधा लंबा हो तो उसे डंडी से बांध दें।',
    },
    status: 'APPROVED',
  },
  {
    key: 'earth_up',
    title: 'Earth up the {name}',
    label_title: 'Earth up',
    label_body:
      "Pile soil around the base to cover what's growing underground.",
    hi: {
      label_title: 'मिट्टी चढ़ाएं',
      label_body:
        'जड़ के पास मिट्टी चढ़ाएं ताकि ज़मीन के नीचे बढ़ने वाला हिस्सा ढका रहे।',
    },
    status: 'APPROVED',
  },
  {
    key: 'trellis',
    title: 'Give the {name} a trellis to climb',
    label_title: 'Trellis',
    label_body: 'Give the vines something to climb.',
    hi: { label_title: 'जाली', label_body: 'बेलों को चढ़ने के लिए सहारा दें।' },
    status: 'APPROVED',
  },
  {
    key: 'support',
    title: 'Give the {name} support to climb',
    label_title: 'Support',
    label_body: 'Add a few sticks or a net to hold the plants up.',
    hi: {
      label_title: 'सहारा',
      label_body: 'पौधों को संभालने के लिए कुछ डंडियां या जाल लगाएं।',
    },
    status: 'APPROVED',
  },
  {
    key: 'pinch',
    title: 'Pinch the {name} tips for a bushier plant',
    label_title: 'Pinch',
    label_body:
      'Nip the growing tips once for a bushier plant with more flowers.',
    hi: {
      label_title: 'सिरा तोड़ें',
      label_body:
        'बढ़ते सिरे एक बार तोड़ दें, पौधा घना होगा और फूल ज़्यादा आएंगे।',
    },
    status: 'APPROVED',
  },
  {
    key: 'deadhead',
    title: 'Deadhead the {name} to keep it blooming',
    label_title: 'Deadhead',
    label_body: 'Pick off faded flowers so the plant keeps blooming.',
    hi: {
      label_title: 'सूखे फूल हटाएं',
      label_body: 'मुरझाए फूल तोड़ दें ताकि पौधा खिलता रहे।',
    },
    status: 'APPROVED',
  },
  {
    key: 'lift',
    title: 'Lift and store the {name}',
    label_title: 'Lift and store',
    label_body:
      'When the leaves turn yellow and dry, stop watering, dig up, dry in shade and store cool until next season.',
    hi: {
      label_title: 'निकालें और रखें',
      label_body:
        'पत्ते पीले होकर सूखने लगें तो पानी बंद करें, खोदकर छांव में सुखाएं और अगले मौसम तक ठंडी जगह रखें।',
    },
    status: 'APPROVED',
  },
];
