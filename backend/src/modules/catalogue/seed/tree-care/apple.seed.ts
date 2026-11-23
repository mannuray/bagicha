import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Apple care for the hills, transcribed from the source-checked table approved
 * by the owner on 2026-11-23 with every recommendation (docs/plant-care/apple.md,
 * with a source for every row). Change it only through the add-plant playbook.
 *
 * Owner decisions: one calendar for all of HILLS_COOL (north-west Himalaya
 * months); NIPHM's per-year dose capped at 10 years, for young and bearing
 * trees; no Chaubattia paste, no Bordeaux spray or drench (paste on cuts only),
 * lime sulphur only on the bare tree before flowers open, no phosmet, no growth
 * regulators. The scab spray calendar stays out of reminders: scab is a sign.
 * The five plains regions (HRMN-99 only) are pending: no ICAR, SAU or state
 * package gives low-chill apple care there.
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

/** NIPHM p.23: placement of manure and fertiliser (rule 2.1). */
const BASIN =
  'spread in the tree basin from 30 cm away from the trunk out to the drip line and mixed into the soil';
/** PAU p.10 recipe at home-garden scale (rule 2.3): paste on cuts only. */
const PASTE =
  'Bordeaux paste (dissolve 100 g copper sulphate in 750 ml water; slake 150 g quicklime in 750 ml water; mix the two and brush the paste on. Use a plastic or clay pot, never iron)';
const LIME_SULPHUR =
  'Lime sulphur 22% SC, 20 ml per litre, sprayed on the bare tree before flowers open (label: "2% pre-blossom"). Wear gloves; only on the bare tree before flowers open, months before picking (no waiting days apply)';

