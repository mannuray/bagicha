import type {
  Anchor,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Papaya care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/papaya.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * Most care counts from the planting date (FROM_PLANTING: "from the Nth month"
 * opens at day 30×N for 30 days); amounts are per plant per feed, in the text.
 * Regions: SOUTH_DECCAN = TNAU, COASTAL_HUMID = KAU, EAST_INDIA = Assam AU,
 * NORTH_INDIA = PAU (calendar only). WEST_INDIA (one Saurashtra note) and
 * CENTRAL_INDIA (no source) are pending. No region shares another's care: the
 * guides differ on the feed start, amount and count.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const planted = (fromDays: number, toDays: number) =>
  ({ kind: 'FROM_PLANTING', fromDays, toDays }) as const;

/** Placement of every feed (NHB pap006). */
const PLACE =
  'in a ring 10 cm deep, 15–20 cm from the stem; cover and water lightly. Wear gloves';

/** Feeds every 60 days, each open 30 days, from `firstDay`. */
function feeds(
  count: number,
  firstDay: number,
  title: (n: number) => string,
  chemical: string,
  why: string,
): TreeCareItem[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `feed_${i + 1}`,
    title: title(i + 1),
    category: 'FEEDING',
    stages: BOTH,
    when: planted(firstDay + 60 * i, firstDay + 60 * i + 29),
    organic: '',
    chemical: `${chemical}, ${PLACE}`,
    why,
  }));
}

// "Only if you see it": plant page only.
const males = (ratio: string): TreeCareItem => ({
  key: 'extra_males',
  title: 'Pull out extra male plants',
  category: 'GENERAL',
  stages: BOTH,
  // Papaya flowers 3–7 months after planting (TNAU, NHB).
  when: planted(90, 239),
  conditional: 'Flowers open on seed-grown plants',
  organic: `Red Lady, Pusa Delicious, CO 3, CO 7, Coorg Honey Dew and Surya need no male. Otherwise keep one plant per pit and pull out extra males, keeping ${ratio}, spread around the garden; with only a few plants keep one male`,
  why: 'Males bear no fruit; a few are enough to pollinate',
});
const VIRUS: TreeCareItem = {
  key: 'virus_plants',
  title: 'Uproot and burn virus-hit plants',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Mottled, blistered, curled or shrunken top leaves, or ring spots on fruit',
  organic:
    "Uproot and burn the plant at once. Don't grow tomato, chilli, tobacco or cucurbits next to papaya. Knock aphids off young plants with a strong jet of water",
  why: 'Aphids carry the virus to healthy plants; there is no cure',
};
const COLLAR_ROT: TreeCareItem = {
  key: 'collar_rot',
  title: 'Treat rot at the stem base',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Wet, dark rot at the stem base, with yellowing leaves',
  organic:
    'Keep water off the stem (ring basin) and drain the basin. Mild: scrape the rotten patch and cover it with Bordeaux paste (100 g copper sulphate in 1 L water, 100 g lime in another 1 L, then mix). Or drench the soil round the stem with 1% Bordeaux (10 g copper sulphate + 10 g lime per litre), 2–3 L per plant. Wear gloves. Rotting right round the stem: uproot the plant',
  why: 'Standing water rots the stem and the plant falls',
};
const mealybug = (withBiocontrol: boolean): TreeCareItem => ({
  key: 'mealybug',
  title: 'Clear papaya mealybug',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'White cottony clusters under leaves or on fruit',
  organic: `Pick off and burn infested leaves. Pull up hibiscus and weeds nearby${
    withBiocontrol
      ? '. Tie a sticky band or polythene sheet round the stem, destroy ant nests, and ask the KVK or agriculture office for the parasitoid Acerophagus papayae'
      : ''
  }`,
  why: 'Mealybug sucks sap and spreads fast between plants',
});
const POWDERY: TreeCareItem = {
  key: 'powdery_mildew',
  title: 'Treat white powder on leaves',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'White powder on leaves',
  organic: 'Remove badly affected leaves and keep the plants spaced',
  chemical:
    'Thiophanate-methyl 70 WP 0.7–0.95 g per litre; wear gloves; never within 8 days of picking',
  why: 'Powdery mildew weakens leaves and young fruit',
};
const NEMATODES: TreeCareItem = {
  key: 'nematodes',
  title: 'Treat knotted roots',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Stunted, yellowing plants with knotted roots',
  organic:
    'Neem cake 250 g per plant, worked into the basin. Or 2 kg FYM mixed with 2 g Trichoderma harzianum 1% WP (1 g per kg) per plant, now and every 3 months for a year',
  why: 'Root-knot nematodes stunt the plant',
};
const FRUIT_SPOTS: TreeCareItem = {
  key: 'fruit_spots',
  title: 'Remove fruit with sunken dark spots',
  category: 'PROTECTION',
  stages: ['BEARING'],
  when: ALL_YEAR,
  conditional: 'Sunken dark spots on fruit',
  organic:
    'Pick off and destroy spotted fruit and avoid bruising. Keep the basin drained. Bag fruit in paper about 15 days before picking',
  why: 'Anthracnose spreads from spotted fruit in wet weather',
};
const ZINC_SIGNS: TreeCareItem = {
  key: 'small_leaves',
  title: 'Spray zinc and boron on small leaves',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Small, pale or misshapen new leaves',
  organic: '',
  chemical:
    'Zinc sulphate 5 g + boric acid 1 g per litre, sprayed on the leaves. A fertiliser: no waiting period. Wear gloves',
  why: 'Zinc and boron shortage stunts leaves and fruit',
};
const PICKING: TreeCareItem = {
  key: 'pick_ripe',
  title: 'Pick fruit as it starts to yellow',
  category: 'GENERAL',
  stages: ['BEARING'],
  when: ALL_YEAR,
  conditional: 'A yellow streak on a full-size fruit, or watery latex',
  organic:
    'Pick by twisting, in the morning. Collect fallen and over-ripe fruit, which draws fruit fly',
  why: 'Picked at first colour it ripens well and escapes fruit fly',
};

