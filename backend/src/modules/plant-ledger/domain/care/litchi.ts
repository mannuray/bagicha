import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from './types';

/**
 * Litchi care, transcribed from the source-checked table approved by the owner
 * on 2026-11-12 (docs/plant-care/litchi.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: E = East (Bihar timing from NRC Litchi: harvest mid-May to
 * mid-June, feeding after harvest and at clove-size fruit); N = North (Punjab
 * timing from PAU: harvest in June, manure in December, urea in February and
 * April, one watering against frost). They differ by 3–4 weeks and follow
 * different feeding and watering calendars, so they are separate.
 *
 * Doses: NHB-7's annual increase per year of age, up to 10 years (urea 90 g,
 * SSP 100 g, MOP 83 g, FYM 4 kg), split as the table gives it per group.
 * No pesticide has a litchi label claim, so there are no chemical lines.
 */
type Group = 'E' | 'N';

const MAX_AGE = 10;
const E_MAIN_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 60 },
    { what: 'SSP', grams: 100 },
    { what: 'MOP', grams: 55 },
  ],
  maxAgeYears: MAX_AGE,
};
const E_CLOVE_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 30 },
    { what: 'MOP', grams: 28 },
  ],
  maxAgeYears: MAX_AGE,
};
const FYM_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 4000 }],
  chemical: [],
  maxAgeYears: MAX_AGE,
};
const MANURE_SSP_MOP_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 4000 }],
  chemical: [
    { what: 'SSP', grams: 100 },
    { what: 'MOP', grams: 83 },
  ],
  maxAgeYears: MAX_AGE,
};
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 45 }],
  maxAgeYears: MAX_AGE,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'prune_after_harvest',
    title: 'Prune fruited twigs and mite-curled shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Right after picking, before the new flush: cut off the fruited twig ends and every shoot with brown, velvety, curled leaves. Burn or bury the cuttings',
    why: "New shoots carry next year's flowers. Cutting out mite galls stops the mite spreading",
    windows: {
      E: [
        [6, 10],
        [6, 30],
      ],
      N: [
        [6, 25],
        [7, 15],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Feed the main fertiliser after harvest',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "Two-thirds of the year's urea, all the SSP and two-thirds of the MOP, in a trench 20–30 cm deep along the canopy edge. Only when the soil is moist",
    dose: E_MAIN_DOSE,
    why: 'Feeds the post-harvest flush that will flower',
    windows: {
      E: [
        [6, 15],
        [7, 15],
      ],
    },
  },
  {
    key: 'manure',
    title: "Spread the year's manure",
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: "All the year's FYM along the canopy edge",
    dose: FYM_DOSE,
    why: 'Slow feed for flowering',
    windows: {
      E: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'manure',
    title: "Spread the year's manure",
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: "All the year's FYM + all the SSP + all the MOP",
    // The engine joins the organic and chemical parts with "or"; here all of it goes in.
    dose: MANURE_SSP_MOP_DOSE,
    why: "Slow feed for flowering. PAU's single winter dose",
    windows: {
      N: [
        [12, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'mite_cut_october',
    title: 'Cut out mite-curled shoots again',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic: 'Cut and burn the new shoots showing velvety, curled leaves',
    why: "October flush is the mite's second peak",
    windows: {
      E: [
        [10, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'frost_water',
    title: 'Water once against frost',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      'One good watering of bearing trees; after that, water only if the soil is dry',
    why: 'Moist soil protects against frost',
    windows: {
      N: [
        [11, 25],
        [12, 7],
      ],
    },
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'In November, rake the soil around the trunk. By mid-December, tie a 25 cm wide, 400-gauge polythene band 30–50 cm up the trunk and grease or mud-plaster its edge',
    why: 'Stops mealybug nymphs climbing to the flowers',
    windows: {
      E: [
        [12, 1],
        [12, 20],
      ],
      N: [
        [12, 1],
        [12, 20],
      ],
    },
  },
  {
    key: 'urea_before_flowering',
    title: 'Feed half the urea before flowering',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: "Half the year's urea along the canopy edge; water in",
    dose: HALF_UREA_DOSE,
    why: 'Feeds flowering',
    windows: {
      N: [
        [2, 10],
        [2, 20],
      ],
    },
  },
  {
    key: 'feed_after_set',
    title: 'Feed urea after fruit set',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      'The last third of the urea + the last third of the MOP, when fruits are clove-size. Water in',
    dose: E_CLOVE_DOSE,
    why: 'Feeds the growing fruit',
    windows: {
      E: [
        [4, 1],
        [4, 15],
      ],
    },
  },
  {
    key: 'feed_after_set',
    title: 'Feed urea after fruit set',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'The other half of the urea. Water in',
    dose: HALF_UREA_DOSE,
    why: 'Feeds the growing fruit',
    windows: {
      N: [
        [4, 10],
        [4, 20],
      ],
    },
  },
  {
    key: 'water_until_picking',
    title: 'Water twice a week until picking',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'Water bearing trees twice a week while the fruit develops',
    why: 'Dry soil followed by heavy water cracks and drops fruit',
    windows: {
      N: [
        [5, 10],
        [6, 30],
      ],
    },
  },
  {
    key: 'pick_bunches',
    title: 'Pick ripe bunches with a short stalk',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      "Pick only fully red fruit with flattened bumps; litchi doesn't ripen after picking. Cut whole bunches with a short stalk and few leaves; never pull single fruits",
    why: 'Single fruits tear at the stalk and rot',
    windows: {
      E: [
        [5, 15],
        [6, 15],
      ],
      N: [
        [6, 8],
        [6, 28],
      ],
    },
  },
];

const BOTH = { E: ALL_YEAR, N: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'nrcl_dose',
    title: 'NRC Litchi dose for trees over 12 years',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Your tree is over 12 years old',
    organic:
      "Bearing-tree dose from NRC Litchi, the ICAR institute: trees over 12 years, 750 g N and 750 g K₂O a year. This is a flat adult figure, not per year of age. The app's reminders use NHB-7's lower per-year dose",
    why: 'A flat adult dose from the ICAR institute',
    windows: BOTH,
  },
  {
    key: 'water_before_flowering',
    title: 'Hold back water before flowering',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'About four months before flowering',
    organic:
      'Hold back water from bearing trees for about four months before flowering. Start watering again once flower bunches show',
    why: 'Water before flowering',
    windows: { E: ALL_YEAR },
  },
  {
    key: 'water_fruit_growth',
    title: 'Keep the soil moist as fruit grows',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'From fruit set until 8–10 days before picking',
    organic:
      'Never let the soil dry from fruit set until 8–10 days before picking',
    why: 'Water as fruit grows',
    windows: { E: ALL_YEAR },
  },
  {
    key: 'bagging',
    title: 'Bag the fruit bunches',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: '25–30 days after your tree sets fruit',
    organic: 'Tie white or pink non-woven polypropylene bags over the bunches',
    why: 'They guard against nut borer, sunburn and cracking, and improve colour',
    windows: BOTH,
  },
  {
    key: 'mite_flush',
    title: 'Cut out mite-curled shoots on the new flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Velvety curled leaves on the new flush (mite)',
    organic:
      'Cut and burn those shoots in Dec–Jan, before the flower buds open',
    why: 'Mite',
    windows: {
      N: [
        [12, 1],
        [1, 31],
      ],
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silk webs with chewed bark on the trunk',
    organic:
      'Pull off the webs; push a wire into the tunnel, or squirt in kerosene with a syringe; seal the hole with mud',
    why: 'Bark-eating caterpillar',
    windows: BOTH,
  },
  {
    key: 'shoot_borer',
    title: 'Clip shoot tips with shoot borer',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Shoot tips wilt in Sep–Oct (shoot borer)',
    organic: 'Clip and destroy them',
    why: 'Shoot borer',
    windows: {
      E: [
        [9, 1],
        [10, 31],
      ],
      N: [
        [9, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'leaf_roller',
    title: 'Pick off rolled leaves',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves rolled with caterpillars inside (leaf roller)',
    organic: 'Pick off the rolled leaves',
    why: 'Leaf roller',
    windows: BOTH,
  },
  {
    key: 'nut_borer',
    title: 'Clear fallen fruit against nut borer',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fruits have pin-holes at the stalk (nut borer)',
    organic:
      'Clear all fallen and dried fruit and dig the basin lightly after harvest',
    why: 'Nut borer',
    windows: { N: ALL_YEAR },
  },
  {
    key: 'leaf_weevil',
    title: 'Shake off leaf-cutting weevils',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Beetles cut leaf edges (leaf-cutting weevil)',
    organic:
      'Shake the branches over an upturned umbrella and drop the beetles into soapy water',
    why: 'Leaf-cutting weevil',
    windows: BOTH,
  },
  {
    key: 'boron',
    title: 'Spray boric acid for misshapen fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruits are misshapen (boron)',
    organic:
      'Spray boric acid 1 g per litre (0.1%). Wear gloves; it is a nutrient, so there is no waiting period',
    why: 'Boron shortage',
    windows: BOTH,
  },
  {
    key: 'anthracnose',
    title: 'Clean up against anthracnose',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves and twigs have dark sunken spots (anthracnose)',
    organic:
      'Collect and burn diseased leaves, twigs and fruit, and thin crowded branches',
    why: 'Anthracnose',
    windows: BOTH,
  },
  {
    key: 'water_young',
    title: 'Water the young tree often in the dry months',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Dry months',
    organic:
      'Young trees need frequent watering in the dry months (no interval in the source)',
    why: 'Young roots dry out fast',
    windows: { E: ALL_YEAR },
  },
  {
    key: 'planting_site',
    title: "Don't plant where water stands",
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Choosing where to plant',
    organic: "Don't plant where water stands",
    why: 'Litchi wilt follows waterlogging',
    windows: BOTH,
  },
];

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_manure',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in September, half the urea in mid-February, the other half after the local litchi harvest',
    dose: MANURE_SSP_MOP_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      E: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'feed_young_manure',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    // The table's "as bearing rows 3, 8, 9", written out.
    organic:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in December, half the urea in mid-February, the other half in mid-April',
    dose: MANURE_SSP_MOP_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      N: [
        [12, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'feed_young_urea',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in September, half the urea in mid-February, the other half after the local litchi harvest',
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      E: [
        [
          [2, 10],
          [2, 20],
        ],
        [
          [6, 15],
          [7, 15],
        ],
      ],
    },
  },
  {
    key: 'feed_young_urea',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in December, half the urea in mid-February, the other half in mid-April',
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      N: [
        [
          [2, 10],
          [2, 20],
        ],
        [
          [4, 10],
          [4, 20],
        ],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'Weekly from September to March, twice a week from April to June; mulch with straw',
    why: 'Young roots dry out fast',
    windows: {
      N: [
        [9, 15],
        [6, 30],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover against frost',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic:
      'Cover with thatch or sarkanda by the end of November, for the first 4–5 years',
    why: 'Frost kills young litchi plants',
    windows: {
      E: [
        [11, 25],
        [1, 31],
      ],
      N: [
        [11, 25],
        [1, 31],
      ],
    },
  },
  {
    key: 'dhaincha',
    title: 'Sow dhaincha around the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic:
      'Sow dhaincha in the basin. It shades the tree by mid-April and can be tied around it for winter frost cover. Root-prune it 3–4 times a year',
    why: 'Shade in summer, frost cover in winter',
    windows: {
      N: [
        [2, 10],
        [2, 25],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'harvest',
    avoid: ['Pulling single fruits', 'Picking before fully red'],
    watch: ['Fruit borer', 'Fruit rot'],
    // E: the table's mid-May–mid-Jun, as whole months.
    months: { E: [5, 6], N: [6, 6] },
  },
  {
    phase: 'post_harvest_flush',
    avoid: ['Heavy pruning (light only; heavy is for old trees)'],
    watch: [
      'Mite (peaks Jul–Oct)',
      'Leaf roller in the rains',
      'Shoot borer (Sep–Oct)',
    ],
    months: { E: [6, 9], N: [7, 9] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Deep digging outside Nov–Feb'],
    watch: ['Mite on the new flush', 'Mealybug nymphs climbing (Dec–Jan)'],
    months: { E: [10, 1] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Deep digging outside Nov–Feb'],
    watch: [
      'Mite on the new flush',
      'Mealybug nymphs climbing (Dec–Jan)',
      'Frost',
    ],
    months: { N: [10, 1] },
  },
  {
    phase: 'flowering',
    avoid: [
      'Spraying in full bloom (bees)',
      'Water stress at flowering, so start watering again once flower bunches show',
    ],
    watch: ['Mite on flower bunches (Feb–Mar)', 'Litchi bug'],
    months: { E: [2, 3] },
  },
  {
    phase: 'flowering',
    avoid: ['Spraying in full bloom (bees)'],
    watch: ['Mite on flower bunches (Feb–Mar)', 'Litchi bug'],
    months: { N: [2, 3] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Dry soil then heavy watering (cracking)'],
    watch: ['Fruit borer (Apr–May)', 'Cracking', 'Sunburn (above 40 °C)'],
    months: { E: [3, 5], N: [4, 6] },
  },
  {
    phase: 'establishment',
    stages: ['YOUNG'],
    avoid: ['Waterlogging', 'Hot wind and frost on unprotected plants'],
    watch: ['Termites', 'Wilt'],
    months: { E: [1, 12], N: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const LITCHI_CARE: FamilyCare = {
  family: 'litchi',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'ICAR-NRC Litchi web pages (nrclitchi.org.in)',
    'PAU Package of Practices for Fruit Crops',
    'National Horticulture Board litchi pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for litchi',
  ],
  grownIn: ['EAST_INDIA', 'NORTH_INDIA'],
  regions: {
    EAST_INDIA: regionCare('E'),
    NORTH_INDIA: regionCare('N'),
  },
};