/** NIPHM: 10 kg FYM, 35 g P₂O₅ (219 g SSP) and 70 g K₂O (117 g MOP) × age, to 10 years. */
const WINTER_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 117 },
  ],
  maxAgeYears: 10,
  together: true,
};
/** NIPHM: 70 g N × age in two halves; 35 g N = 76 g urea, to 10 years. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 10,
};
const UREA = `Urea ${BASIN}, and watered in. Wear gloves`;

/** "Only if you see it": plant page only. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'scab',
    title: 'Treat scab spots on leaves and fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Olive-green, velvety spots on leaves (often underneath) that turn brown-black; dark, corky, cracked spots on fruit',
    organic:
      'Pick off spotted leaves and fruit and destroy them. Thin crowded branches so the tree dries fast after rain. In autumn, spray urea and rake up the leaves',
    chemical:
      'Kresoxim-methyl 44.3% SC, 0.5 ml per litre. Wear gloves; never within 7 days of picking',
    why: 'Scab spreads in wet weather from spores that winter in fallen leaves',
  },
  {
    key: 'powdery_mildew',
    title: 'Cut out shoots white with mildew',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'White, mealy coating on new shoots, leaves and flower clusters; leaves narrow and curl',
    organic:
      'In winter, cut off shoots that were mildewed, 15–20 cm (6–8 in.) below the infection. At pink bud, snip off mildewed blossoms and leaves in the early morning without shaking the twig. Burn or bury what you cut',
    chemical: `Bupirimate 26.7% EC, 1.5 ml per litre. Wear gloves; never within 15 days of picking. Or: ${LIME_SULPHUR}`,
    why: 'Mildew winters in infected buds and spreads to new shoots and flowers',
  },
  {
    key: 'premature_leaf_fall',
    title: 'Clear leaves hit by early leaf fall',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Dark-brown blotches 5–10 mm on older leaves in summer; the leaves yellow and drop weeks early',
    organic:
      'Collect fallen leaves and fruit and destroy them in a closed compost pit or by burning. Prune for air. In autumn, spray urea and rake up the leaves',
    chemical:
      'Dodine 40% SC, 0.75 ml per litre. Wear gloves; never within 21 days of picking',
    why: 'Leaf-fall fungi spend the winter in fallen leaves',
  },
  {
    key: 'canker',
    title: 'Scrape out canker and paste the wound',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Sunken, cracked or papery bark on branches or trunk, often starting at a cut; twigs above it dry up',
    organic: `In winter, scrape the canker back to healthy wood with a sharp knife. Wipe the wound with spirit, then brush on ${PASTE}. Cut out dead twigs and mummified fruit and burn them. Water in hot dry spells, and avoid knocking the bark. Wear gloves`,
    why: 'Canker enters through cuts and wounds and kills the branch above it',
  },
  {
    key: 'woolly_aphid',
    title: 'Clear woolly aphid from bark and cuts',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'White, cottony tufts on bark, cracks, cuts and suckers; knotty swellings on twigs or roots',
    organic: `Cut off suckers and water shoots at the base. Brush ${PASTE} over cracks, wounds and cut ends. Leave twigs with black, swollen aphid "mummies" on the tree: a tiny wasp (Aphelinus mali) is inside and kills the aphids. Plant buckwheat or flowers of the carrot or sunflower family nearby to feed the wasp. Wear gloves`,
    why: 'Woolly aphid sucks sap from bark and roots and leaves knotty galls',
  },
  {
    key: 'san_jose_scale',
    title: 'Treat San Jose scale while the tree is bare',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Grey, ash-like crust of tiny round scales on bark; red-ringed spots on fruit',
    organic:
      'Cut out and burn badly crusted twigs. Plant buckwheat, carrot-family or sunflower-family plants for the ladybirds and tiny wasps that eat scale',
    chemical: LIME_SULPHUR,
    why: 'Scale sucks sap from the bark and weakens and kills twigs',
  },
  {
    key: 'root_borer',
    title: 'Dig out root borer grubs from the basin',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Tree weak and leaning, leaves small and pale; thick roots chewed or cut through',
    organic:
      "In December–January, dig open the basin of the affected tree, pick out the large cream-white grubs and destroy them. In September, collect and kill the shiny chestnut-red beetles at dusk. Don't plant apple in dry, sandy soil",
    why: 'The grubs eat the roots; the beetles lay eggs in the soil in summer',
  },
  {
    key: 'mites',
    title: 'Water regularly to keep mites down',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves speckled, then bronzed or yellow, with fine webbing underneath; tiny red eggs on spurs',
    organic:
      "Keep watering through dry spells; mites thrive in dry air. Collect fallen leaves and prunings. Spare the ladybirds and predatory mites; don't spray broad-spectrum insecticides",
    chemical:
      'Pyridaben 20% WP, 0.5 g per litre. Wear gloves; never within 5 days of picking',
    why: 'Mites build up in dry weather and bronze the leaves',
  },
  {
    key: 'collar_rot',
    title: 'Clean collar rot and paste the wound',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Bark at the base of the trunk or near the graft soft, dark and spongy; leaves turn purple-red in late summer',
    organic: `Scrape the rotten bark back to healthy wood and brush on ${PASTE}. Keep water from standing at the trunk. Put sand around the stem, 30 cm out and 10 cm deep. Clear weeds and long grass from the basin. When buying, choose a plant grafted well above the soil. Wear gloves`,
    why: 'Collar rot thrives in wet soil at the trunk and can kill the tree',
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

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'leaves_autumn',
      title: 'Spray urea on old leaves, then rake them up',
      category: 'PROTECTION',
      stages: BOTH,
      when: cal([10, 1], [11, 30]),
      organic:
        'Once the leaves are down, rake up every fallen leaf and fallen fruit. Bury them, burn them or put them in a closed compost pit',
      chemical:
        'Just before the leaves fall, spray them with urea 50 g per litre (5%). Wear gloves; urea is a fertiliser, so there are no waiting days',
      why: 'Scab and leaf-fall fungi spend the winter in fallen leaves; urea rots them faster',
    },
    {
      key: 'feed_winter',
      title: 'Spread manure, phosphate and potash in winter',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Well-rotted FYM, ${BASIN}. Water the basin afterwards`,
      chemical: `SSP and MOP in the same basin with the FYM. Wear gloves`,
      dose: WINTER_DOSE,
      why: 'The tree takes up phosphate and potash slowly; a winter feed is ready for spring',
    },
    {
      key: 'prune_winter',
      title: 'Prune and shape the tree while it is bare',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Young tree: head the plant at about 90 cm after planting. Over the next years keep 3–4 well-spaced main branches around the trunk (modified leader). Cut back weak and narrow-angled branches. Bearing tree: prune lightly to moderately. Cut out dead, diseased, crowded and crossing wood, and branches growing straight up (cut them back to a strong side branch). Cut close, leaving no stubs. Cut out shoots white with mildew. Brush ${PASTE} on large cuts. Wear gloves`,
      why: 'Light reaches the fruit spurs, and clean, covered cuts keep canker out',
    },
    {
      key: 'nitrogen_spring',
      title: "Give half the year's nitrogen before buds open",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([2, 1], [3, 31]),
      organic: '',
      chemical: UREA,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the new leaves and flowers',
    },
    {
      key: 'summer_water',
      title: 'Water every 7–10 days through the dry summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 7–10 days from flowering, and weekly once fruit has set. In July and August, keep watering the same way whenever the rains fail. Mulch the basin with dry grass about 10 cm thick',
      why: 'Dry soil now means poor fruit set, heavy June drop and small fruit',
    },
    {
      key: 'nitrogen_fruitset',
      title: 'Give the other half of the nitrogen after fruit set',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([5, 15], [6, 15]),
      organic: '',
      chemical: UREA,
      dose: HALF_UREA_DOSE,
      why: "Feeds the young fruit and next year's buds",
    },
    {
      key: 'thin_fruit',
      title: 'Thin the fruit to one per cluster',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 21], [6, 30]),
      organic:
        'Pick off extra fruitlets by hand, leaving one fruit per cluster about 10 cm apart, or one fruit for every 30–40 leaves',
      why: 'Fewer, bigger fruit, and a crop next year too (heavy crops cause alternate bearing)',
    },
    {
      key: 'harvest',
      title: 'Pick apples when the seeds turn brown',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([8, 1], [10, 31]),
      organic:
        'Pick when the fruit has its full size and colour, the seeds inside have turned brown, and the fruit comes off the spur easily. Keep the stalk on. Royal Delicious ripens about 120 days after full bloom and Golden Delicious about 148. Ambri is a late variety. Water in the fortnight before picking for better colour. Pick in the cool morning',
      why: 'Picked too early it lacks taste; too late it drops and keeps badly',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [3, 15],
      [4, 30],
      'bud_break_bloom',
      ['Spraying anything while flowers are open (bees)'],
      [
        'White, mealy shoots and flower clusters (mildew)',
        'Olive-green velvety spots on new leaves (scab)',
      ],
    ),
    phase(
      [5, 1],
      [6, 30],
      'fruit_set',
      ['Letting the basin dry out (June drop)'],
      [
        'Scab on fruitlets',
        'Bronzed leaves (mites)',
        'White wool on bark and cuts (woolly aphid)',
      ],
    ),
    phase(
      [7, 1],
      [7, 31],
      'fruit_growth',
      ['Water standing around the trunk (collar rot)'],
      [
        'Dark-brown blotches on older leaves and early leaf drop',
        'Chestnut-red beetles at dusk, laying eggs in the soil (root borer)',
      ],
    ),
    phase(
      [8, 1],
      [10, 31],
      'harvest',
      ['Picking before the seeds turn brown', 'Leaving ripe fruit to drop'],
      [
        'Fruit dropping before picking',
        'Dark-brown leaf blotches and early leaf drop',
        'Root-borer beetles at dusk',
      ],
    ),
    phase(
      [11, 1],
      [2, 29],
      'dormant',
      ['Leaving fallen leaves under the tree'],
      [
        'Grey, ash-like crust on bark (scale)',
        'Sunken or papery bark patches (canker)',
        'White woolly tufts at cuts and cracks (woolly aphid)',
      ],
    ),
  ],
};

export const APPLE_CARE: FamilyCare = {
  family: 'apple',
  sources: [
    'NIPHM/DPPQS AESA-based IPM package, Apple (2014)',
    'ICAR-CITH Srinagar, Scientific Apple Cultivation, Technical Bulletin 01/2015',
    'DPPQS IPM Package of Practices for Apple (Sept 2022)',
    'SKUAST-Jammu Package of Practices for Sub-tropical and Temperate Fruits, apple pp.68–82',
    'SKUAST POP High Density Apple',
    'National Horticulture Board apple sheets app002–app008',
    'PAU Package of Practices for Cultivation of Fruits (Bordeaux paste recipe, p.10)',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'HILLS_COOL',
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
  ],
  pendingRegions: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
  ],
  regions: { HILLS_COOL },
};