const phase = (
  from: [number, number],
  to: [number, number],
  name: string,
  avoid: string[],
  watch: string[],
): PhaseWindow => ({
  when: { kind: 'CALENDAR', from, to },
  stages: BOTH,
  phase: name,
  avoid,
  watch,
});

const ZINC_BORON =
  'Zinc sulphate 5 g + boric acid 1 g per litre (0.5% + 0.1%), sprayed on the leaves. A fertiliser: no waiting period. Wear gloves';

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'planting_mix',
      title: 'Mix manure and microbes in at planting',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        '10 kg FYM in the pit. Around the roots: arbuscular mycorrhiza 50 g, phosphate-solubilising bacteria 25 g and Azospirillum 50 g',
      why: 'Feeds the roots and helps them take up phosphorus from the start',
    },
    {
      key: 'water_new_plant',
      title: 'Water the new plant weekly, off the stem',
      category: 'WATERING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        'Soak well after planting, then water once a week. Use a ring basin so water never touches the stem, and let no water stand',
      why: 'The roots settle; wet stems get collar rot',
    },
    ...feeds(
      11,
      90,
      (n) => `Give feed ${n}: 50 g each of N, P and K`,
      'Urea 110 g + SSP 310 g + MOP 85 g (50 g each of N, P₂O₅, K₂O)',
      'Papaya flowers and fruits non-stop and needs small, regular feeds',
    ),
    {
      key: 'zinc_boron_1',
      title: 'Spray zinc and boron on the leaves',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(120, 149),
      organic: '',
      chemical: ZINC_BORON,
      why: 'Better growth and fruit set',
    },
    {
      key: 'microbe_booster',
      title: 'Add Azospirillum and phosphobacteria',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(180, 209),
      organic:
        '20 g each of Azospirillum and phosphobacteria, mixed into a handful of FYM around the plant',
      why: 'Tops up the soil microbes at six months',
    },
    {
      key: 'zinc_boron_2',
      title: 'Spray zinc and boron again',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(240, 269),
      organic: '',
      chemical: ZINC_BORON,
      why: 'Better growth and fruit set',
    },
    males('1 male for every 20 females'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    NEMATODES,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [12, 31],
      'year_round',
      ['Water standing in the basin or touching the stem'],
      [
        'Mottled or curled leaves (virus)',
        'White cottony clusters (mealybug)',
        'Rot at the stem base',
      ],
    ),
  ],
};

