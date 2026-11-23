import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Pomegranate care for a tree left to flower naturally, transcribed from the
 * source-checked table approved by the owner on 2026-11-23 with every
 * recommendation (docs/plant-care/pomegranate.md, with a source for every row).
 * Change it only through the add-plant playbook.
 *
 * Owner decision: no bahar (forced flowering season) steps; home gardeners let
 * the tree flower on its own. NORTH_INDIA = PAU, SOUTH_DECCAN = TNAU (December
 * prune only: no per-year bearing feed is sourced there). WEST_INDIA is
 * pending: every source times a grown tree from a forced bahar.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const BEARING = ['BEARING'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const cal = (
  from: [number, number],
  to: [number, number],
): Extract<Anchor, { kind: 'CALENDAR' }> => ({
  kind: 'CALENDAR',
  from,
  to,
});

/** NIPHM: ring trench 45–60 cm from the stem. */
const TRENCH =
  'in a ring trench 15–20 cm wide and 8–10 cm deep, 45–60 cm from the stem; cover with soil and water lightly';
/** 10% Bordeaux paste (NRC 146 p.8). */
const PASTE =
  'Bordeaux paste (soak 100 g copper sulphate in 500 ml water and 100 g lime in another 500 ml overnight, mix in the morning; plastic or clay pot, never iron)';
/** 1% Bordeaux spray (NRC 146 p.7), only with no fruit on the tree. */
const SPRAY =
  '1% Bordeaux (10 g copper sulphate and 3–4 g lime per litre, each soaked overnight in plastic, mixed and strained; use the same day)';
const CYANTRANILIPROLE = (mlPerLitre: string) =>
  `Cyantraniliprole 10.26% OD, ${mlPerLitre} ml per litre. Wear gloves; never within 5 days of picking`;
const KASUGAMYCIN =
  'Kasugamycin 5% + copper oxychloride 45% WP, 1 g per litre. Wear gloves; never within 10 days of picking';

/** PAU: 5 kg FYM per year of age (cap: the urea's 5 years). */
const MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [],
  maxAgeYears: 5,
};
/** PAU: 50 g urea per year of age up to 5 years, half in Feb, half in Apr. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 25 }],
  maxAgeYears: 5,
};

/** "Only if you see it": plant page only, in every region with care. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'bag_fruit',
    title: 'Bag young fruits against the anar butterfly',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional: 'Small fruits have set',
    organic:
      'Slip a paper or white non-woven bag over each fruit as soon as it sets, no later than 5 cm across, tied loosely at the stalk. Pick off and destroy any fruit with a hole and dark droppings. Pull up flowering daisy-family weeds nearby. The bags also keep off fruit fly, fruit-piercing moth and birds',
    chemical: `From flowering: ${CYANTRANILIPROLE('0.75')}`,
    why: 'The anar butterfly lays eggs on young fruit; the caterpillar rots it from inside',
  },
  {
    key: 'even_water',
    title: 'Water evenly while fruit grows to stop cracking',
    category: 'WATERING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Fruit is forming',
    organic:
      'Water regularly from fruit set to harvest; never let the soil dry hard and then flood it. Mulch the basin. Pick fruit as soon as it is ripe',
    chemical:
      'Young trees that crack (lack of boron): boric acid 0.5 g per litre on the leaves before bloom and at fruit set, never near ripening. A fertiliser: no waiting period. Wear gloves',
    why: 'A dry spell followed by heavy water splits the fruit',
  },
  {
    key: 'blight',
    title: 'Cut out and treat oily-spot blight',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Dark, oily, water-soaked spots on leaves or fruit; fruit splitting in an L shape; dark cankers on twigs',
    organic: `Cut affected twigs 5–10 cm below the canker and cover each cut with ${PASTE}. Pick and burn or bury spotted fruit and fallen leaves. Wipe the secateurs in bleach (2–3 ml per litre) between cuts. Water at the base only. Only when no fruit is on the tree: spray ${SPRAY}. Wear gloves`,
    chemical: KASUGAMYCIN,
    why: 'Bacterial blight spreads by rain splash, tools and cuttings',
  },
  {
    key: 'wilt',
    title: 'Remove a wilting tree with its roots',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves yellow and dry on one branch, then the whole tree; the wood inside is dark brown',
    organic:
      "Once a whole branch is affected, dig out the whole tree with its roots and burn it. Don't replant there until the soil has been sun-baked under clear plastic. Never let water stand in the basin",
    why: 'Wilt has no cure and spreads through the soil to nearby trees',
  },
  {
    key: 'thrips',
    title: 'Check thrips on buds and young fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Scabby, scraped marks on buds and fruit, or new leaves curled and tips dried',
    organic:
      "Snip off and destroy affected shoots. Hang blue sticky traps. Don't grow chilli, onion, garlic, brinjal or tomato beside the tree",
    chemical: CYANTRANILIPROLE('0.75'),
    why: 'Thrips scar the fruit skin and stunt new shoots',
  },
  {
    key: 'aphids_whitefly',
    title: 'Wash off aphids and whitefly',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Sticky leaves, black sooty mould, or clusters of small insects on new shoots and under leaves',
    organic:
      "Hose the undersides of the leaves with a strong jet of water. Hang yellow sticky traps. Ask the KVK for green lacewing larvae to release when flowers begin. Don't grow roses beside the tree",
    chemical: CYANTRANILIPROLE('0.9'),
    why: 'They suck sap from new growth and the honeydew grows black mould',
  },
  {
    key: 'mites',
    title: 'Water regularly to keep mites down',
    category: 'WATERING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Shiny white or brown patches under leaves; leaves curl and fall, and a pressed leaf stains red',
    organic:
      'Keep watering regularly through dry spells; mites are worst from April to October in dry weather',
    why: 'Mites build up on dry, stressed trees',
  },
  {
    key: 'suckers',
    title: 'Pull out suckers from the base',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots coming up from the base or roots',
    organic:
      'Remove them as soon as they appear. Keep the trunk clear of shoots to 30–60 cm, with 3–4 main branches above',
    why: 'Suckers take food from the fruiting branches',
  },
  {
    key: 'fungal_spots',
    title: 'Treat dark fungal spots on leaves and fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Dry, dark, round spots on leaves or fruit that are not oily or sticky',
    organic:
      'Pick off and destroy spotted fruit, leaves and twigs. Thin crowded branches to let air in',
    chemical:
      'Propineb 70% WP, 3 g per litre. Wear gloves; never within 10 days of picking',
    why: 'Leaf and fruit spots spread in damp, crowded canopies',
  },
  {
    key: 'deadwood',
    title: 'Cut out dead, crossing and trunk shoots',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Dead, broken or crossing branches, or shoots on the trunk',
    organic: `Cut them out. Cover cuts thicker than 1 cm with ${PASTE}. Wear gloves`,
    why: 'Dead wood harbours blight and borers',
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillar from the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Webbing of chewed wood and droppings on the bark, with holes',
    organic:
      'Clear the webbing. Push a cotton swab wet with kerosene into each hole and seal it with wet mud',
    why: 'The caterpillar tunnels into the trunk and weakens branches',
  },
];

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
      key: 'manure_dec',
      title: 'Spread the yearly manure in December',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM ${TRENCH}`,
      dose: MANURE_DOSE,
      why: "The year's organic feed, given while the tree is bare",
    },
    {
      key: 'urea_feb',
      title: "Give half the year's urea in February",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([2, 1], [2, 29]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the spring flush and the flowers',
    },
    {
      key: 'urea_apr',
      title: 'Give the other half of the urea in April',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([4, 1], [4, 30]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the setting fruit',
    },
    {
      key: 'summer_water',
      title: 'Water every 10–15 days through the summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 10–15 days. Keep it steady once fruit has set: dry soil followed by a flood cracks fruit',
      why: 'Fruit drops or cracks when the soil dries out',
    },
    {
      key: 'black_spot_rains',
      title: 'Guard fruit against black spot as rains near',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([5, 1], [7, 31]),
      organic:
        'Pick up and burn or bury fallen leaves and any fruit with dark, oily spots. Keep weeds down under the tree. Water at the base, never over the leaves',
      chemical: `${KASUGAMYCIN}. Once each in May, June and July`,
      why: 'Black spot (bacterial blight) spreads with rain splash onto the ripening fruit',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'winter_bare',
      ['Heavy watering; water lightly only in a long dry spell'],
      ['Branches with dark cankers'],
    ),
    phase(
      [4, 1],
      [6, 30],
      'hot_dry',
      ['Letting the basin dry out'],
      ['Fruit borer on young fruit', 'Aphids on new shoots'],
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Water standing in the basin'],
      ['Black spots on fruit once the rains start', 'Ripe fruit cracking'],
    ),
  ],
};

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'prune_dec',
      title: "Prune last season's shoots back by a third",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([12, 1], [12, 31]),
      organic: `After the last fruit is picked, shorten each of last season's shoots by one third. Cut out dried, diseased and crossing branches, root suckers and water shoots. Cover every cut with ${PASTE}. With no fruit left, spray ${SPRAY} the same evening. Wear gloves`,
      why: "New shoots carry next season's flowers; clean cuts keep blight out",
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [5, 1],
      [7, 31],
      'flowering',
      ['Letting the soil dry out'],
      ['Fruit borer eggs on flowers and young fruit', 'Aphids', 'Thrips'],
    ),
    phase(
      [8, 1],
      [9, 30],
      'fruit_growth',
      ['Uneven watering (cracking)'],
      ['Oily spots on leaves and fruit in wet spells'],
    ),
    phase(
      [10, 1],
      [1, 31],
      'harvest',
      ['Leaving ripe fruit on the tree (it cracks)'],
      ['Fruit fly and fruit-piercing moth on ripening fruit'],
    ),
  ],
};

export const POMEGRANATE_CARE: FamilyCare = {
  family: 'pomegranate',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, pomegranate pp.119–121',
    'TNAU Crop Production Guide, Horticulture Crops 2020, pomegranate pp.36–38',
    'ICAR-NRC Pomegranate advisories 89, 117 and 146 (IDIPM schedule, 2023)',
    'National Horticulture Board pomegranate crop sheets pom002–pom010',
    'NIPHM/DPPQS AESA-based IPM package, Pomegranate',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'WEST_INDIA', 'SOUTH_DECCAN'],
  pendingRegions: ['WEST_INDIA'],
  regions: { NORTH_INDIA, SOUTH_DECCAN },
};
