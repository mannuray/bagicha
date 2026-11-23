import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Plum care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/plum.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * NORTH_INDIA = PAU; HILLS_COOL = UHF's mid-hill guide (Q3). The urea split is
 * tied to flowering, so it ships only as a conditional (Q2: the derived
 * Feb/Mar rows are held). No growth regulators (Q5), no lime sulphur (Q6): no
 * chemical survives the label check.
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

/** Rule 1 (UHF p.26): where manure and fertiliser go. */
const PLACED =
  'spread in the tree basin, about 30 cm from the trunk, and mixed in lightly. Water after. Wear gloves';
/** Bordeaux paste (PAU p.10, scaled down 1:40), cuts and wounds only. */
const PASTE =
  'Bordeaux paste (dissolve 50 g copper sulphate in 375 ml water; in a second pot, slake 75 g quicklime slowly with a little of another 375 ml of water, then add the rest; mix the two and stir; plastic or clay pot, never iron)';
/** Bordeaux paint (PAU p.10, scaled down 1:20). */
const PAINT =
  'Bordeaux paint (heat about 70 g copper sulphate crystals on an iron tawa until they crumble into a white powder; mix 50 g of the powder well with 100 g hydrated lime dust, then stir in 150 ml boiled linseed oil until smooth; it keeps in a closed pot)';

/** PAU p.104: FYM 6 kg, SSP 95 g and MOP 60 g × age, up to 6 years, together. */
const NORTH_MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 6000 }],
  chemical: [
    { what: 'SSP', grams: 95 },
    { what: 'MOP', grams: 60 },
  ],
  maxAgeYears: 6,
  together: true,
};
/** PAU p.104: urea 60 g × age up to 6 years, half before flowering (Q1). */
const NORTH_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 30 }],
  maxAgeYears: 6,
};
/** UHF p.47: P and K per year of age up to 7 years (Q4), as SSP and MOP. */
const HILLS_SSP_MOP_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 167 },
  ],
  maxAgeYears: 7,
};
/** UHF p.47: N 70 g × age (urea 152 g) up to 7 years, half before flowering. */
const HILLS_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 7,
};

const ureaBloom = (amount: string, dose: Dose): TreeCareItem => ({
  key: 'urea_bloom',
  title: 'Give half the urea before flowers open',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Flower buds swelling, before they open',
  organic: '',
  chemical: `Urea ${amount}, in the basin. Give the second half a month later, once fruit has set (SKUAST: 3 weeks after fruit set). Wear gloves`,
  dose,
  why: 'Feeds flowering and the spring flush',
});

const aphids = (extra: string): TreeCareItem => ({
  key: 'aphids',
  title: 'Wash aphids off curled shoots',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Leaves curled tightly on a limb, sticky honeydew, or pale green waxy aphids under the leaves',
  organic: `Hose the shoots and the undersides of leaves with a strong jet of water. Snip off and destroy tightly curled tips${extra}`,
  why: 'Aphids curl the leaves and stunt new shoots',
});

const zinc = (spray: string): TreeCareItem => ({
  key: 'zinc',
  title: 'Spray zinc on small, rosetted leaves',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Small, narrow leaves in rosettes at the shoot tips, yellow between the veins',
  organic: `${spray}. Spray when the symptoms show. It is a nutrient, so there is no waiting period. Wear gloves`,
  why: 'Zinc runs short on light soils in summer',
});

