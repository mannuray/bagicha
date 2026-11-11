/**
 * Bagicha's vegetable calendar: when each crop is sown in each climate group,
 * how it is raised, and how long it takes. Values are typical ranges for Indian
 * home gardens, drawn from state agricultural university / ICAR packages of
 * practices (e.g. PAU, TNAU, IARI vegetable calendars); variety and local
 * weather move them, so the app shows them as ranges ("Sow Sep–Oct").
 * Spec: docs/superpowers/specs/2026-11-11-vegetables-design.md §2.1, §6.1.
 */
import { RegionCluster } from '@prisma/client';

export type ClimateGroup = 'PLAINS' | 'PENINSULAR' | 'HILLS';
export type CropMethod =
  | 'NURSERY_TRANSPLANT'
  | 'DIRECT_SOW'
  | 'TUBER'
  | 'CLOVE'
  | 'RHIZOME';
export type CropFamily =
  | 'SOLANACEAE'
  | 'BRASSICACEAE'
  | 'FABACEAE'
  | 'CUCURBITACEAE'
  | 'APIACEAE'
  | 'AMARANTHACEAE'
  | 'AMARYLLIDACEAE'
  | 'ASTERACEAE'
  | 'MALVACEAE'
  | 'ZINGIBERACEAE';
type Months = [number, number];

export interface CareStep {
  key: string;
  after: 'SOWING' | 'TRANSPLANTING';
  days: number;
}

export interface CropInfo {
  id: string;
  name: string;
  aliases: string[];
  family: CropFamily;
  method: CropMethod;
  /** Sowing windows per climate group as [startMonth, endMonth]; may wrap the year end. */
  windows: Record<ClimateGroup, Months[]>;
  germination_days: [number, number];
  transplant_after_days: [number, number] | null;
  /** From sowing (or planting the tuber, clove or rhizome). */
  days_to_first_harvest: [number, number];
  harvest_span_days: number;
  thin_after_days: number | null;
  succession_every_days: number | null;
  care: CareStep[];
  tags: Array<'container' | 'beginner' | 'quick'>;
  guide: {
    plants_for_family_of_4: string;
    container: string;
    spacing_cm: [number, number];
  };
  scientific_name: string;
  /** One plain line about the crop, for its detail page. */
  description: string;
  /** FULL: 6+ hours of direct sun; PARTIAL: 3–5 hours is enough. */
  sun: 'FULL' | 'PARTIAL';
}

type Raw = Omit<
  CropInfo,
  'tags' | 'scientific_name' | 'description' | 'sun'
> & {
  tags: Array<'container' | 'beginner'>;
};