const COASTAL_HUMID: RegionCare = {
  items: [
    {
      key: 'shade_new_plant',
      title: 'Shade and water the new seedling',
      category: 'WATERING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        'Shade the seedling until it settles. Water in a ring basin, not on the stem, if no rain falls',
      why: 'Young seedlings scorch; wet stems rot',
    },
    // KAU gives "bimonthly" with no start: the first feed is one interval after planting.
    ...feeds(
      12,
      60,
      (n) => `Give feed ${n}: 40 g N, 40 g P, 80 g K`,
      'Urea 87 g + SSP 250 g + MOP 135 g (40 g N, 40 g P₂O₅, 80 g K₂O)',
      'Regular feeding, potash-heavy for fruit',
    ),
    {
      key: 'monsoon_manure',
      title: 'Spread manure as the monsoon starts',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [6, 1], to: [6, 30] },
      organic:
        '10–25 kg FYM or compost a year, in the basin around the plant. Hand-dig and weed at the same time',
      why: 'The yearly organic feed, given when rain wets it in',
    },
    {
      key: 'winter_digging',
      title: 'Dig around the plant and pull weeds',
      category: 'GENERAL',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [1, 1], to: [2, 29] },
      organic: 'Hand-dig the basin lightly and pull the weeds',
      why: 'Papaya roots are shallow; weeds take their food',
    },
    {
      key: 'summer_water',
      title: 'Water in a ring through the dry months',
      category: 'WATERING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [1, 1], to: [5, 31] },
      organic:
        'Water grown plants every 4–5 days in a ring basin, never on the stem',
      why: 'Dry soil turns flowers male and drops fruit',
    },
    males('1 male for every 10 females'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    FRUIT_SPOTS,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [5, 31],
      'summer_dry',
      ['Letting the basin dry out', 'Water on the stem'],
      ['Mealybug'],
    ),
    phase(
      [6, 1],
      [9, 30],
      'monsoon',
      ['Water standing around the trunk'],
      ['Collar rot', 'Virus-infected plants'],
    ),
    phase(
      [10, 1],
      [12, 31],
      'post_monsoon',
      ['Water standing around the trunk'],
      ['Collar rot', 'Anthracnose on fruit'],
    ),
  ],
};

const EAST_INDIA: RegionCare = {
  items: [
    ...feeds(
      10,
      0,
      (n) => `Give feed ${n} of 10: 50 g each of N, P, K`,
      'Urea 110 g + SSP 310 g + MOP 85 g (50 g each of N, P₂O₅, K₂O)',
      'Small, regular feeds for a plant that fruits all year',
    ),
    males('1 male for every 10 females'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [12, 31],
      'year_round',
      ['Poor drainage'],
      ['Mosaic', 'Leaf curl', 'Ringspot', 'Mealybug'],
    ),
  ],
};

/** PAU's feed: 20 kg FYM and 1.25 kg of urea : SSP : MOP at 1 : 2 : ⅓, at each feed. */
const PAU_FEED = {
  organic: '20 kg well-rotted FYM in the basin',
  chemical: `With it: urea 375 g + SSP 750 g + MOP 125 g (1.25 kg of a 1 : 2 : ⅓ mix), ${PLACE}`,
};

const NORTH_INDIA: RegionCare = {
  items: [
    {
      key: 'frost_cover',
      title: 'Cover young papaya against frost',
      category: 'PROTECTION',
      stages: ['YOUNG'],
      when: { kind: 'CALENDAR', from: [11, 1], to: [2, 29] },
      organic:
        'Cover the plant with clear plastic, sarkanda, a straw thatch or similar. Take it off when frost is over',
      why: 'Papaya is very sensitive to frost',
    },
    {
      key: 'feed_feb',
      title: 'Give the February manure and fertiliser',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [2, 1], to: [2, 29] },
      ...PAU_FEED,
      why: 'Feeds the spring growth and fruit',
    },
    {
      key: 'feed_aug',
      title: 'Give the August manure and fertiliser',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [8, 1], to: [8, 31] },
      ...PAU_FEED,
      why: 'Feeds the monsoon flush and fruit',
    },
    males('1 male for every 10 females'),
    VIRUS,
    COLLAR_ROT,
    mealybug(false),
    POWDERY,
    FRUIT_SPOTS,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [11, 1],
      [2, 29],
      'frost_season',
      ['Leaving young plants uncovered', 'Wet soil'],
      ['Frost damage'],
    ),
    phase(
      [4, 1],
      [6, 30],
      'dry_heat',
      ['Letting the soil dry out (stress turns flowers male)'],
      ['Whitefly, which spreads leaf curl'],
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Irrigation water touching the stem', 'Standing water'],
      ['Collar and stem rot'],
    ),
    phase(
      [10, 1],
      [10, 31],
      'autumn',
      ['Transplanting after Oct 15'],
      ['Collar rot in wet soil'],
    ),
  ],
};

export const PAPAYA_CARE: FamilyCare = {
  family: 'papaya',
  sources: [
    'TNAU Crop Production Guide, Horticulture Crops 2020, papaya pp.33–34',
    'KAU Package of Practices Recommendations: Crops, 15th ed. 2016, papaya pp.221–222',
    'Assam Agricultural University, Package of Practices for Horticultural Crops of Assam 2023, papaya pp.27–29',
    'PAU Package of Practices for Cultivation of Fruits 2021, papaya pp.115–118',
    'National Horticulture Board papaya crop sheets pap002–pap007',
    'NIPHM/DPPQS AESA-based IPM package, Papaya',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  pendingRegions: ['WEST_INDIA', 'CENTRAL_INDIA'],
  regions: { SOUTH_DECCAN, COASTAL_HUMID, EAST_INDIA, NORTH_INDIA },
};