/** "Only if you see it": plant page only, in both regions. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'gummosis',
    title: 'Scrape gummy cankers and cover with paste',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Amber gum oozing from bark or branches; sunken cankers',
    organic: `Scrape the weeping canker back to clean wood. Cover it with ${PASTE} at the end of the dormant season and again before the rains. Burn the scrapings. Wear gloves`,
    why: 'Gummosis cankers spread and weaken the branch',
  },
  {
    key: 'beetles',
    title: 'Shake off leaf-eating beetles at dusk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Leaves eaten at night after the first monsoon rains',
    organic:
      'At dusk, spread a sheet under young trees, shake them, and drop the beetles into water with a little kerosene',
    why: 'Beetles can strip young trees in a few nights',
  },
  {
    key: 'scale',
    title: 'Cut out stems crusted with scale',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Grey scaly crusts on stems and twigs',
    organic: 'Cut out and destroy infested stems',
    why: 'Scale sucks sap and dries out twigs',
  },
  {
    key: 'borers',
    title: 'Clear borer holes and cut out bored wood',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Gum or reddish-orange frass and small holes on the trunk, at branch crotches or at the graft',
    organic:
      'Clear each hole with a flexible wire, push in a cotton wick soaked in petrol and seal it with wet mud. Cut out and destroy badly bored branches. Collect and destroy fallen fruit. Cover the sun-facing trunk with dry grass or gunny from March to October',
    why: 'Borers tunnel into the trunk and branches and weaken the tree',
  },
  {
    key: 'shot_hole',
    title: 'Clear away leaves with shot-hole spots',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Brown spots on leaves that drop out, leaving holes',
    organic: 'Collect and destroy fallen leaves',
    why: 'The spots spread from fallen leaves',
  },
  {
    key: 'suckers',
    title: 'Cut out suckers from the base',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots coming up from the base of the trunk',
    organic: 'Cut them out as they appear',
    why: 'Suckers take food from the fruiting branches',
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
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM, 6 kg × age up to 6 years (36 kg), ${PLACED}`,
      chemical:
        'SSP 95 g + MOP 60 g × age, up to 6 years (570 g + 360 g), in the same basin. Wear gloves',
      dose: NORTH_MANURE_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare, ready for spring',
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young (modified leader, 3 years): at planting (first half of January), cut back the soft top and cut any side branches to short stubs. At the first winter rest, keep 4–5 branches around the stem, 15–20 cm apart, the lowest about 45 cm up, and remove the rest. In the third year, keep wide-angled, well-spaced branches; when the frame is built, cut the top back to an outward-growing side branch. Bearing: a light prune; remove thin, crowding, crossing, dry and diseased twigs to let sun into the centre. Cut out water shoots and suckers. Every 4–5 years of fruiting, shorten long branches by half. Paste cuts thicker than 4–5 cm with ${PASTE} or ${PAINT}. Wear gloves`,
      why: 'Opens the tree to sun for colour and renews fruiting wood',
    },
    {
      key: 'water_summer',
      title: 'Water every 4–5 days through the summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        "Water every 4–5 days from April to June. Fruit grows fastest in April, so don't let the soil dry then. Young trees up to 3–4 years need the same",
      why: 'A plum short of water drops fruit and fails to crop',
    },
    {
      key: 'fruit_fly_apr',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([4, 8], [4, 14]),
      organic:
        'Hang a PAU fruit fly trap (a methyl eugenol lure in a trap, not sprayed on the tree) in the second week of April; recharge it after 30 days if needed. Pick up fallen fruit every few days and bury it at least 60 cm deep. After the last picking, dig the basin shallowly to expose pupae',
      why: 'Fruit flies are active on plum from the first week of April to mid-May',
    },
    {
      key: 'harvest',
      title: 'Pick plums ripe but firm, with the stalk on',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([5, 1], [5, 21]),
      organic:
        "Pick when the fruit has full size and the skin turns from green to its colour (crimson for Satluj Purple, dark purple for Kala Amritsari). Pick by the stalk, ripe but still firm, in the cool of the morning. Fruit ripens unevenly: pick over 2–3 rounds. Don't leave ripe fruit on the tree",
      why: 'Ripe fruit left on the tree draws fruit fly and spoils',
    },
    ureaBloom('30 g × age, up to 6 years (180 g)', NORTH_HALF_UREA_DOSE),
    aphids('. Leaf curl aphid is active March–May'),
    zinc('Zinc sulphate 6 g + unslaked lime 3 g per litre of water'),
    {
      key: 'fruit_size_kno3',
      title: 'Spray potassium nitrate after bloom for size',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Two weeks after full bloom, on Satluj Purple',
      organic:
        'Spray potassium nitrate 10 g per litre (1%), then again 10 days later. Water first: the tree must not be dry. It is a fertiliser, so there is no waiting period. Wear gloves',
      why: 'Optional: PAU gives it for bigger Satluj Purple fruit',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [1, 31],
      'dormant',
      ['Frequent watering (water only in a long dry spell)'],
      ['Gum oozing from bark', 'Scale on twigs'],
    ),
    phase(
      [3, 1],
      [5, 31],
      'fruit_growth',
      ['Letting the soil dry, above all in April'],
      ['Curled leaves from aphids', 'Fruit fly from the first week of April'],
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      [
        'Water standing in the basin',
        'Strong wind (plum orchards need a windbreak)',
      ],
      [
        'Leaf-eating beetles at night once the monsoon breaks',
        'Small, narrow, rosetted leaves at the tips (zinc)',
      ],
    ),
  ],
};

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'manure_winter',
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Well-rotted FYM: 10 kg at 1 year, 5 kg more each year, 40 kg from 7 years, ${PLACED}`,
      chemical:
        'SSP 219 g + MOP 167 g × age, up to 7 years (1.53 kg + 1.17 kg), in the same basin. Wear gloves',
      dose: HILLS_SSP_MOP_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare',
    },
    {
      key: 'prune_winter',
      title: 'Prune and train the tree while it is bare',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([12, 1], [2, 29]),
      organic: `Young (open centre): at planting, cut back to 40–60 cm. First winter: keep 3–5 well-spaced, wide-angled branches, remove the central stem, and shorten the kept branches by a quarter. Second winter: keep 2–3 side branches on each, 30–40 cm apart. Bearing: thin out about 30% of shoots and shorten the rest by a third to a half, for 25–50 cm of new growth a year; for Santa Rosa, head back by half and thin 25–30%. Remove dead, diseased and broken wood, and water shoots from the base. Paste every cut thicker than your thumb with ${PASTE}. Wear gloves`,
      why: 'Spurs bear for only 5–6 years; yearly pruning renews them',
    },
    {
      key: 'water_apr_jun',
      title: 'Water weekly once fruit has set',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        "After fruit set, water once a week from April to June; 6–8 waterings a season suit Santa Rosa. Don't water at full bloom, and stop when the fruit starts to colour: both cause drop. Mulch the basin with dry grass",
      why: 'Fruit size and quality depend on water while it grows',
    },
    ureaBloom('76 g × age, up to 7 years (532 g)', HILLS_HALF_UREA_DOSE),
    aphids(''),
    zinc('Zinc sulphate 4 g per litre'),
    {
      key: 'boron',
      title: 'Spray boric acid for corky, cracked fruit',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Misshapen fruit with corky spots that crack; dark, boat-shaped leaves; dying shoot tips',
      organic:
        'Boric acid 1 g per litre of water in June. It is a nutrient, so there is no waiting period. Wear gloves',
      why: 'Boron shortage cracks the fruit and kills shoot tips',
    },
    {
      key: 'fruit_fly_hills',
      title: 'Hang a fruit fly trap as fruit colours',
      category: 'PROTECTION',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Fruit colouring, or fruit with puncture marks oozing brown juice',
      organic:
        'Hang a methyl eugenol trap. Pick ripe fruit without delay. Collect fallen and stung fruit and bury it in a deep pit',
      why: 'Fruit fly maggots rot the ripening fruit',
    },
    {
      key: 'collar_rot',
      title: 'Open up and paint a rotting trunk base',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional: 'Bark rotting at the base of the trunk',
      organic: `In November–December, scrape the soil away from the collar and expose the rotted part to the sun. Scrape off the dead bark and cover the wound with ${PAINT}. Don't let water pool at the trunk. Wear gloves`,
      why: 'Collar rot girdles the trunk and can kill the tree',
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'dormant',
      ['Waterlogged basins'],
      ['Gum oozing from bark', 'Scale on stems'],
    ),
    phase(
      [4, 1],
      [6, 30],
      'fruit_growth',
      ['Watering at full bloom', 'Letting the soil dry while fruit grows'],
      ['Curled leaves with aphids', 'Fruit fly as fruit colours'],
    ),
    phase(
      [7, 1],
      [8, 31],
      'monsoon',
      ['Water pooling at the collar'],
      ['Gum from cankers', 'Bark rotting at the collar'],
    ),
  ],
};

export const PLUM_CARE: FamilyCare = {
  family: 'plum',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, plum pp.101–107, peach plant protection pp.85–87, Bordeaux p.10',
    'Dr YS Parmar UHF / HPHDP, Cultivation practices for stone fruits & walnut, plum pp.37–48, diseases pp.62–66, pests pp.68–69',
    'Dept of Horticulture HP with Dr YSPUHF, Spray Schedule 2022 (Peach, Plum, Apricot & Almond)',
    'Dr YSPUHF COHF Neri, Package of Practices for Subtropical Fruit Crops of HP (2022), plum pp.106–116',
    'SKUAST-Jammu, Package of Practices for Fruit Crops (2020), plum pp.108–111',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'HILLS_COOL'],
  regions: { NORTH_INDIA, HILLS_COOL },
};
