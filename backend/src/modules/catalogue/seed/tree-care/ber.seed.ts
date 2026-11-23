import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Ber (Indian jujube) care, transcribed from the source-checked table approved
 * by the owner on 2026-11-24 with every recommendation
 * (docs/plant-care/ber.md, with a source for every row). Change it only
 * through the add-plant playbook.
 *
 * Owner decisions: no chemical sprays at all (carbendazim held, Q1); Bordeaux
 * paste on cuts only, no spray or drench (Q8); no Apple Ber kind (Q9); no
 * methyl eugenol traps (Q11). NORTH_INDIA = PAU, with PAU's per-year dose.
 * WEST_INDIA = CAZRI, Rajasthan (Q4), its banded feeds held (W5, W7, Q2).
 * SOUTH_DECCAN = TNAU (Q6) and EAST_INDIA = AAU, Assam (Q7, March pruning
 * derived): bearing trees get the flat manure as text, the fertiliser parts
 * are held and young trees get no calendar feed (Q3). TNAU's Jan–Mar
 * potassium nitrate (S3) is held. CENTRAL_INDIA and COASTAL_HUMID are pending:
 * no source found.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const BEARING = ['BEARING'] as TreeCareItem['stages'];
const YOUNG = ['YOUNG'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const cal = (
  from: [number, number],
  to: [number, number],
): Extract<Anchor, { kind: 'CALENDAR' }> => ({
  kind: 'CALENDAR',
  from,
  to,
});

/** NIPHM p.23: trench along the drip line. */
const TRENCH =
  'in a trench 20–30 cm deep and 30 cm wide along the drip line of the tree; cover with soil';
/** PAU p.10–11 Bordeaux paste, scaled down to 1/20. */
const PASTE =
  'Bordeaux paste (dissolve 100 g copper sulphate in 750 ml water; slake 150 g quicklime in another 750 ml; mix and stir; plastic or clay pot, never metal; use the same day)';
const KNO3 =
  'Potassium nitrate 15 g per litre (1.5%) on the leaves. Wear gloves; a fertiliser: no waiting period';

/** PAU p.68: 20 kg FYM per year of age, up to 5 years, all in May–June. */
const MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 20000 }],
  chemical: [],
  maxAgeYears: 5,
};
/** PAU p.68: 200 g urea per year of age up to 5 years, half in Jul–Aug, half after fruit set. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 100 }],
  maxAgeYears: 5,
};

/** "Only if you see it": plant page only, in every region with care. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'fruit_fly',
    title: 'Bury fruit with fruit-fly maggots',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Fruit with tiny holes and soft brown patches, maggots inside, fruit dropping',
    organic:
      'Pick up fallen and infested fruit every few days and bury it in a pit under a thick layer of soil. Pick fruit when full size but still firm, not left to ripen soft on the tree. Turn the soil under the tree in summer to expose the pupae. Umran is tolerant',
    why: 'Fruit-fly maggots spoil the fruit and the next generation pupates in the soil',
  },
  {
    key: 'powdery_mildew',
    title: 'Pick off leaves and fruit white with mildew',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'White powder on young leaves, flowers and small fruit; fruit turns brown, corky or cracked and drops',
    organic:
      'Pick off and destroy the white-coated leaves, shoots and fruit, and rake up what has fallen. When planting again, choose a resistant variety: Sanaur-2 in Punjab, or Safeda Selected or Dhaka. Umran and Wallaiti are susceptible',
    why: 'Mildew on flowers and young fruit makes them drop or crack',
  },
  {
    key: 'fruit_leaf_spots',
    title: 'Remove fruit and leaves with dark spots',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Small black sunken spots on fruit (worst Feb–Mar), or brown spots spreading over leaves that dry and fall',
    organic:
      "Pick off and destroy spotted fruit and leaves; rake up fallen ones. Don't plant in a low spot that floods. Don't wait for the tree to wilt before watering",
    why: 'Spots spread from fallen leaves and fruit',
  },
  {
    key: 'suckers',
    title: 'Rub out shoots from below the graft',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots from the trunk below the bud union or from the roots',
    organic:
      'Remove them as soon as they appear. Keep the trunk clear to 75 cm (40–50 cm in Assam)',
    why: 'Shoots from the rootstock take over and bear poor fruit',
  },
  {
    key: 'lac_insect',
    title: 'Scrape lac insect off the twigs',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Hard, reddish, crusty coating on twigs',
    organic:
      'Cut out the dried, infested twigs and scrape the crust off the rest',
    why: 'Lac insect sucks sap and dries the twigs',
  },
  {
    key: 'caterpillars',
    title: 'Pick off leaves with caterpillars and eggs',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves and young fruit scraped or eaten; clusters of hairy caterpillars or egg masses',
    organic:
      'Pluck the leaves with egg masses and young caterpillars while they are still in groups, and destroy them',
    why: 'Caught in groups, they are removed before they spread over the tree',
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillar from the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Webbing of chewed wood and droppings on the bark, with holes, often at branch joints',
    organic:
      'Clear the webbing. Mix 100 ml kerosene and 10 g soap in 900 ml water and squirt it into each hole. Wear gloves',
    why: 'The caterpillar tunnels into the trunk and weakens branches',
  },
  {
    key: 'dieback',
    title: 'Cut out dying twigs and paste the cuts',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Twigs dying back from the tip; dead, broken or crossing branches',
    organic: `Cut about 8 cm below the dead part, into healthy wood. Paste the cut with cow dung or ${PASTE}. Burn the cut twigs. Wear gloves`,
    why: 'Dead wood lets disease into the healthy branches',
  },
  {
    key: 'fruit_borer',
    title: 'Destroy fruit bored by caterpillars',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional: 'Fruit with a hole and droppings, or a stone eaten out',
    organic:
      'Collect and destroy bored fruit, including fallen ones. Remove wild ber bushes near the tree. Pick fruit as soon as it is mature',
    why: 'The borer breeds in fallen fruit and wild ber',
  },
  {
    key: 'train_young',
    title: 'Train the young tree to 4–5 main branches',
    category: 'PRUNING',
    stages: YOUNG,
    when: ALL_YEAR,
    conditional: 'A newly planted tree',
    organic:
      'Head the main stem back at 75 cm after planting. Keep 4–5 well-spaced side branches, and remove low branches that would touch the ground',
    why: 'A strong open frame carries heavy crops',
  },
];

/** C4: only in regions with no dated water row (SOUTH_DECCAN, EAST_INDIA). */
const EVEN_WATER: TreeCareItem = {
  key: 'even_water',
  title: 'Water every 2–3 weeks while fruit sets',
  category: 'WATERING',
  stages: BEARING,
  when: ALL_YEAR,
  conditional: 'Fruit is setting',
  organic:
    'Water the basin every 2–3 weeks from flowering until the fruit colours; never let it dry hard. Stop about 15 days before the fruit ripens. Mulch the basin with straw',
  why: 'Even water holds the young fruit and sizes it up',
};

