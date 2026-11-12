import {
  ALL_YEAR,
  groupCare,
  type ItemSpec,
  type PhaseSpec,
  type Window,
} from './build';
import type { Dose, FamilyCare, RegionCare } from './types';

/**
 * Sapota (chikoo) care, transcribed from the source-checked table approved by
 * the owner on 2026-11-12 (docs/plant-care/sapota.md, with a source for every
 * row). Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: W = West (Gujarat, inland Maharashtra, Rajasthan); K = coastal
 * (Konkan, Goa, coastal Karnataka, Kerala, on Konkan dates); S = South Deccan.
 * W and K share the feeding timing (Maharashtra's schedule, tied to monsoon
 * onset), but pest-peak months exist only for South Gujarat, so the bud borer
 * and moth rows are W only. S feeds once, in September–October (TNAU).
 *
 * Dose: FYM 10 kg and urea 435 g per year of age, up to 5 years (TNAU); P and K
 * are a flat mature-tree amount (NHB-6), so they stay as row text. No pesticide
 * has a sapota label claim, so pest rows are organic or cultural only.
 */
type Group = 'W' | 'K' | 'S';

const MAX_AGE = 5;
/** W/K June: all the FYM + half the urea. */
const JUNE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [{ what: 'urea', grams: 217 }],
  maxAgeYears: MAX_AGE,
};
/** W/K Sep–Oct: the other half of the urea. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 217 }],
  maxAgeYears: MAX_AGE,
};
/** S Sep–Oct, one dose: all the FYM + all the urea. */
const S_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [{ what: 'urea', grams: 435 }],
  maxAgeYears: MAX_AGE,
};

