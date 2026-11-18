import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type {
  CareKind,
  Dose,
  FamilyCare,
  RegionCare,
} from '../../domain/tree-care';

/**
 * Citrus care by kind, transcribed from the source-checked draft approved on
 * 2026-11-18 with every recommendation (docs/plant-care/citrus.md; review doc
 * "Citrus care by kind — owner review"). Change it only through the add-plant
 * playbook: source check, then the owner's yes.
 *
 * NORTH = North India, from PAU (Punjab). SOUTH = South Deccan, from TNAU
 * (Tamil Nadu), for acid lime and sweet orange only. Every other region is
 * pending: its trees keep the season pack. A citrus tree of no known kind
 * (just "nimbu") gets no care. Chemicals are listed only with a citrus label
 * claim, a per-litre dose and a waiting period (CIB&RC MUP to 30.09.2026).
 */
// Every region a kind has no checked care for is pending (approved doc §5), even
// outside its grownIn: otherwise the engine would lend it the nearest region's care.
type Group = 'NORTH' | 'SOUTH';
type Kind = 'lime' | 'lemon' | 'mandarin' | 'sweet_orange';
type Item = ItemSpec<Group> & { kinds?: Kind[] };

/** PAU p.21: Kinnow, per year of age up to 8 years. */
const MANDARIN_FYM: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [],
  maxAgeYears: 8,
};
const MANDARIN_UREA: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 120 }],
  maxAgeYears: 8,
};
/** PAU p.21: lime, lemon and sweet orange come as age bands, not per year. */
const FYM_BANDS =
  '5–20 kg at 1–3 years, 25–50 kg at 4–6, 60–90 kg at 7–9, 100 kg from 10 years';
const UREA_BANDS =
  '110–330 g a year at 1–3 years, 440–550 g at 4–6, 660–880 g at 7–9, 880–1760 g from 10 years';
const BORDEAUX_PASTE =
  'Bordeaux paste (200 g copper sulphate in 1.5 L water, 300 g quicklime in 1.5 L, mixed); wear gloves';
const SPOTS_CHEMICAL =
  'Copper sulphate 47.15% + mancozeb 30% WDG 5 g per litre; wear gloves; not within 10 days of picking';
const PSYLLA_CHEMICAL =
  'Thiamethoxam 25 WG 0.1 g per litre (1 g in 10 L); spray in the evening, not on open flowers; wear gloves; not within 20 days of picking';
const LEAF_MINER_CHEMICAL =
  'Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC 0.3 ml per litre; wear gloves; not within 10 days of picking';

const OTHERS: Kind[] = ['lime', 'lemon', 'sweet_orange'];
const month = (
  m: number,
  from = 1,
  to?: number,
): [[number, number], [number, number]] => [
  [m, from],
  // February counts 29, as in build.ts, so a leap day is never uncovered.
  [m, to ?? (m === 2 ? 29 : new Date(Date.UTC(2026, m, 0)).getUTCDate())],
];

