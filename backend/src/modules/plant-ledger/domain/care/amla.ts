import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from './types';

/**
 * Amla (aonla) care, transcribed from the source-checked table approved by the
 * owner on 2026-11-12 (docs/plant-care/amla.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * One timing group: A = North, from ICAR-CISH's month-by-month calendar for
 * the subtropical belt. Central and East are pending: they were inferred
 * copies of the North with no source of their own.
 *
 * Dose: CISH, per year of age up to 10 years, split as NHB gives it. No
 * pesticide has an aonla label claim, so there are no chemical sprays.
 */
type Group = 'A';

/** Row 2 (Jan–Feb): FYM 5 kg + urea 110 g + SSP 310 g + MOP 85 g × age. */
const MAIN_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 310 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};
/** Row 5 (Jul–Aug): urea 110 g + MOP 85 g × age. */
const SECOND_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'prune',
    title: 'Prune dry, diseased and galled shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut out dry, diseased, insect-hit, broken and crossing branches and swollen shoot galls; burn the prunings. Bearing trees need no other pruning',
    why: 'Clears borer and gall-maker hiding places before new growth',
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Dig the basin and give the main feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "Dig the basin. Spread all the year's FYM in a ring 1–1.5 m from the trunk and mix it 15–20 cm into the soil; water lightly afterwards",
    chemical:
      "Half the year's urea + all the SSP + half the MOP in the same ring; wear gloves",
    dose: MAIN_DOSE,
    why: 'Feeds the spring flush; digging exposes stone borer and fruit midge larvae resting in the soil',
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water while it flowers',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: "Don't water bearing trees, and keep the basin from staying wet",
    why: 'Excess moisture at bloom hurts flowering',
    windows: {
      A: [
        [3, 10],
        [4, 30],
      ],
    },
  },
  {
    key: 'summer_water',
    title: 'Water every 15–20 days in dry summer',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      'Water the ring basin every 15–20 days until the monsoon; mulch after watering with paddy straw or dry grass',
    why: 'Small fruits sit dormant now; a little moisture stops them dropping',
    windows: {
      A: [
        [5, 1],
        [6, 20],
      ],
    },
  },
  {
    key: 'second_feed',
    title: 'Give the second feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is empty; the app always shows an organic line.
    organic: "None now: all the year's FYM went in with the main feed",
    chemical:
      'Other half of the urea + other half of the MOP in the ring; water in if there is no rain; wear gloves',
    dose: SECOND_DOSE,
    why: 'Feeds fruit growth. CISH says July, NHB says August',
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
    },
  },
  {
    key: 'keep_moist',
    title: 'Keep the basin moist as fruit swells',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'If the rains break, water the basin so it never dries out',
    why: 'Fruit grows fastest now',
    windows: {
      A: [
        [8, 15],
        [9, 30],
      ],
    },
  },
  {
    key: 'borax_spray',
    title: 'Spray borax against browning inside fruit',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      'Borax 6 g per litre (0.6%), 2–3 sprays 10–15 days apart; wear gloves. A nutrient spray, not a pesticide: no waiting period is set, and the last spray falls before picking',
    why: 'Boron shortage turns the flesh brown and corky (mostly Banarasi and Francis; Chakaiya, NA-6 and NA-7 resist)',
    windows: {
      A: [
        [9, 1],
        [10, 15],
      ],
    },
  },
  {
    key: 'pick',
    title: 'Pick fruit as soon as it is fully mature',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'Pick by hand in the early morning or late evening, without dropping or scratching the fruit. Banarasi, Krishna and NA-10 ripen in Oct; Kanchan, NA-6 and NA-7 in Nov; Chakaiya in Dec',
    why: "Fruit left too long drops, and it cuts next year's crop. Scratched fruit gets blue mould",
    windows: {
      A: [
        [10, 15],
        [12, 31],
      ],
    },
  },
];

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Silk-and-sawdust webbing on bark with holes at branch joints (from April)',
    organic:
      'Scrape off the webbing, push a wire into each hole to kill the caterpillar, put a few drops of kerosene in the hole and seal it with wet mud',
    why: 'Bark-eating caterpillar',
    windows: { A: ALL_YEAR },
  },
  {
    key: 'shoot_gall',
    title: 'Cut and burn galled shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Shoot tips swell into galls',
    organic:
      "Cut the galled shoots after harvest and burn them; don't let branches crowd",
    why: 'Shoot gall maker',
    // Seen Oct–Nov.
    windows: {
      A: [
        [10, 1],
        [11, 30],
      ],
    },
  },
  {
    key: 'mealybug_aphid',
    title: 'Clip shoots with mealybugs or aphids',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'New shoots twist with white mealybugs or aphids and ants on them',
    organic: 'Clip off and destroy the infested shoots early',
    why: 'Mealybug and aphids',
    windows: { A: ALL_YEAR },
  },
  {
    key: 'leaf_roller',
    title: 'Clip rolled leaves',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves webbed together with a small caterpillar inside',
    organic: 'Clip the rolled leaves at the start and destroy them',
    why: 'Leaf roller',
    windows: { A: ALL_YEAR },
  },
  {
    key: 'pomegranate_butterfly',
    title: 'Pick off bored young fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Young fruits have bore holes with frass',
    organic:
      "Pick and destroy them. Don't grow pomegranate or guava right next to amla",
    why: 'Pomegranate butterfly',
    windows: {
      A: [
        [9, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'rust',
    title: 'Cut out rust-infected shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Reddish-brown pustules in rings on fruit or leaves',
    organic:
      'Cut out badly infected shoots and keep the canopy open. Banarasi and Chakaiya are fairly free of it. No fungicide has an aonla label claim',
    why: 'Rust',
    windows: {
      A: [
        [7, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'prop_branches',
    title: 'Prop branches under a heavy crop',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Branches split under a heavy crop (Lakshmi-52, NA-6, NA-7)',
    organic: 'Prop them in September',
    why: 'Branches split under a heavy crop',
    windows: {
      A: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'cross_pollination',
    title: 'Plant a second variety for fruit set',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'A lone tree flowers but sets little fruit',
    organic: 'Amla needs a second variety nearby for cross-pollination',
    why: 'Amla needs cross-pollination',
    windows: { A: ALL_YEAR },
  },
  {
    key: 'alkaline_soil',
    title: 'Add micronutrients on alkaline soil',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'The soil is alkaline (usar/sodic)',
    organic:
      'Mix borax, zinc sulphate and copper sulphate, 100 g each, into the January fertiliser ring, scaled to tree age and vigour; wear gloves. This is a soil nutrient dressing, not a spray',
    why: 'A soil nutrient dressing for usar/sodic soil',
    // The January fertiliser ring: the main feed's window.
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
];

const YOUNG_TEXT =
  'Same per-year-of-age dose as the bearing tree, in a ring mixed into the soil and watered lightly';

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_main',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: MAIN_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: SECOND_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree every 15–20 days',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'Every 15–20 days in March, regularly through April–June; clean the ring basin and mulch after watering',
    why: 'Young roots dry out fast',
    windows: {
      A: [
        [3, 1],
        [6, 20],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover the young tree against frost',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic:
      'Wrap with straw on all sides through Dec–Jan and take it off in the second week of Feb; water in cold spells and mulch the basin; a cow-dung paste on the trunk also helps',
    why: 'Frost on young trees',
    windows: {
      A: [
        [12, 1],
        [2, 14],
      ],
    },
  },
  {
    key: 'shape_young',
    title: 'Shape to 2–4 main branches',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Let the first branches start 0.75–1 m up; keep 2–4 wide-angled branches facing opposite ways and pinch off the rest (later years: 4–6 branches)',
    why: 'Wide-angled main branches',
    windows: {
      A: [
        [3, 1],
        [4, 30],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'pre_flowering',
    avoid: ['Leaving dead and galled wood on the tree'],
    watch: ['Frost on young trees'],
    months: { A: [1, 2] },
  },
  {
    phase: 'flowering',
    avoid: ['Watering bearing trees', 'A wet basin'],
    watch: ['Mealybug and aphids on new shoots'],
    months: { A: [3, 4] },
  },
  {
    phase: 'fruit_dormancy',
    avoid: ['Letting the basin go bone dry'],
    watch: ['Bark-eating caterpillar', 'Leaf roller', 'Fruitlet drop'],
    months: { A: [5, 6] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Waterlogging round the trunk'],
    watch: [
      'Rust',
      'Stone borer (pea-size fruit)',
      'Pomegranate butterfly',
      'Shoot gall',
    ],
    months: { A: [7, 9] },
  },
  {
    phase: 'harvest',
    avoid: ['Leaving ripe fruit on the tree', 'Bruising or dropping fruit'],
    watch: ['Fruit midge', 'Blue mould on bruised fruit'],
    months: { A: [10, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const AMLA_CARE: FamilyCare = {
  family: 'amla',
  sources: [
    'ICAR-CISH, Annual crop management practices in aonla, Indian Horticulture 70(1), 2025',
    'National Horticulture Board model project report, Aonla',
    'NHM IPM schedule for aonla pests (2012)',
    'NIPHM/DPPQS AESA-based IPM package for amla',
    'TNAU Agritech amla',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'CENTRAL_INDIA', 'EAST_INDIA'],
  pendingRegions: ['CENTRAL_INDIA', 'EAST_INDIA'],
  regions: {
    NORTH_INDIA: regionCare('A'),
  },
};