const SEP_OCT: Window = [
  [9, 1],
  [10, 31],
];
const DEC_JAN: Window = [
  [12, 1],
  [1, 31],
];

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'monsoon_feed',
    title: 'Feed at the start of the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "All the year's FYM, spread under the canopy and mixed into the top 30 cm",
    chemical:
      "Half the year's urea in the same place; for a bearing tree also SSP 1560 g + MOP 415 g; water in; wear gloves",
    dose: JUNE_DOSE,
    why: 'The tree grows and fruits non-stop and needs a lot of food; most feeder roots are in the top 30 cm',
    windows: {
      W: [
        [6, 15],
        [7, 15],
      ],
      K: [
        [6, 1],
        [7, 15],
      ],
    },
  },
  {
    key: 'post_monsoon_feed',
    title: 'Feed after the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is "S only"; the app always shows an organic line.
    organic: "None now: all the year's FYM went in with the monsoon feed",
    chemical:
      'The other half of the urea; for a bearing tree also SSP 1560 g + MOP 415 g. Water in; wear gloves',
    dose: HALF_UREA_DOSE,
    why: 'Last feed before the dry months',
    windows: { W: SEP_OCT, K: SEP_OCT },
  },
  {
    key: 'post_monsoon_feed',
    title: 'Feed after the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "The whole year's FYM, in a band from 45 cm off the trunk out to the drip line, mixed into the soil",
    chemical:
      "The whole year's urea, same band; for a bearing tree also SSP 3125 g + MOP 833 g. Water in; wear gloves",
    dose: S_DOSE,
    why: 'Last feed before the dry months',
    windows: { S: SEP_OCT },
  },
  {
    key: 'pick_bored_buds',
    title: 'Pick off bored buds and webbed shoots',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Pick and destroy webbed clusters and bored buds (milky tip, droppings on top), caterpillars inside',
    why: 'Bud borer and chiku moth peak in April–June and can kill 20–30% of buds',
    windows: {
      W: [
        [3, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'clear_webbed_leaves',
    title: 'Clear webbed leaves on the new flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Pull off and destroy fresh webbed leaf clusters with caterpillars, and dried old webs',
    why: "Chiku moth's second peak is on the winter flush and fruit",
    windows: {
      W: [
        [11, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'fruit_fly_trap',
    title: 'Hang a fruit fly trap, bag fallen fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      "One methyl eugenol trap per tree, 5–6 ft up. Pick up fallen fruit, tie it in a polythene bag for 4–5 days, then discard. Don't dump it on soil",
    why: 'Maggots rot the ripe fruit; the fly peaks March–July (April–June in South Gujarat)',
    windows: {
      W: [
        [4, 1],
        [6, 30],
      ],
      K: [
        [3, 1],
        [7, 31],
      ],
      S: [
        [3, 1],
        [7, 31],
      ],
    },
  },
  {
    key: 'thin_branches',
    title: 'Thin crowded and crossing branches',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut out crowded, crossing and low branches, water shoots and any rootstock sprouts',
    why: 'Flowers and fruit form on branches that get the most light and air',
    windows: { W: DEC_JAN, K: DEC_JAN, S: DEC_JAN },
  },
];

const ALL = { W: ALL_YEAR, K: ALL_YEAR, S: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'bud_borer_seen',
    title: 'Pick off bored buds and webbed shoots',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional:
      'Webbed leaves, or buds with a hole, a milky tip and droppings (bud borer, chiku moth)',
    // The table's "do row 3", written out with row 3's own words.
    organic:
      'Pick and destroy webbed clusters and bored buds (milky tip, droppings on top), caterpillars inside',
    why: 'Bud borer and chiku moth',
    windows: { K: ALL_YEAR, S: ALL_YEAR },
  },
  {
    key: 'sooty_mould',
    title: 'Spray starch against sooty mould',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves and fruit get a black coating',
    organic:
      'Boil 1 kg maida or starch in 5 L water, cool, dilute with 20 L water and spray. Not in cloudy weather',
    why: 'Sooty mould, which grows on honeydew from mealybugs and scales',
    windows: ALL,
  },
  {
    key: 'mealybug_scale',
    title: 'Cut off twigs with mealybugs or scales',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'White mealybug colonies under leaves or at fruit stalks, or green scales',
    organic: 'Cut off and destroy the infested twigs',
    why: 'Mealybugs and scales',
    windows: ALL,
  },
  {
    key: 'fasciation',
    title: 'Cut off flat, twisted shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Branches turn flat, ridged and twisted at the tip',
    organic: 'Cut off and destroy those shoots',
    why: 'Fasciation',
    windows: ALL,
  },
  {
    key: 'nutrient_spray',
    title: 'Spray zinc and boron for deficiency signs',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Young leaves show deficiency signs at flowering',
    organic:
      'Spray zinc sulphate 5 g + boric acid 1 g per litre. Wear gloves; it is a nutrient spray, so there is no waiting period',
    why: 'Zinc and boron shortage',
    windows: ALL,
  },
  {
    key: 'water_young',
    title: 'Water the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'The soil around a young tree is drying',
    organic:
      'Every 6–7 days in summer, every 8–10 days in winter. Widen the basin as the canopy grows; mulch',
    why: 'Young roots dry out fast',
    windows: ALL,
  },
  {
    key: 'picking',
    title: 'Pick fruit when the scurf turns dull',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional:
      'Brown scurf turning dull yellowish-brown, no green under a scratch',
    organic:
      'Pick when the brown scurf turns dull yellowish-brown, a scratch shows no green, and there is little latex at the stalk. Wash off latex, dry in shade',
    why: 'Fruit picked too early stays poor; picked late, it softens fast',
    windows: ALL,
  },
  {
    key: 'heat',
    title: 'Flowers drop above 43°C',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Temperatures above 43°C',
    organic: 'Above 43°C flowers drop',
    why: 'Heat',
    windows: ALL,
  },
  {
    key: 'new_graft',
    title: 'Shade and stake a newly planted graft',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'A newly planted graft',
    organic:
      'Shade it from the sun with grass or a plastic sheet, and keep it staked',
    why: 'Shades the new graft from heat',
    windows: ALL,
  },
];

const YOUNG_TEXT =
  'FYM and urea per year of age, in a band 45 cm from the trunk out to the drip line';

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: JUNE_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      W: [
        [6, 15],
        [7, 15],
      ],
      K: [
        [6, 1],
        [7, 15],
      ],
    },
  },
  {
    key: 'feed_young_post_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    windows: { W: SEP_OCT, K: SEP_OCT },
  },
  {
    key: 'feed_young_post_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: S_DOSE,
    why: 'Steady growth for a strong frame',
    windows: { S: SEP_OCT },
  },
  {
    key: 'shape_young',
    title: 'Shape the young tree, remove sprouts',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Remove sprouts from below the graft joint, water shoots, crossing and low branches; thin overcrowding',
    why: 'Thins overcrowding',
    windows: { W: DEC_JAN, K: DEC_JAN, S: DEC_JAN },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'peak_flowering_and_summer_fruit',
    avoid: ['Letting the soil dry out (above 43°C flowers drop)'],
    watch: ['Bud borer', 'Chiku moth on buds', 'Fruit fly (peak Apr–Jun)'],
    months: { W: [3, 6] },
  },
  {
    phase: 'monsoon_growth',
    avoid: ['Waterlogging'],
    watch: ['Leaf miner (rainy season)', 'Leaf spot'],
    months: { W: [7, 10] },
  },
  {
    phase: 'winter_flush_and_picking',
    avoid: ['Leaving ripe fruit to soften on the tree'],
    watch: ['Chiku moth on the new flush (Nov–Dec)', 'Mealybug', 'Sooty mould'],
    months: { W: [11, 2] },
  },
  {
    phase: 'year_round_bearing',
    avoid: ['Picking unripe fruit (green under a scratch, much latex)'],
    watch: [
      'Leaf webber',
      'Bud worm',
      'Fruit fly (peak Mar–Jul)',
      'Mealybug',
      'Sooty mould',
    ],
    months: { K: [1, 12], S: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const SAPOTA_CARE: FamilyCare = {
  family: 'sapota',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'TNAU Agritech sapota',
    'National Horticulture Board sapota pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for sapota',
    'Navsari Agricultural University sapota pest fact sheets (2022)',
    'Dr BSKKV Dapoli research recommendations (2022)',
  ],
  grownIn: ['WEST_INDIA', 'SOUTH_DECCAN', 'COASTAL_HUMID'],
  regions: {
    WEST_INDIA: regionCare('W'),
    COASTAL_HUMID: regionCare('K'),
    SOUTH_DECCAN: regionCare('S'),
  },
};