const phase = (
  from: [number, number],
  to: [number, number],
  name: string,
  avoid: string[],
  watch: string[],
): PhaseWindow => ({
  when: cal(from, to),
  stages: BOTH,
  phase: name,
  avoid,
  watch,
});

const NORTH_INDIA: RegionCare = {
  items: [
    {
      key: 'prune_may',
      title: 'Prune the tree hard after the harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 16], [5, 31]),
      organic: `While the tree is bare and resting, cut each of last season's shoots back to 8 buds. Cut off low branches that spread on the ground, and thin, dry, broken and diseased branches. Brush ${PASTE} on every cut thicker than a finger. Wear gloves`,
      why: "Ber fruits only on the current season's shoots; hard pruning gives more and better fruit",
    },
    {
      key: 'manure_may',
      title: "Dig in the year's manure under the tree",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([5, 1], [6, 30]),
      organic: `Well-rotted FYM ${TRENCH}. Turn the soil under the canopy as you dig; it exposes fruit-fly pupae to the sun and birds`,
      dose: MANURE_DOSE,
      why: "The whole year's manure, given while the tree rests",
    },
    {
      key: 'urea_rains',
      title: "Give half the year's urea in the rains",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([7, 1], [8, 31]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the new shoots that will carry flowers',
    },
    {
      key: 'urea_fruit_set',
      title: 'Give the rest of the urea, then mulch',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([10, 1], [10, 31]),
      organic:
        'After the urea, spread a thick layer of paddy straw under the canopy (PAU: 5 t per acre)',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the setting fruit; the mulch keeps weeds down and the soil moist',
    },
    {
      key: 'water_fruit',
      title: 'Water every 3–4 weeks while fruit grows',
      category: 'WATERING',
      stages: BEARING,
      when: cal([10, 1], [2, 29]),
      organic:
        "Water the basin every 3–4 weeks, more often in a dry spell. Don't let the soil dry out hard while fruit is on the tree",
      why: 'Bigger, better fruit and less fruit drop',
    },
    {
      key: 'stop_water',
      title: 'Stop watering as the fruit starts to ripen',
      category: 'WATERING',
      stages: BEARING,
      when: cal([3, 16], [3, 31]),
      organic: 'Give no more water once the fruit starts to colour',
      why: 'Watering now delays ripening and spoils fruit on low branches',
    },
    {
      key: 'kno3_nov',
      title: 'Spray potassium nitrate for bigger fruit',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([11, 10], [11, 20]),
      organic: '',
      chemical: KNO3,
      why: 'Bigger fruit and a larger crop',
    },
    {
      key: 'kno3_jan',
      title: 'Spray potassium nitrate a second time',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([1, 10], [1, 20]),
      organic: '',
      chemical: KNO3,
      why: 'Bigger fruit and a larger crop',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [5, 1],
      [6, 30],
      'summer_rest',
      [],
      ['Fruit-fly pupae in the soil (rake it)'],
    ),
    phase(
      [7, 1],
      [9, 30],
      'new_growth',
      ['Tall or hungry crops under the tree (only gram, moong or mash)'],
      ['Leaf-eating caterpillars and lac insect on new shoots'],
    ),
    phase(
      [10, 1],
      [2, 29],
      'fruit_growth',
      ['Letting the soil dry out'],
      [
        'White powder on young leaves and fruit (Umran and Wallaiti are susceptible)',
        'Fruit-fly maggots',
      ],
    ),
    phase(
      [3, 1],
      [4, 30],
      'harvest',
      ['Watering after mid-March', 'Leaving fruit to over-ripen on the tree'],
      [
        'Black spots on fruit, worst in Feb–Mar',
        'Pick fruit firm to escape fruit fly',
      ],
    ),
  ],
};

const WEST_INDIA: RegionCare = {
  items: [
    {
      key: 'prune_may',
      title: 'Prune the tree hard after the harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 1], [5, 31]),
      organic: `While the tree is bare, cut the main branches back to the level of their 4th to 6th side shoots. Cut every side shoot off close to where it starts. Every year, cut out unwanted, diseased, dry and crossing branches at their base. Brush ${PASTE} on cuts thicker than a finger. Wear gloves`,
      why: 'Flowers and fruit come only on new shoots',
    },
    {
      key: 'turn_soil',
      title: 'Turn the soil under the tree for fruit fly',
      category: 'PROTECTION',
      stages: BOTH,
      when: cal([5, 1], [6, 30]),
      organic:
        'Dig over the soil under the canopy so the fruit-fly pupae hiding there are exposed to sun and birds',
      why: "Fewer flies reach next season's fruit",
    },
    {
      key: 'first_water',
      title: "Water if the rains haven't come by mid-June",
      category: 'WATERING',
      stages: BOTH,
      when: cal([6, 15], [6, 30]),
      organic:
        'If no rain has fallen by 15 June, start watering so new growth begins on time. Stop once the monsoon is steady',
      why: 'The tree wakes from its summer rest with the first water',
    },
    {
      key: 'water_flowering',
      title: 'Water lightly while the tree flowers',
      category: 'WATERING',
      stages: BEARING,
      when: cal([9, 1], [10, 15]),
      organic:
        'Give light waterings; flowers open from September and fruit has set by mid-October',
      why: 'Holds the flowers and young fruit without forcing leaf growth',
    },
    {
      key: 'water_fruit',
      title: 'Water every 15 days while fruit grows',
      category: 'WATERING',
      stages: BEARING,
      when: cal([10, 16], [2, 29]),
      organic:
        'Water every 15 days. Stop 15 days before your fruit ripens: Gola from mid-December, mid-season kinds from early January, Umran from late January',
      why: 'Fruit sizes up; stopping early makes it sweeter',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [1, 1],
      [3, 31],
      'harvest',
      ['Watering in the last 15 days before your fruit ripens'],
      ['Fruit-fly maggots in ripening fruit'],
    ),
    phase(
      [4, 1],
      [6, 14],
      'summer_rest',
      ['Watering the bare tree'],
      ['Fruit-fly pupae in the soil'],
    ),
    phase(
      [6, 15],
      [8, 31],
      'new_growth',
      [],
      ['Chafer beetles holing new leaves (Jun–Jul)'],
    ),
    phase(
      [9, 1],
      [10, 15],
      'flowering',
      ['Heavy watering'],
      ['White powder on leaves, twigs and flowers (Oct–Nov)'],
    ),
    phase(
      [10, 16],
      [12, 31],
      'fruit_growth',
      ['Letting the soil dry out'],
      [
        'White powder on leaves and fruit',
        'Brown leaf spots from November',
        'Frost on young trees in cold nights',
      ],
    ),
  ],
};

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'prune_feb',
      title: "Prune out last season's tired shoots",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([2, 1], [3, 31]),
      organic: `Cut off the unproductive upper part of last season's main shoots and their side shoots. Remove weak, crossing, diseased and broken branches. Brush ${PASTE} on cuts thicker than a finger. Wear gloves`,
      why: 'Pushes strong new growth at the most fruitful buds',
    },
    {
      key: 'manure_after_prune',
      title: 'Dig in manure right after pruning',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([2, 1], [3, 31]),
      organic: `Well-rotted FYM, 50 kg per tree, ${TRENCH}`,
      why: 'The tree feeds the new shoots that will flower in June',
    },
    ...SIGNS,
    EVEN_WATER,
  ],
  phases: [
    phase(
      [6, 1],
      [7, 31],
      'flowering',
      ['Letting the soil dry out at fruit set'],
      ['White powder on flowers and newly set fruit'],
    ),
    phase(
      [10, 1],
      [11, 30],
      'harvest',
      ['Leaving ripe fruit on the tree'],
      ['Fruit-fly maggots', 'Black leaf spot'],
    ),
  ],
};