type Details = Pick<CropInfo, 'scientific_name' | 'description' | 'sun'>;
const d = (
  scientific_name: string,
  description: string,
  sun: 'FULL' | 'PARTIAL' = 'FULL',
): Details => ({ scientific_name, description, sun });
const DETAILS: Record<string, Details> = {
  tomato: d(
    'Solanum lycopersicum',
    'The kitchen-garden staple: loves sun and something to climb.',
  ),
  brinjal: d(
    'Solanum melongena',
    'A sturdy, long-bearing plant that keeps giving for months.',
  ),
  chilli: d(
    'Capsicum annuum',
    'Easy in pots and generous once it starts flowering.',
  ),
  capsicum: d(
    'Capsicum annuum',
    'Sweet peppers that like steady warmth and regular feeding.',
  ),
  potato: d(
    'Solanum tuberosum',
    'Grown from seed tubers; earth it up and dig in late winter.',
  ),
  okra: d(
    'Abelmoschus esculentus',
    'A heat-lover that crops fast; pick the pods young.',
  ),
  bottle_gourd: d(
    'Lagenaria siceraria',
    'A vigorous climber for a trellis or a roof.',
  ),
  bitter_gourd: d(
    'Momordica charantia',
    'A climbing vine with bitter, healthy fruit.',
  ),
  ridge_gourd: d(
    'Luffa acutangula',
    'A fast climber; harvest while the ridges are tender.',
  ),
  cucumber: d(
    'Cucumis sativus',
    'Quick to fruit on a small trellis; keep the soil moist.',
  ),
  pumpkin: d('Cucurbita moschata', 'A sprawling vine that needs room to run.'),
  peas: d(
    'Pisum sativum',
    'A cool-season climber; sweetest when picked young.',
  ),
  french_beans: d(
    'Phaseolus vulgaris',
    'Easy, quick beans; sow a new row every few weeks.',
  ),
  cauliflower: d(
    'Brassica oleracea var. botrytis',
    'A winter favourite that wants rich soil and steady water.',
  ),
  cabbage: d(
    'Brassica oleracea var. capitata',
    'A hardy winter crop that forms firm heads.',
  ),
  mustard_greens: d(
    'Brassica juncea',
    'Leafy sarson for saag; cut and it comes again.',
    'PARTIAL',
  ),
  radish: d(
    'Raphanus sativus',
    'Ready in weeks; sow a little often for a steady supply.',
  ),
  carrot: d(
    'Daucus carota',
    'Needs deep, loose soil; thin early for straight roots.',
  ),
  palak: d(
    'Spinacia oleracea',
    'Fast, forgiving greens that are happy with some shade.',
    'PARTIAL',
  ),
  methi: d(
    'Trigonella foenum-graecum',
    'Greens in under a month, even on a windowsill.',
    'PARTIAL',
  ),
  coriander: d(
    'Coriandrum sativum',
    'Fresh dhaniya leaves; sow small batches every two weeks.',
    'PARTIAL',
  ),
  lettuce: d(
    'Lactuca sativa',
    'Crisp salad leaves for the cool months.',
    'PARTIAL',
  ),
  onion: d(
    'Allium cepa',
    'Raised from seed in a nursery, then moved to a bed.',
  ),
  garlic: d(
    'Allium sativum',
    'Plant single cloves in autumn; harvest bulbs in spring.',
  ),
  ginger: d(
    'Zingiber officinale',
    'Grown from rhizomes; likes warmth, moisture and dappled light.',
    'PARTIAL',
  ),
  turmeric: d(
    'Curcuma longa',
    'Grown from rhizomes; a slow, leafy crop dug after the rains.',
    'PARTIAL',
  ),
};

const GOURD_WINDOWS: Record<ClimateGroup, Months[]> = {
  PLAINS: [
    [2, 3],
    [6, 7],
  ],
  PENINSULAR: [
    [1, 2],
    [6, 7],
  ],
  HILLS: [[4, 5]],
};
const GREENS_WINDOWS: Record<ClimateGroup, Months[]> = {
  PLAINS: [
    [9, 11],
    [2, 3],
  ],
  PENINSULAR: [
    [9, 12],
    [6, 7],
  ],
  HILLS: [
    [3, 5],
    [8, 9],
  ],
};
const trellis: CareStep = { key: 'trellis', after: 'SOWING', days: 20 };