const NORTH_ITEMS: Item[] = [
  {
    key: 'manure',
    kinds: ['mandarin'],
    title: "Spread the year's manure under the tree",
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "All the year's FYM in the basin under the canopy, forked in lightly: 10 kg per year of age, up to 8 years",
    dose: MANDARIN_FYM,
    why: 'Manure goes in during the winter rest, before spring growth',
    windows: { NORTH: month(12) },
  },
  {
    key: 'manure',
    kinds: OTHERS,
    title: "Spread the year's manure under the tree",
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: `All the year's FYM in the basin under the canopy, forked in lightly: ${FYM_BANDS}`,
    why: 'Manure goes in during the winter rest, before spring growth',
    windows: { NORTH: month(12) },
  },
  {
    key: 'first_feed',
    kinds: ['mandarin'],
    title: 'Give the first feed before new growth',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "Half the year's urea in the basin, plus SSP from the 4th year (1.37–2.4 kg at 4–7 years, 2.73 kg from 8); water in; wear gloves",
    dose: MANDARIN_UREA,
    why: 'Feeds the spring flush and the flowers',
    windows: { NORTH: month(2) },
  },
  {
    key: 'first_feed',
    kinds: OTHERS,
    title: 'Give the first feed before new growth',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical: `Half the year's urea in the basin (${UREA_BANDS}); water in; wear gloves`,
    why: 'Feeds the spring flush and the flowers',
    windows: { NORTH: month(2) },
  },
  {
    key: 'second_feed',
    kinds: ['mandarin'],
    title: 'Give the second feed after fruit set',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's urea in the basin; water in; wear gloves",
    dose: MANDARIN_UREA,
    why: 'Feeds the young fruit',
    windows: {
      NORTH: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  {
    key: 'second_feed',
    kinds: OTHERS,
    title: 'Give the second feed after fruit set',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's urea in the basin; water in; wear gloves",
    why: 'Feeds the young fruit',
    windows: {
      NORTH: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  {
    key: 'prune',
    kinds: OTHERS,
    title: 'Prune out dead and diseased twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic: `Cut dead, dried and diseased twigs back to healthy wood, open up the centre and burn the prunings; seal cuts with ${BORDEAUX_PASTE}`,
    why: 'Stops die-back spreading and lets light in',
    windows: {
      NORTH: [
        [1, 1],
        [2, 29],
      ],
    },
  },
  {
    key: 'prune',
    kinds: ['mandarin'],
    title: 'Prune out dead and diseased twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic: `After picking, cut dead, dried and diseased twigs back to healthy wood, open up the centre and burn the prunings; seal cuts with ${BORDEAUX_PASTE}`,
    why: 'Stops die-back spreading and lets light in',
    windows: { NORTH: month(2) },
  },
  {
    key: 'bordeaux_spray',
    kinds: ['mandarin', 'sweet_orange'],
    title: 'Spray Bordeaux mixture after pruning',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      "Bordeaux mixture 2:2:250: 8 g copper sulphate and 8 g quicklime per litre, each dissolved in half the water, then the copper poured into the lime while stirring; skip it if fruit is still on the tree, and don't spray in rain or in great heat; wear gloves",
    why: 'Protects cuts and the new flush from die-back',
    windows: { NORTH: month(3) },
  },
  {
    key: 'summer_water',
    title: 'Water every 2–3 weeks in the hot months',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Water every 2–3 weeks into a ring basin so water doesn't touch the trunk; don't flood",
    why: 'Dry soil after fruit set sheds flowers and fruit',
    windows: {
      NORTH: [
        [4, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'psylla',
    title: 'Spray against citrus psylla',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    organic: 'Pinch off and destroy curled new shoots carrying nymphs',
    chemical: PSYLLA_CHEMICAL,
    why: 'Psylla sucks the new shoots and spreads greening disease',
    windows: { NORTH: [month(3), month(9, 1, 10)] },
  },
  {
    key: 'leaf_miner',
    title: 'Spray young trees for leaf miner',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic: 'Pick off and burn leaves with silvery tunnels',
    chemical: LEAF_MINER_CHEMICAL,
    why: 'Tunnels curl young leaves and open the way for canker',
    windows: {
      NORTH: [
        [
          [4, 1],
          [5, 31],
        ],
        [
          [8, 1],
          [9, 30],
        ],
      ],
    },
  },
  {
    key: 'canker',
    kinds: ['lime'],
    title: 'Spray lime trees against canker',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    organic: 'Cut out and burn twigs with canker spots',
    chemical: SPOTS_CHEMICAL,
    why: 'Kagzi lime is highly susceptible: corky spots on leaves and fruit',
    windows: { NORTH: [month(10), month(12), month(2)] },
  },
  {
    key: 'fallen_fruit',
    kinds: ['mandarin', 'sweet_orange'],
    title: 'Collect and bury fallen fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'From now until picking, collect stung or fallen fruit and bury it deep',
    why: 'Flies sting fruit at colour break; the fruit rots and drops',
    windows: { NORTH: month(8, 8, 14) },
  },
  {
    key: 'pick_kinnow',
    kinds: ['mandarin'],
    title: 'Pick Kinnow with clippers',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      "Clip the fruit with a short button stalk; don't pull. Don't pick in dew or just after rain; outer fruit first",
    why: 'Pulling tears the skin and the fruit rots',
    windows: {
      NORTH: [
        [1, 15],
        [2, 15],
      ],
    },
  },
  {
    key: 'potassium_nitrate',
    kinds: ['mandarin'],
    title: 'Spray potassium nitrate for bigger fruit',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical:
      'Potassium nitrate 10 g per litre (1%); a fertiliser, so no waiting days; wear gloves',
    why: 'Bigger fruit and a higher yield',
    windows: { NORTH: [month(5, 21), month(6, 21), month(7, 21)] },
  },
  {
    key: 'thin_young',
    kinds: ['mandarin'],
    title: 'Thin fruit on young Kinnow trees',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic:
      'Soon after fruit set in the 3rd and 4th year, thin heavy loads (400–500 fruits is too many)',
    why: 'An over-loaded young tree can die',
    windows: { NORTH: month(5) },
  },
  // Shown on the plant page when the gardener sees the problem; never reminders.
  {
    key: 'gummosis',
    title: 'Treat gum oozing from the trunk',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Gum oozing from the trunk base, cracked bark, pale leaves',
    organic: `Keep water off the trunk with a ring basin; don't flood or hoe deep; scrape the lesion clean and cover it with ${BORDEAUX_PASTE}`,
    chemical:
      'Cymoxanil 8% + mancozeb 64% WP: drench 2.5 g per litre, 10 L per tree, or paint the lesion with 25 g per litre of linseed oil; wear gloves; not within 82 days of picking',
    why: 'A soil fungus rots the bark at the collar',
    windows: {
      NORTH: [
        [
          [2, 1],
          [3, 31],
        ],
        [
          [7, 1],
          [8, 31],
        ],
      ],
    },
  },
  {
    key: 'zinc_manganese',
    title: 'Spray zinc and manganese on the leaves',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Mottled leaves, or small narrow "little leaf"',
    organic: '',
    chemical:
      'Zinc sulphate 4.7 g + manganese sulphate 3.3 g per litre on fully grown flush leaves; keep a week from any Bordeaux spray; a fertiliser, so no waiting days; wear gloves',
    why: 'Corrects a zinc and manganese shortage',
    windows: { NORTH: [month(4, 20), month(8, 10, 20)] },
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillars',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Webbing and chewed bark on the trunk',
    organic: 'Pull off the webbing and push kerosene into the holes',
    why: 'The caterpillar tunnels into the bark',
    windows: {
      NORTH: [
        [
          [9, 1],
          [10, 31],
        ],
        [
          [1, 1],
          [2, 29],
        ],
      ],
    },
  },
  {
    key: 'mites',
    title: 'Spray against mites',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fine specks and dusty-looking leaves',
    organic: '',
    chemical:
      'Diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days of picking',
    why: 'Mites suck the leaves pale',
    windows: {
      NORTH: [
        [
          [5, 1],
          [6, 30],
        ],
        [
          [8, 1],
          [9, 30],
        ],
      ],
    },
  },
  {
    key: 'mealybug',
    title: 'Clear mealybugs',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'White cottony clusters on shoots and fruit',
    organic:
      'Keep branches off the ground, prune and destroy infested shoots, destroy ant nests; or spray Verticillium lecanii 1.15% WP about 4.5 g per litre; wear gloves',
    why: 'Mealybugs suck sap and bring sooty mould',
    windows: {
      NORTH: [
        [7, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'canker_spots',
    kinds: ['lemon', 'mandarin', 'sweet_orange'],
    title: 'Cut out canker spots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Corky raised spots on leaves, twigs or fruit',
    organic: 'Cut out and burn spotted twigs before the monsoon',
    chemical: `If it spreads: ${SPOTS_CHEMICAL}`,
    why: 'Canker spreads in rain and through leaf miner tunnels',
    // "Before the monsoon"
    windows: {
      NORTH: [
        [5, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'fruit_drop',
    title: 'Cut down fruit drop',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruit dropping before it ripens',
    organic:
      'Destroy dried fruit left on the tree, bury fallen fruit deep, prune and feed on schedule, and keep water from standing in the basin',
    why: 'Disease and water stress cause most fruit drop',
    windows: { NORTH: ALL_YEAR },
  },
  {
    key: 'fruit_fly_trap',
    kinds: ['mandarin', 'sweet_orange'],
    title: 'Hang a fruit fly trap',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fruit with sting marks, rotting at colour break',
    organic:
      'Hang a PAU fruit fly trap 1–1.5 m up in shade until picking; recharge it if fresh damage appears. PAU says traps work less well in home gardens than in orchards',
    why: 'Flies sting fruit at colour break; the fruit rots and drops',
    // Second week of August until picking (Valencia, the last, in March)
    windows: {
      NORTH: [
        [8, 8],
        [3, 31],
      ],
    },
  },
  {
    key: 'young_water',
    title: 'Water a young tree every week',
    category: 'WATERING',
    stages: ['YOUNG'],
    conditional: 'A young tree, up to 3–4 years old',
    organic: 'Water every week into a ring basin, off the trunk',
    why: 'Young roots dry out fast',
    windows: { NORTH: ALL_YEAR },
  },
];

const SOUTH_LIME_ITEMS: Item[] = [
  {
    key: 'main_feed',
    title: 'Feed manure, P, K and half the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "The year's FYM (10 kg in year 1, 5 kg more each year, 30 kg from year 6) with Pseudomonas 20 g and VAM 200 g, mixed into the basin",
    chemical:
      "All the year's P and K and half the N in the basin (N 200 g in year 1, +100 g a year, 600 g from year 6; P₂O₅ 100 g, +25 g, 200 g; K₂O 100 g, +40 g, 300 g); water in; wear gloves",
    why: 'The main feed, after the monsoon flush',
    windows: { SOUTH: month(10) },
  },
  {
    key: 'second_feed',
    title: 'Give the second half of the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's N in the basin; water in; wear gloves",
    why: 'Feeds the spring flush',
    windows: { SOUTH: month(3) },
  },
  {
    key: 'zinc_spray',
    title: 'Spray zinc on the new flush',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      'Zinc sulphate 5 g per litre (0.5%) once the new flush has opened; a fertiliser, so no waiting days; wear gloves',
    why: 'Prevents little leaf and twig die-back',
    windows: { SOUTH: [month(3), month(7), month(10)] },
  },
  {
    key: 'psylla',
    title: 'Spray against citrus psylla',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Curled new shoots with psylla nymphs',
    organic: 'Pinch off and destroy curled new shoots carrying nymphs',
    chemical: PSYLLA_CHEMICAL,
    why: 'Psylla sucks the new shoots and spreads greening disease',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'leaf_miner',
    title: 'Spray for leaf miner',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silvery tunnels in young leaves',
    organic: 'Pick off and burn leaves with silvery tunnels',
    chemical: LEAF_MINER_CHEMICAL,
    why: 'Tunnels curl young leaves and open the way for canker',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'rust_mite',
    title: 'Spray against rust mite',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Rusty, bronzed fruit skin',
    organic: '',
    chemical:
      'Diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days of picking',
    why: 'Mites scar the fruit skin',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'mealybug',
    title: 'Clear mealybugs',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'White cottony clusters on shoots and fruit',
    organic:
      'Debark infested branches, tie a 5 cm sticky band on fruiting shoots; or spray Verticillium lecanii 1.15% WP 5 g per litre; wear gloves',
    why: 'Mealybugs suck sap and bring sooty mould',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'canker',
    title: 'Cut out canker spots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Corky raised spots on leaves, twigs or fruit',
    organic: 'Cut out and burn spotted twigs',
    chemical: SPOTS_CHEMICAL,
    why: 'Canker spreads in rain and through leaf miner tunnels',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'twig_blight',
    title: 'Cut back dried twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    conditional: 'Twigs drying back from the tip',
    organic: 'Cut each dried twig back with 2–3 cm of green wood and burn it',
    why: 'Stops the blight spreading down the twig',
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'young_water',
    title: 'Water a young tree regularly',
    category: 'WATERING',
    stages: ['YOUNG'],
    conditional: 'A young tree',
    organic:
      'Water every 8–10 days after the monsoon and every 5–7 days in summer into a ring basin, with no water standing; remove side branches on the main stem up to 45 cm',
    why: 'Young roots dry out fast; a clear stem gives a strong frame',
    windows: { SOUTH: ALL_YEAR },
  },
];

const SOUTH_SWEET_ORANGE_ITEMS: Item[] = [
  {
    key: 'main_feed',
    title: 'Feed manure, P, K and half the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "The year's FYM in the basin 70 cm from the trunk, mixed in: 10 kg in year 1, 5 kg more each year, 30 kg from year 6",
    chemical:
      "All the year's P and K and half the N (N 200 g in year 1, +100 g a year, 600 g from year 6; P 100 g, +20 g, 200 g; K 100 g, +40 g, 300 g); water in; wear gloves",
    why: 'The main feed, after the monsoon flush',
    windows: { SOUTH: month(10) },
  },
  {
    key: 'second_feed',
    title: 'Give the second half of the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's N in the basin; water in; wear gloves",
    why: 'Feeds the spring flush',
    windows: { SOUTH: month(3) },
  },
];

const PHASES = (kind: Kind): PhaseSpec<Group>[] => {
  const mandarin = kind === 'mandarin';
  return [
    {
      phase: 'winter_rest',
      months: { NORTH: mandarin ? [12, 12] : [12, 1] },
      avoid: ['Heavy pruning in active growth'],
      watch: ['Bark-eating caterpillar'],
    },
    ...(mandarin
      ? [
          {
            phase: 'harvest',
            months: { NORTH: [1, 2] as [number, number] },
            avoid: ['Pulling fruit off', 'Picking in dew or after rain'],
            watch: ['Fruit drop'],
          },
        ]
      : []),
    {
      phase: 'spring_flush_and_flowering',
      months: { NORTH: mandarin ? [3, 4] : [2, 4] },
      avoid: [
        'Water stress before sprouting and after fruit set',
        'Insecticide on open flowers',
      ],
      watch: ['Psylla', 'Aphids', 'Thrips', 'Leaf miner'],
    },
    {
      phase: 'summer',
      months: { NORTH: [5, 6] },
      avoid: ['Letting the basin dry out', 'Flood irrigation'],
      watch: ['Mites', 'Leaf miner'],
    },
    {
      phase: 'monsoon',
      months: { NORTH: [7, 9] },
      avoid: ['Water standing in the basin or touching the trunk'],
      watch: ['Gummosis', 'Scab and melanose', 'Mealybug', 'Fruit fly'],
    },
    {
      phase: 'autumn',
      months: { NORTH: [10, 11] },
      avoid: ['Flood irrigation'],
      watch: kind === 'lime' ? ['Leaf miner', 'Canker'] : ['Leaf miner'],
    },
  ];
};

const SOUTH_LIME_PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'year_round_bearing',
    months: { SOUTH: [1, 12] },
    avoid: ['Water standing in the basin or touching the trunk'],
    watch: [
      'Psylla and leaf miner on each new flush (Jun–Jul, Sep–Oct, Jan–Feb)',
      'Canker in the rains',
    ],
  },
];

const north = (kind: Kind): RegionCare =>
  groupCare(
    'NORTH',
    NORTH_ITEMS.filter((i) => !i.kinds || i.kinds.includes(kind)).map(
      ({ kinds: _k, ...item }) => item,
    ),
    PHASES(kind),
  );
const south = (items: Item[], phases: PhaseSpec<Group>[]): RegionCare =>
  groupCare('SOUTH', items, phases);

const KINDS: CareKind[] = [
  {
    key: 'lime',
    words: [
      'kagzi',
      'kagzi lime',
      'kagzi nimbu',
      'kaghzi',
      'kagji',
      'acid lime',
      'tahiti lime',
      'lime',
      'कागज़ी',
      'कागजी',
    ],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
    ],
    regions: {
      NORTH_INDIA: north('lime'),
      SOUTH_DECCAN: south(SOUTH_LIME_ITEMS, SOUTH_LIME_PHASES),
    },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'lemon',
    words: [
      'baramasi',
      'seedless lemon',
      'galgal',
      'hill lemon',
      'pahadi nimbu',
      'assam lemon',
      'kaji nemu',
      'बारामासी',
      'गलगल',
      'पहाड़ी नींबू',
    ],
    varietyWords: ['eureka'],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
    regions: { NORTH_INDIA: north('lemon') },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'mandarin',
    words: ['kinnow', 'kinnu', 'mandarin', 'murcott', 'किन्नू', 'किन्नो'],
    varietyWords: [
      'nagpur',
      'nagpuri',
      'darjeeling',
      'khasi',
      'coorg',
      'kodai',
      'daisy',
      'नागपुरी',
      'नागपुर',
      'दार्जिलिंग',
      'खासी',
    ],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'HILLS_COOL',
    ],
    regions: { NORTH_INDIA: north('mandarin') },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'sweet_orange',
    words: [
      'mosambi',
      'mausambi',
      'musambi',
      'mosumbi',
      'sweet orange',
      'malta',
      'blood red',
      'blood orange',
      'sathgudi',
      'sathukudi',
      'batavian',
      'sweet lime',
      'मौसंबी',
      'मोसंबी',
      'मुसम्मी',
      'माल्टा',
    ],
    // मौसमी also means "seasonal": only a variety or species saying it counts.
    varietyWords: ['jaffa', 'valencia', 'मौसमी'],
    grownIn: ['NORTH_INDIA', 'WEST_INDIA', 'SOUTH_DECCAN', 'HILLS_COOL'],
    regions: {
      NORTH_INDIA: north('sweet_orange'),
      SOUTH_DECCAN: south(SOUTH_SWEET_ORANGE_ITEMS, []),
    },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
];

export const CITRUS_CARE: FamilyCare = {
  family: 'citrus',
  sources: [
    'PAU Package of Practices for Cultivation of Fruit Crops (citrus pp.13–34), pau.edu',
    'TNAU Crop Production Guide, Horticulture Crops 2020 (acid lime, sweet orange), agritech.tnau.ac.in',
    'NIPHM AESA based IPM package, Citrus, niphm.gov.in',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  // All of citrus care is in its kinds; a tree of no known kind keeps the season pack.
  grownIn: [],
  regions: {},
  kinds: KINDS,
  // Different plants that share the word "lime": no acid-lime care for them.
  noKindWords: ['kaffir', 'makrut'],
};