const EAST_INDIA: RegionCare = {
  items: [
    {
      key: 'prune_march',
      title: 'Head back the branches after harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([3, 1], [3, 31]),
      organic: `Once the last fruit is picked, cut the branches back to 30 cm above the graft union. Brush ${PASTE} on every cut. Wear gloves`,
      why: 'Hard heading-back gives vigorous new fruiting shoots',
    },
    {
      key: 'manure_march',
      title: 'Dig in manure and borax after pruning',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([3, 1], [3, 31]),
      organic: `Well-rotted FYM 10 kg + borax 25 g per tree, ${TRENCH}. Wear gloves for the borax`,
      why: 'Feeds the new shoots; borax prevents boron shortage',
    },
    ...SIGNS,
    EVEN_WATER,
  ],
  phases: [
    phase(
      [1, 1],
      [2, 29],
      'harvest',
      ['Leaving yellow fruit on the tree; pick it in 4–5 rounds'],
      ['Fruit-fly maggots', 'White powder', 'Leaf spots'],
    ),
  ],
};

export const BER_CARE: FamilyCare = {
  family: 'ber',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits (2021), ber pp.65–71; Bordeaux paste pp.10–11',
    'TNAU Crop Production Guide, Horticulture Crops 2020, ber pp.40–41; season table p.343',
    'ICAR-CAZRI Jodhpur, Commercial ber cultivation and management (Hindi leaflet, 2014)',
    'AAU Package of Practices for Horticultural Crops of Assam (2021), ber pp.43–44',
    'NIPHM/DPPQS AESA-based IPM package, Ber',
    'National Horticulture Board model project report, Ber',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'NORTH_INDIA',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'EAST_INDIA',
    'COASTAL_HUMID',
  ],
  pendingRegions: ['CENTRAL_INDIA', 'COASTAL_HUMID'],
  regions: { NORTH_INDIA, WEST_INDIA, SOUTH_DECCAN, EAST_INDIA },
};