const RAW: Raw[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    aliases: ['tamatar', 'टमाटर'],
    family: 'SOLANACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [
        [9, 10],
        [1, 2],
      ],
      PENINSULAR: [
        [6, 7],
        [11, 12],
      ],
      HILLS: [[3, 4]],
    },
    germination_days: [5, 10],
    transplant_after_days: [25, 30],
    days_to_first_harvest: [90, 110],
    harvest_span_days: 60,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'stake', after: 'TRANSPLANTING', days: 20 }],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '4–6 plants',
      container: '12–14 inch pot or grow-bag per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    aliases: ['baingan', 'eggplant', 'बैंगन'],
    family: 'SOLANACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [
        [6, 7],
        [10, 11],
      ],
      PENINSULAR: [
        [6, 7],
        [11, 12],
      ],
      HILLS: [[3, 4]],
    },
    germination_days: [6, 10],
    transplant_after_days: [30, 40],
    days_to_first_harvest: [100, 130],
    harvest_span_days: 90,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '3–4 plants',
      container: '14–16 inch pot or grow-bag per plant',
      spacing_cm: [60, 75],
    },
  },
  {
    id: 'chilli',
    name: 'Chilli',
    aliases: ['mirch', 'hari mirch', 'मिर्च'],
    family: 'SOLANACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [
        [5, 6],
        [9, 10],
      ],
      PENINSULAR: [
        [6, 7],
        [1, 2],
      ],
      HILLS: [[3, 4]],
    },
    germination_days: [7, 14],
    transplant_after_days: [35, 45],
    days_to_first_harvest: [100, 120],
    harvest_span_days: 90,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: '3–5 plants',
      container: '10–12 inch pot per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    aliases: ['shimla mirch', 'bell pepper', 'शिमला मिर्च'],
    family: 'SOLANACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [[9, 10]],
      PENINSULAR: [
        [6, 7],
        [10, 11],
      ],
      HILLS: [[3, 4]],
    },
    germination_days: [7, 14],
    transplant_after_days: [35, 45],
    days_to_first_harvest: [90, 110],
    harvest_span_days: 60,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'stake', after: 'TRANSPLANTING', days: 25 }],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '3–4 plants',
      container: '12–14 inch pot per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'potato',
    name: 'Potato',
    aliases: ['aloo', 'आलू'],
    family: 'SOLANACEAE',
    method: 'TUBER',
    windows: { PLAINS: [[10, 11]], PENINSULAR: [[11, 12]], HILLS: [[3, 4]] },
    germination_days: [10, 20],
    transplant_after_days: null,
    days_to_first_harvest: [90, 110],
    harvest_span_days: 10,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'earth_up', after: 'SOWING', days: 30 }],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: '4–5 kg of seed potatoes (or 3–4 grow-bags)',
      container: '20-litre grow-bag for 3–4 tubers',
      spacing_cm: [20, 25],
    },
  },
  {
    id: 'okra',
    name: 'Okra',
    aliases: ['bhindi', 'ladyfinger', 'भिंडी'],
    family: 'MALVACEAE',
    method: 'DIRECT_SOW',
    windows: {
      PLAINS: [
        [2, 3],
        [6, 7],
      ],
      PENINSULAR: [
        [1, 2],
        [6, 7],
      ],
      HILLS: [[4, 5]],
    },
    germination_days: [5, 8],
    transplant_after_days: null,
    days_to_first_harvest: [45, 55],
    harvest_span_days: 60,
    thin_after_days: 15,
    succession_every_days: null,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: '8–10 plants',
      container: '12-inch pot per plant',
      spacing_cm: [30, 45],
    },
  },
  {
    id: 'bottle_gourd',
    name: 'Bottle gourd',
    aliases: ['lauki', 'ghiya', 'लौकी'],
    family: 'CUCURBITACEAE',
    method: 'DIRECT_SOW',
    windows: GOURD_WINDOWS,
    germination_days: [6, 10],
    transplant_after_days: null,
    days_to_first_harvest: [55, 65],
    harvest_span_days: 60,
    thin_after_days: null,
    succession_every_days: null,
    care: [trellis],
    tags: ['beginner'],
    guide: {
      plants_for_family_of_4: '2 plants',
      container: 'a large tub or 40-litre grow-bag',
      spacing_cm: [150, 200],
    },
  },
  {
    id: 'bitter_gourd',
    name: 'Bitter gourd',
    aliases: ['karela', 'करेला'],
    family: 'CUCURBITACEAE',
    method: 'DIRECT_SOW',
    windows: GOURD_WINDOWS,
    germination_days: [7, 10],
    transplant_after_days: null,
    days_to_first_harvest: [55, 65],
    harvest_span_days: 60,
    thin_after_days: null,
    succession_every_days: null,
    care: [trellis],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '2–3 plants',
      container: '20-litre grow-bag per plant',
      spacing_cm: [100, 150],
    },
  },
  {
    id: 'ridge_gourd',
    name: 'Ridge gourd',
    aliases: ['turai', 'tori', 'तोरई'],
    family: 'CUCURBITACEAE',
    method: 'DIRECT_SOW',
    windows: GOURD_WINDOWS,
    germination_days: [6, 10],
    transplant_after_days: null,
    days_to_first_harvest: [50, 60],
    harvest_span_days: 60,
    thin_after_days: null,
    succession_every_days: null,
    care: [trellis],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '2 plants',
      container: '20-litre grow-bag per plant',
      spacing_cm: [100, 150],
    },
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    aliases: ['kheera', 'खीरा'],
    family: 'CUCURBITACEAE',
    method: 'DIRECT_SOW',
    windows: GOURD_WINDOWS,
    germination_days: [3, 7],
    transplant_after_days: null,
    days_to_first_harvest: [45, 55],
    harvest_span_days: 40,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'trellis', after: 'SOWING', days: 15 }],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: '3–4 plants',
      container: '15-litre grow-bag per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    aliases: ['kaddu', 'sitaphal (pumpkin)', 'कद्दू'],
    family: 'CUCURBITACEAE',
    method: 'DIRECT_SOW',
    windows: GOURD_WINDOWS,
    germination_days: [6, 10],
    transplant_after_days: null,
    days_to_first_harvest: [90, 120],
    harvest_span_days: 30,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['beginner'],
    guide: {
      plants_for_family_of_4: '1–2 plants',
      container: 'needs open ground',
      spacing_cm: [200, 300],
    },
  },
  {
    id: 'peas',
    name: 'Peas',
    aliases: ['matar', 'मटर'],
    family: 'FABACEAE',
    method: 'DIRECT_SOW',
    windows: {
      PLAINS: [[10, 11]],
      PENINSULAR: [[10, 11]],
      HILLS: [
        [3, 4],
        [9, 10],
      ],
    },
    germination_days: [7, 10],
    transplant_after_days: null,
    days_to_first_harvest: [60, 75],
    harvest_span_days: 30,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'support', after: 'SOWING', days: 25 }],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 2-metre row (or 2 large grow-bags)',
      container: '20-litre grow-bag for 8–10 plants',
      spacing_cm: [5, 10],
    },
  },
  {
    id: 'french_beans',
    name: 'French beans',
    aliases: ['beans', 'bean', 'फ्रेंच बीन'],
    family: 'FABACEAE',
    method: 'DIRECT_SOW',
    windows: {
      PLAINS: [
        [2, 3],
        [9, 10],
      ],
      PENINSULAR: [
        [6, 7],
        [10, 11],
      ],
      HILLS: [[3, 4]],
    },
    germination_days: [6, 10],
    transplant_after_days: null,
    days_to_first_harvest: [50, 60],
    harvest_span_days: 30,
    thin_after_days: null,
    succession_every_days: 21,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 2-metre row',
      container: '12-inch pot for 3 plants',
      spacing_cm: [10, 15],
    },
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    aliases: ['phool gobhi', 'gobhi', 'फूलगोभी'],
    family: 'BRASSICACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [
        [7, 8],
        [9, 10],
      ],
      PENINSULAR: [
        [7, 8],
        [10, 11],
      ],
      HILLS: [
        [3, 4],
        [7, 8],
      ],
    },
    germination_days: [5, 8],
    transplant_after_days: [25, 35],
    days_to_first_harvest: [90, 120],
    harvest_span_days: 20,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '6–8 plants',
      container: '14-inch pot per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    aliases: ['patta gobhi', 'bandh gobhi', 'पत्तागोभी'],
    family: 'BRASSICACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [[9, 10]],
      PENINSULAR: [
        [8, 9],
        [11, 12],
      ],
      HILLS: [
        [3, 4],
        [7, 8],
      ],
    },
    germination_days: [5, 8],
    transplant_after_days: [25, 35],
    days_to_first_harvest: [90, 110],
    harvest_span_days: 20,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: '6–8 plants',
      container: '14-inch pot per plant',
      spacing_cm: [45, 60],
    },
  },
  {
    id: 'mustard_greens',
    name: 'Mustard greens',
    aliases: ['sarson', 'sarson ka saag', 'सरसों'],
    family: 'BRASSICACEAE',
    method: 'DIRECT_SOW',
    windows: {
      PLAINS: [[9, 11]],
      PENINSULAR: [[10, 12]],
      HILLS: [
        [3, 4],
        [8, 9],
      ],
    },
    germination_days: [4, 7],
    transplant_after_days: null,
    days_to_first_harvest: [30, 40],
    harvest_span_days: 45,
    thin_after_days: 15,
    succession_every_days: 21,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 1-metre row',
      container: '10-inch pot',
      spacing_cm: [20, 30],
    },
  },
  {
    id: 'radish',
    name: 'Radish',
    aliases: ['mooli', 'मूली'],
    family: 'BRASSICACEAE',
    method: 'DIRECT_SOW',
    windows: { PLAINS: [[9, 2]], PENINSULAR: [[8, 1]], HILLS: [[3, 8]] },
    germination_days: [3, 5],
    transplant_after_days: null,
    days_to_first_harvest: [40, 50],
    harvest_span_days: 15,
    thin_after_days: 12,
    succession_every_days: 15,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 1-metre row every 2 weeks',
      container: '8-inch deep pot',
      spacing_cm: [5, 10],
    },
  },
  {
    id: 'carrot',
    name: 'Carrot',
    aliases: ['gajar', 'गाजर'],
    family: 'APIACEAE',
    method: 'DIRECT_SOW',
    windows: { PLAINS: [[9, 11]], PENINSULAR: [[8, 11]], HILLS: [[3, 6]] },
    germination_days: [10, 20],
    transplant_after_days: null,
    days_to_first_harvest: [80, 100],
    harvest_span_days: 20,
    thin_after_days: 20,
    succession_every_days: 21,
    care: [],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: 'a 1-metre row',
      container: '12-inch deep pot',
      spacing_cm: [5, 8],
    },
  },
  {
    id: 'palak',
    name: 'Spinach (Palak)',
    aliases: ['palak', 'spinach', 'पालक'],
    family: 'AMARANTHACEAE',
    method: 'DIRECT_SOW',
    windows: GREENS_WINDOWS,
    germination_days: [5, 10],
    transplant_after_days: null,
    days_to_first_harvest: [30, 40],
    harvest_span_days: 60,
    thin_after_days: 15,
    succession_every_days: 15,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 1-metre row every 2 weeks',
      container: '8-inch pot',
      spacing_cm: [10, 15],
    },
  },
  {
    id: 'methi',
    name: 'Fenugreek (Methi)',
    aliases: ['methi', 'fenugreek', 'मेथी'],
    family: 'FABACEAE',
    method: 'DIRECT_SOW',
    windows: GREENS_WINDOWS,
    germination_days: [3, 6],
    transplant_after_days: null,
    days_to_first_harvest: [25, 30],
    harvest_span_days: 20,
    thin_after_days: null,
    succession_every_days: 15,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a small row every 2 weeks',
      container: '6-inch pot',
      spacing_cm: [5, 10],
    },
  },
  {
    id: 'coriander',
    name: 'Coriander (Dhaniya)',
    aliases: ['dhaniya', 'cilantro', 'धनिया'],
    family: 'APIACEAE',
    method: 'DIRECT_SOW',
    windows: GREENS_WINDOWS,
    germination_days: [7, 14],
    transplant_after_days: null,
    days_to_first_harvest: [35, 45],
    harvest_span_days: 20,
    thin_after_days: null,
    succession_every_days: 15,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a small row every 2 weeks',
      container: '8-inch pot',
      spacing_cm: [5, 10],
    },
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    aliases: ['salad patta', 'लेट्यूस'],
    family: 'ASTERACEAE',
    method: 'DIRECT_SOW',
    windows: {
      PLAINS: [[9, 11]],
      PENINSULAR: [[10, 12]],
      HILLS: [
        [3, 5],
        [8, 9],
      ],
    },
    germination_days: [4, 8],
    transplant_after_days: null,
    days_to_first_harvest: [40, 55],
    harvest_span_days: 30,
    thin_after_days: 15,
    succession_every_days: 21,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: '6–8 plants every 3 weeks',
      container: '8-inch pot per plant',
      spacing_cm: [20, 30],
    },
  },
  {
    id: 'onion',
    name: 'Onion',
    aliases: ['pyaz', 'kanda', 'प्याज'],
    family: 'AMARYLLIDACEAE',
    method: 'NURSERY_TRANSPLANT',
    windows: {
      PLAINS: [[10, 11]],
      PENINSULAR: [
        [5, 6],
        [10, 11],
      ],
      HILLS: [[9, 10]],
    },
    germination_days: [7, 12],
    transplant_after_days: [45, 55],
    days_to_first_harvest: [140, 160],
    harvest_span_days: 15,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: [],
    guide: {
      plants_for_family_of_4: 'a 2-metre bed (about 100 plants)',
      container: 'a wide, shallow grow-bag',
      spacing_cm: [10, 15],
    },
  },
  {
    id: 'garlic',
    name: 'Garlic',
    aliases: ['lehsun', 'लहसुन'],
    family: 'AMARYLLIDACEAE',
    method: 'CLOVE',
    windows: { PLAINS: [[10, 11]], PENINSULAR: [[10, 11]], HILLS: [[9, 10]] },
    germination_days: [7, 14],
    transplant_after_days: null,
    days_to_first_harvest: [150, 180],
    harvest_span_days: 15,
    thin_after_days: null,
    succession_every_days: null,
    care: [],
    tags: ['container', 'beginner'],
    guide: {
      plants_for_family_of_4: 'a 1-metre row (about 40 cloves)',
      container: '12-inch pot for 8–10 cloves',
      spacing_cm: [8, 10],
    },
  },
  {
    id: 'ginger',
    name: 'Ginger',
    aliases: ['adrak', 'अदरक'],
    family: 'ZINGIBERACEAE',
    method: 'RHIZOME',
    windows: { PLAINS: [[4, 5]], PENINSULAR: [[5, 6]], HILLS: [[4, 5]] },
    germination_days: [15, 30],
    transplant_after_days: null,
    days_to_first_harvest: [240, 270],
    harvest_span_days: 30,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'earth_up', after: 'SOWING', days: 60 }],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: 'a 20-litre grow-bag (6–8 pieces)',
      container: '20-litre grow-bag',
      spacing_cm: [20, 25],
    },
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    aliases: ['haldi', 'हल्दी'],
    family: 'ZINGIBERACEAE',
    method: 'RHIZOME',
    windows: { PLAINS: [[5, 6]], PENINSULAR: [[5, 6]], HILLS: [[4, 5]] },
    germination_days: [20, 30],
    transplant_after_days: null,
    days_to_first_harvest: [240, 270],
    harvest_span_days: 30,
    thin_after_days: null,
    succession_every_days: null,
    care: [{ key: 'earth_up', after: 'SOWING', days: 60 }],
    tags: ['container'],
    guide: {
      plants_for_family_of_4: 'a 20-litre grow-bag (6–8 pieces)',
      container: '20-litre grow-bag',
      spacing_cm: [25, 30],
    },
  },
];

