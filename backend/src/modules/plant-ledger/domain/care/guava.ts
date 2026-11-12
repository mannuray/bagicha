import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from './types';

/**
 * Guava care, transcribed from the source-checked table approved by the owner
 * on 2026-11-12 (docs/plant-care/guava.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: A = North (PAU's fixed dates that skip the rainy-season crop
 * for a winter crop); S = South Deccan (TNAU's two crops, feeding in March and
 * October). They follow different crop calendars, so they are separate.
 * East, Central, West and Coastal are pending: Central and West follow the
 * grower's bahar, East's crop choice and the coast's dates are unsourced.
 */
type Group = 'A' | 'S';

/** NHB-6: per year of age, up to 5 years; bearing trees in two doses. FYM is row text. */
const BEARING_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 155 },
    { what: 'MOP', grams: 40 },
  ],
  maxAgeYears: 5,
};
/** NHB-6: young trees in three doses (July, September, February). */
const YOUNG_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 72 },
    { what: 'SSP', grams: 104 },
    { what: 'MOP', grams: 28 },
  ],
  maxAgeYears: 5,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'tip_cut',
    title: 'Cut shoot tips to skip the rainy-season crop',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut 20–30 cm off the tip of every shoot, which takes off the rainy-season flowers. At the same time, remove dead, diseased and crossing branches and suckers from the base. Seal cuts thicker than a thumb with Bordeaux paste (1 kg copper sulphate + 1 kg lime in 10 L water); wear gloves',
    why: 'The tree then flowers in Aug–Sep for a winter crop: better fruit and far fewer fruit flies',
    windows: {
      A: [
        [4, 20],
        [4, 30],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water to skip the rainy-season crop',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Don't water bearing trees in April–May. Young trees still need water",
    why: 'A dry spell drops the rainy-season flowers',
    windows: {
      A: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  // Owner-approved exception to the label-claim rule: guava has no copper
  // claim in the MUP, but this home-made Bordeaux spray is a traditional PAU
  // practice (PAU p.44) given when there is no fruit on the tree.
  {
    key: 'bordeaux_spray',
    title: 'Spray Bordeaux mixture after pruning',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Home-made Bordeaux mixture 2:2:250: 8 g copper sulphate and 8 g lime per litre. Dissolve them separately, then mix. Wear gloves. There is no fruit on the tree now, so no waiting period applies',
    why: 'Protects fresh cuts and new shoots from fruit rot and dieback',
    windows: {
      A: [
        [5, 1],
        [5, 10],
      ],
    },
  },
  {
    key: 'feed_manure',
    title: 'Feed manure and half the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      'FYM for a bearing tree, 30–40 kg, in a ring under the canopy edge, forked in lightly, then mulch the basin with paddy straw',
    chemical:
      "Half the year's urea + SSP + MOP in the same ring; water in; wear gloves",
    dose: BEARING_DOSE,
    why: 'Feeds the new shoots that carry the next crop',
    windows: {
      A: [
        [5, 15],
        [6, 30],
      ],
    },
  },
  {
    key: 'feed_manure',
    title: 'Feed manure and half the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's "the same way" refers to the A text: ring under the canopy edge.
    organic:
      'Half of the 30–40 kg FYM in a ring under the canopy edge, forked in lightly, then mulch the basin with paddy straw',
    chemical:
      "Half the year's urea + SSP + MOP in the same ring; water in; wear gloves",
    dose: BEARING_DOSE,
    why: 'Feeds the new shoots that carry the next crop',
    windows: {
      S: [
        [3, 1],
        [3, 31],
      ],
    },
  },
  {
    key: 'feed_second',
    title: 'Feed the second half of the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'Dig the rotted straw mulch into the basin',
    chemical:
      'Other half of urea + SSP + MOP; water in if there is no rain; wear gloves',
    dose: BEARING_DOSE,
    why: 'Last feed of the year',
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
    },
  },
  {
    key: 'feed_second',
    title: 'Feed the second half of the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'The other half of the FYM',
    chemical:
      'Other half of urea + SSP + MOP; water in if there is no rain; wear gloves',
    dose: BEARING_DOSE,
    why: 'Last feed of the year',
    windows: {
      S: [
        [10, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'prune_tips',
    title: 'Prune shoot tips for new fruiting shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut back the tips of shoots that have fruited. Remove dead, diseased and crossing branches and suckers. Bordeaux paste on big cuts; wear gloves',
    why: 'Guava flowers on new shoots; pruning brings more side shoots',
    windows: {
      S: [
        [
          [2, 1],
          [3, 31],
        ],
        [
          [9, 1],
          [10, 31],
        ],
      ],
    },
  },
  {
    key: 'nutrient_spray',
    title: 'Spray urea and zinc on the new flush',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is empty; the app always shows an organic line.
    organic: 'No organic option for this; use the alternative below',
    chemical:
      'Urea 10 g + zinc sulphate 5 g per litre (1% + 0.5%). This is a fertiliser, so no waiting period. Wear gloves',
    why: 'Raises yield',
    windows: {
      S: [
        [
          [3, 1],
          [3, 31],
        ],
        [
          [10, 1],
          [10, 31],
        ],
      ],
    },
  },
];

const BOTH = { A: ALL_YEAR, S: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'fym_by_age',
    title: 'FYM for the year, by age',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional: "When you work out the year's manure",
    organic:
      '5–8 kg, then 10, 15–25, 25–30 and 40–50 kg as the tree grows; 30–40 kg for a bearing tree',
    why: 'FYM is given by age band, not per year of age',
    windows: BOTH,
  },
  {
    key: 'water_young',
    title: 'Water the young tree in the dry months',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Dry months, with no rain',
    organic:
      'In year 1 every 2–3 days, in years 2–3 every 4–5 days, in the dry months. No watering in the monsoon unless there is a long dry spell. Mulch with dry leaves or straw',
    why: 'Young roots dry out fast',
    windows: BOTH,
  },
  {
    key: 'rainy_crop_kept',
    title: 'Bag fruit and trap fruit fly on the rainy crop',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'You kept the rainy-season crop (no tip cut in April)',
    organic:
      'Cover mature-green fruit with white non-woven bags at the end of June to mid-July; hang a fruit fly trap in the first week of July; pick at colour break',
    why: 'The rainy-season crop gets far more fruit flies',
    // End of June to mid-July, first week of July: whole months Jun–Jul.
    windows: {
      A: [
        [6, 1],
        [7, 31],
      ],
    },
  },
  {
    key: 'picking',
    title: 'Pick fruit as it turns greenish-yellow',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Skin turning from dark green to greenish-yellow',
    organic:
      "Pick when the skin turns from dark green to greenish-yellow; don't leave ripe fruit on the tree. Pick up fallen fruit every day and bury it at least 60 cm deep",
    why: "Don't leave ripe fruit on the tree",
    windows: BOTH,
  },
  {
    key: 'fruit_fly',
    title: 'Bury fallen and stung fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fallen or fruit-fly-stung fruit under the tree',
    organic:
      'Collect fallen and stung fruit daily and bury it 60 cm deep. Lightly dig the basin after harvest to expose the pupae',
    why: 'Fruit fly',
    windows: BOTH,
  },
  {
    key: 'fruit_rot',
    title: 'Clean up against fruit rot',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Brown, sunken spots with pink ooze on fruit in the rains',
    organic:
      "Don't let water stand in the basin; bury rotten and dried-up fruit; cut out dead twigs",
    why: 'Fruit rot',
    windows: BOTH,
  },
  {
    key: 'wilt',
    title: 'Remove a wilting tree',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Leaves yellow and branches dry on one side, then the whole tree wilts',
    organic:
      'Uproot and burn the tree with its roots, keep basins drained, and replant with a plant on Sardar or Portugal rootstock',
    why: 'Wilt',
    windows: BOTH,
  },
  {
    key: 'zinc',
    title: 'Spray zinc for small yellow leaves',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Leaves small and yellow between the veins, with twigs dying back',
    organic:
      'Spray zinc sulphate 10 g + unslaked lime 5 g per litre, 2–3 times a fortnight apart in Jun–Sep. Wear gloves; it is a fertiliser, so there is no waiting period',
    why: 'Zinc shortage',
    windows: {
      A: [
        [6, 1],
        [9, 30],
      ],
      S: [
        [6, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silk webs with chewed wood on the trunk',
    organic:
      'Pull off the webs; push a wire into the hole; plug it with cotton soaked in kerosene; seal it with mud',
    why: 'Bark-eating caterpillar',
    windows: BOTH,
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'The tree is near mango trees and mealybugs climb the trunk in winter',
    organic: 'Tie a 25 cm wide, 400-gauge polythene band around the trunk',
    why: 'Stops mealybugs climbing the trunk',
    windows: BOTH,
  },
  {
    key: 'boron',
    title: 'Spray borax for cracked fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruit is cracked or misshapen',
    organic:
      'Spray borax 3 g per litre at flowering and again at fruit set. Wear gloves; it is a fertiliser, so there is no waiting period',
    why: 'Boron shortage',
    windows: { S: ALL_YEAR },
  },
  {
    key: 'shaping',
    title: 'Shape the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Your young tree needs shaping (no month in the sources)',
    organic:
      'Clear the first 60–90 cm of trunk; keep 4–5 main branches 20–25 cm apart; head the tree back at 1.5–1.8 m to open the centre',
    why: 'Opens the centre of the tree',
    windows: BOTH,
  },
];

/** NHB-6's one national schedule for the first years: same dates in A and S. */
const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_first',
    title: 'Feed manure and a third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic:
      'FYM in June by age: 5–8 kg, then 10, 15–25 and 25–30 kg as the tree grows, plus a third of the urea + SSP + MOP in July, in a ring 30 cm from the trunk',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [6, 15],
        [7, 31],
      ],
      S: [
        [6, 15],
        [7, 31],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Feed a third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: 'Second third of urea + SSP + MOP; water in',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [9, 1],
        [9, 30],
      ],
      S: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'feed_young_third',
    title: 'Feed the last third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: 'Last third of urea + SSP + MOP; water in',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [2, 1],
        [2, 28],
      ],
      S: [
        [2, 1],
        [2, 28],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'post_harvest_and_regulation',
    avoid: ['Watering bearing trees in Apr–May'],
    watch: ['Rainy-season flowers dropping (intended)'],
    months: { A: [3, 5] },
  },
  {
    phase: 'vegetative_flush',
    avoid: ['Water standing in the basin'],
    watch: ['Wilt', 'Fruit fly on leftover fruit'],
    months: { A: [6, 7] },
  },
  {
    phase: 'flowering',
    avoid: ['Heavy watering at peak flowering (flower drop)'],
    watch: ['Anthracnose dieback (worst in Aug–Sep)'],
    months: { A: [8, 9] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Letting the soil dry out (water monthly in winter)'],
    watch: ['Fruit rot', 'Mango mealybug on the winter crop'],
    months: { A: [10, 12] },
  },
  // S has two pruning flushes and two fruiting spells a year.
  {
    phase: 'pruning_and_flush',
    avoid: ['Fertiliser during flowering'],
    watch: ['Tea mosquito bug', 'Mealybug'],
    months: { S: [2, 3] },
  },
  {
    phase: 'pruning_and_flush',
    avoid: ['Fertiliser during flowering'],
    watch: ['Tea mosquito bug', 'Mealybug'],
    months: { S: [9, 10] },
  },
  {
    phase: 'fruiting_and_harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Fruit rot in rain'],
    months: { S: [4, 8] },
  },
  {
    phase: 'fruiting_and_harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Fruit rot in rain'],
    months: { S: [11, 1] },
  },
  {
    phase: 'establishment',
    stages: ['YOUNG'],
    avoid: ['Waterlogging', 'Damaging roots'],
    watch: ['Wilt', 'Mealybug on young plants'],
    months: { A: [1, 12], S: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const GUAVA_CARE: FamilyCare = {
  family: 'guava',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'PAU Package of Practices for Fruit Crops',
    'National Horticulture Board guava pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for guava',
    'NHM IPM schedule for guava pests (2012)',
    'TNAU Agritech guava',
    'KAU Package of Practices (2016)',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  pendingRegions: [
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'COASTAL_HUMID',
  ],
  regions: {
    NORTH_INDIA: regionCare('A'),
    SOUTH_DECCAN: regionCare('S'),
  },
};