const QUICK_DAYS = 45;

export const CROPS: readonly CropInfo[] = RAW.map((c) => ({
  ...c,
  ...DETAILS[c.id],
  tags:
    c.days_to_first_harvest[0] < QUICK_DAYS
      ? [...c.tags, 'quick' as const]
      : c.tags,
}));

export function cropById(id: string | null | undefined): CropInfo | null {
  return CROPS.find((c) => c.id === id) ?? null;
}

export function climateGroupFor(region: RegionCluster): ClimateGroup {
  if (region === RegionCluster.HILLS_COOL) return 'HILLS';
  if (
    region === RegionCluster.SOUTH_DECCAN ||
    region === RegionCluster.COASTAL_HUMID
  )
    return 'PENINSULAR';
  return 'PLAINS';
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_DAYS = 30;

/** Midnight IST on the 1st of `month` (1–12) of `year`. */
const istMonthStart = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);

export interface WindowInstance {
  index: number;
  start: Date;
  /** Exclusive: midnight IST after the window's last day. */
  end: Date;
}

/** Concrete dates for every window starting in the years around `now`, by start. */
function instances(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
): WindowInstance[] {
  const year = new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear();
  const out: WindowInstance[] = [];
  for (const y of [year - 1, year, year + 1]) {
    crop.windows[group].forEach(([startMonth, endMonth], index) => {
      const endYear = endMonth < startMonth ? y + 1 : y;
      out.push({
        index,
        start: istMonthStart(y, startMonth),
        end: istMonthStart(endYear, endMonth + 1),
      });
    });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface WindowStatus {
  status: 'open' | 'soon' | 'later' | 'none';
  window_index?: number;
  opens_in_days?: number;
  next_month?: number;
}

/** Whether the crop can be sown now in this climate group, or how soon. */
export function windowStatus(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
): WindowStatus {
  if (crop.windows[group].length === 0) return { status: 'none' };
  const all = instances(crop, group, now);
  const open = all.find((w) => w.start <= now && now < w.end);
  if (open) return { status: 'open', window_index: open.index };
  const next = all.find((w) => w.start > now);
  if (!next) return { status: 'none' };
  const days = Math.ceil((next.start.getTime() - now.getTime()) / DAY_MS);
  if (days <= SOON_DAYS)
    return { status: 'soon', window_index: next.index, opens_in_days: days };
  return {
    status: 'later',
    window_index: next.index,
    next_month: crop.windows[group][next.index][0],
  };
}

/** The earliest window, open now or future, in which no season of this crop has started. */
export function nextWindow(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
  usedStarts: Date[],
): WindowInstance | null {
  const used = new Set(usedStarts.map((d) => d.getTime()));
  return (
    instances(crop, group, now).find(
      (w) => w.end > now && !used.has(w.start.getTime()),
    ) ?? null
  );
}

/** The window instance a date falls in, if any (to mark a window as used by a season). */
export function windowContaining(
  crop: CropInfo,
  group: ClimateGroup,
  at: Date,
): WindowInstance | null {
  return (
    instances(crop, group, at).find((w) => w.start <= at && at < w.end) ?? null
  );
}
