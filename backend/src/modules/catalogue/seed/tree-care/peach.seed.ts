import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Peach care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/peach.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * NORTH_INDIA = PAU (SKUAST subtropical as backing): its doses are banded by
 * age, so they are row text with no `dose` (Q1). HILLS_COOL = UHF, SKUAST and
 * HP-SS: only the four month-based rows are dated; the bloom-tied urea split
 * and hand thinning stay on the plant page (Q2). The hills dose is UHF's
 * per-year rule, up to 7 years (Q3). No dormant Bordeaux spray (Q4), no
 * oxydemeton-methyl (Q5), no growth regulators (Q6); Bordeaux paint stays as
 * the optional second coat (Q7). No chemical spray survives the label check.
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

/** Rule 2.1 (UHF p.26): basin placement for manure and fertiliser. */
const BASIN =
  'Spread it in the tree basin, about 30 cm from the trunk, mix it in lightly and water after';
/** Rule 2.3: Bordeaux paste (PAU p.10, scaled down 1:40). */
const PASTE =
  'Bordeaux paste (dissolve 50 g copper sulphate in 375 ml water; in a second pot, slake 75 g quicklime slowly with a little of another 375 ml of water, then add the rest; mix the two and stir; plastic or clay pot, never iron)';
/** Rule 2.3: Bordeaux paint (PAU p.10, scaled down 1:20); lasts about a year. */
const PAINT =
  'Bordeaux paint (heat about 70 g copper sulphate crystals on an iron tawa until they crumble into a white powder and weigh out 50 g; mix it well with 100 g hydrated lime dust, then stir in 150 ml boiled linseed oil until smooth; it keeps in a closed pot)';
/** PAU p.83: half the year's urea, by age band (Q1: text, no `dose`). */
const HALF_UREA_BANDS =
  '90–180 g (1–2 years), 270–500 g (3–4), 500 g (5+), spread in the basin and watered in. Wear gloves';

/** UHF p.35: SSP 219 g + MOP 167 g per year of age, up to 7 years (Q3). */
const HILLS_PK_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 167 },
  ],
  maxAgeYears: 7,
};
/** UHF p.35: half of 152 g urea per year of age, up to 7 years (Q3). */
const HILLS_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 7,
};

/** C1: shared by both regions; North adds PAU's active months. */
const APHIDS: TreeCareItem = {
  key: 'aphids',
  title: 'Wash aphids off buds and shoots',
  category: 'PROTECTION',
  stages: BEARING,
  when: ALL_YEAR,
  conditional:
    'Leaves curling and yellowing at the shoot tips, or clusters of green or black aphids on buds, shoots or bark',
  organic:
    'Hose the shoots and the undersides of leaves with a strong jet of water. Snip off and destroy tightly curled tips',
  why: 'Aphids suck sap from buds and new shoots and curl the leaves',
};

/** "Only if you see it" in both regions (C4, C5, C6, C9). */
const SIGNS_BOTH: TreeCareItem[] = [
  {
    key: 'gummosis',
    title: 'Scrape gummy cankers and cover with paste',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Amber gum oozing from bark, branches or fruit; sunken cankers',
    organic: `Scrape the weeping canker back to clean wood with a clean knife. Cover it with ${PASTE}. Do this at the end of the dormant season and again before the rains, and on any new lesions. Burn the scrapings. Wear gloves`,
    why: 'Gum oozes from cankers that weaken the bark and let disease in',
  },
  {
    key: 'flat_headed_borer',
    title: 'Clear borer holes and shade the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Gum globules and small holes on the trunk or main branches; bark loose or split',
    organic:
      "Clear each hole with a flexible wire. Push in a cotton wick soaked in petrol and seal the hole with wet mud. Cover the sun-facing trunk and main branches with dry grass or gunny from March to October. Train the tree so direct sun doesn't fall on the trunk",
    why: 'Borer grubs tunnel under the bark of sun-scorched trunks and branches',
  },
  {
    key: 'beetles',
    title: 'Shake off leaf-eating beetles at dusk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves eaten at night after the first monsoon rains; fruit scraped at the tip',
    organic:
      'At dusk, spread a sheet under young trees and shake them. Drop the beetles into water with a little kerosene. Pick grubs out of the basin soil when you dig',
    why: 'Beetles strip the leaves at night once the monsoon breaks',
  },
  {
    key: 'shot_hole',
    title: 'Clear away leaves with shot-hole spots',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Brown spots on leaves that drop out, leaving holes',
    organic: 'Collect and destroy fallen leaves',
    why: 'The disease carries over on fallen leaves',
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
      organic: `Well-rotted FYM by age: 10–15 kg (1–2 years), 20–25 kg (3–4), 30 kg (5+). ${BASIN}`,
      chemical:
        'SSP and MOP by age, in the same basin: SSP 190–380 g and MOP 150–300 g (1–2 years), SSP 570–760 g and MOP 450–830 g (3–4), SSP 760 g and MOP 830 g (5+). Wear gloves',
      why: 'Manure and slow nutrients go in while the tree is bare, ready for spring',
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young: at planting, cut back to about 90 cm and cut side shoots to 1–2 buds. At the first January pruning, keep 4–5 well-spaced branches around the stem, the lowest 45 cm up, and remove the rest. Next year keep 3–4 more on the central stem, then cut the top back to an outward-growing side branch. Bearing: thin out about 40% of last year's shoots; shorten long, hanging and badly placed branches. Paste every cut thicker than 5 cm with ${PASTE}. A week or two later, paint over it with ${PAINT}. Wear gloves`,
      why: 'Fruit comes only on one-year-old shoots; pruning makes new ones and bigger fruit',
    },
    {
      key: 'urea_jan',
      title: "Give half the year's urea after pruning",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: '',
      chemical: `Half the year's urea: ${HALF_UREA_BANDS}`,
      why: 'Feeds the spring flush and the flowers',
    },
    {
      key: 'urea_mar',
      title: 'Give the other half of the urea after fruit set',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([3, 1], [3, 31]),
      organic:
        'After this feed, mulch the basin with 10 cm of paddy straw to hold moisture and keep weeds down',
      chemical: `The other half of the urea: ${HALF_UREA_BANDS}`,
      why: 'Feeds the young fruit',
    },
    {
      key: 'thin_fruit',
      title: "Thin the fruit to a hand's width apart",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([3, 8], [3, 31]),
      organic:
        'Shake each fruiting branch gently first: weak fruit drops by itself. Then pick off fruit from the base of the branch to the tip, leaving one every 10–15 cm. Finish before the stone inside hardens. Partap: weeks 2–3 of March. Shan-i-Punjab: weeks 3–4',
      why: 'An unthinned tree gives small, poor fruit and weakens',
    },
    {
      key: 'water_fruit',
      title: 'Water often while the fruit fills, until picking',
      category: 'WATERING',
      stages: BEARING,
      when: cal([3, 1], [5, 7]),
      organic:
        'Water weekly for the first 3–4 weeks after fruit set. From the second week of April until picking, water every 3–4 days. Never let the tree go dry in the last 25–30 days before the fruit ripens. Most critical: end March to 3rd week April (Partap, Florda Prince); mid April to 1st week May (Shan-i-Punjab)',
      why: 'The fruit puts on most of its weight in the last month',
    },
    {
      key: 'fruit_fly_may',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([5, 1], [5, 7]),
      organic:
        "Hang a PAU fruit fly trap (a methyl eugenol lure in a trap, not sprayed on the tree) in the first week of May; recharge it after 30 days if needed. Pick fruit as it ripens; don't leave ripe fruit on the tree. Pick up fallen fruit every few days and bury it at least 60 cm deep. After the last picking, dig the basin shallowly to expose pupae",
      why: 'Fruit flies sting fruit near maturity from early May; the maggots rot it',
    },
    {
      key: 'harvest',
      title: 'Pick peaches as the green turns yellow',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([4, 15], [5, 15]),
      organic:
        'Pick when the ground colour turns from green to yellow and the fruit gives slightly between cupped hands. White-fleshed kinds turn straw-coloured with a pink blush. Fruit ripens over 3–4 pickings. Cool picked fruit in shade',
      why: 'Peaches ripen unevenly; ripe fruit left on the tree draws fruit fly',
    },
    {
      ...APHIDS,
      organic: `${APHIDS.organic}. Leaf curl aphid is active March–May, black aphid on bark April–June`,
    },
    {
      key: 'iron_chlorosis',
      title: 'Spray iron sulphate on yellowing new leaves',
      category: 'FEEDING',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'New leaves at the shoot tips yellow between the veins, or nearly white',
      organic:
        'Spray ferrous sulphate 3 g per litre of water on the new flush: in the spring flush (April), the summer flush (June) and the late flush (August–September). It is a nutrient, so there is no waiting period. Wear gloves',
      why: 'Iron runs short on light, high-pH soils from the second half of March',
    },
    ...SIGNS_BOTH,
    {
      key: 'crown_gall',
      title: 'Remove a tree with crown gall',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Lumps or tumours at the base of the trunk, on roots or at the graft',
      organic:
        'Dig out and destroy the affected tree. Avoid injuring the roots and crown when digging. Buy plants from a reliable nursery',
      why: 'Crown gall gets in through wounds and has no cure',
    },
  ],
  phases: [
    phase(
      [12, 1],
      [1, 31],
      'dormant',
      [
        'Injuring roots or the crown while digging (crown gall gets in through wounds)',
      ],
      ['Tumours at the crown or graft'],
    ),
    phase(
      [3, 1],
      [5, 31],
      'fruit_growth',
      ['Letting the soil dry, worst in the last 25–30 days before picking'],
      [
        'Curled leaves from aphids (Mar–May)',
        'Black aphids on bark (Apr–Jun)',
        'Flat-headed borer adults from mid-March',
        'Fruit fly from early May',
      ],
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Water standing in the basin (peach dislikes wet, heavy soil)'],
      [
        'Leaf-eating beetles at night once the monsoon breaks',
        'Yellow new leaves (iron)',
      ],
    ),
  ],
};

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'manure_dec',
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM: 10 kg at 1 year, 5 kg more each year, 40 kg from 7 years. ${BASIN}`,
      chemical: 'SSP and MOP in the same basin. Wear gloves',
      dose: HILLS_PK_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare',
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young (open centre): at planting, cut back to 40–60 cm. First winter: keep 3–4 wide-angled, well-spaced branches, remove the central stem, and shorten the kept branches by a quarter to a half. Second winter: keep 2–3 side branches on each, 30–40 cm apart. Bearing: thin out 40–50% of last year's shoots and shorten the rest; aim for 30–40 cm of new growth a year. Remove dead, diseased and broken branches. Paste every cut thicker than your thumb with ${PASTE}. Wear gloves`,
      why: "Fruit comes only on last season's shoots; a branch that has fruited never fruits again",
    },
    {
      key: 'water_apr_jun',
      title: 'Water every 8–10 days while fruit grows',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 8–10 days from April to June. Mulch the basin with 10 cm of dry grass to hold moisture. Never let water stand: peach roots die if flooded in warm weather',
      why: 'Dry soil in the hot months drops fruit and shrinks it',
    },
    {
      key: 'fruit_fly_trap',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([4, 1], [8, 31]),
      organic:
        "Hang a methyl eugenol trap in the tree from April; refresh the lure as the pack says. Pick fruit as soon as it is ripe; don't delay the harvest. Collect fallen and stung fruit every week and bury it in a deep pit",
      why: 'Fruit fly is a major pest of peach; late varieties suffer most',
    },
    APHIDS,
    {
      key: 'leaf_curl',
      title: 'Pick off leaves puckered by leaf curl',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Young leaves thick, puckered and curled, turning pink or red-bronze',
      organic:
        'Pick off and destroy curled leaves as they appear. Rake up and destroy fallen leaves in autumn',
      why: 'Leaf curl fungus carries over on the tree and fallen leaves',
    },
    ...SIGNS_BOTH,
    {
      key: 'scale',
      title: 'Cut out branches crusted with scale',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Grey scaly crusts on bark, or grey spots ringed with red on fruit',
      organic: 'Cut out and destroy branches thick with scale',
      why: 'Scale insects suck sap from the bark and weaken branches',
    },
    {
      key: 'fruit_fly_hills',
      title: 'Bury stung fruit; pick on time',
      category: 'PROTECTION',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Fruit with small puncture marks that ooze brown juice, or fallen soft fruit',
      organic:
        'Pick ripe fruit without delay. Collect fallen and stung fruit weekly and bury it in a deep pit. Keep the fruit fly trap up',
      why: 'Maggots in stung fruit become the next round of flies',
    },
    {
      key: 'collar_rot',
      title: 'Open up and paint a rotting trunk base',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional: 'Bark rotting at the base of the trunk, with bronzed leaves',
      organic: `In November–December, scrape the soil away from the collar and expose the rotted part to the sun. Scrape off the dead bark and cover the wound with ${PAINT}. Don't let water pool at the trunk. Wear gloves`,
      why: 'Collar rot girdles the trunk where water stands',
    },
    {
      key: 'urea_bloom',
      title: 'Give half the urea as buds swell',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Flower buds swelling, about 2–3 weeks before they open',
      organic: '',
      chemical:
        'Urea in the basin. Give the second half 3 weeks to a month after fruit set. Wear gloves',
      dose: HILLS_HALF_UREA_DOSE,
      why: 'Feeds the flowers and the setting fruit; bloom shifts by weeks with altitude',
    },
    {
      key: 'thin_hills',
      title: 'Thin crowded young fruit',
      category: 'PRUNING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Fruit set very heavily, in clusters',
      organic:
        'Shake the branches first. Then thin from the top of each branch down, leaving fruit 5–7.5 cm apart (about 30–40 leaves per fruit). Finish before the stone hardens',
      why: 'Crowded fruit stays small and weakens the tree',
    },
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'dormant',
      ['Planting or pruning in hard frost', 'Waterlogged basins'],
      ['Gum oozing from bark', 'Scale on bark'],
    ),
    phase(
      [4, 1],
      [6, 30],
      'fruit_growth',
      ['Letting the soil dry', 'Standing water'],
      [
        'Curled, puckered red leaves (leaf curl)',
        'Aphids at pink bud',
        'Fruit fly from April',
      ],
    ),
    phase(
      [7, 1],
      [8, 31],
      'monsoon',
      ['Water pooling at the collar'],
      [
        'Bark rotting at the collar',
        'Gum from cankers',
        'Leaf-eating beetles after the first rains',
      ],
    ),
  ],
};

export const PEACH_CARE: FamilyCare = {
  family: 'peach',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, peach pp.77–87, Bordeaux paste and paint p.10',
    'Dr YS Parmar UHF / HPHDP, Cultivation practices for stone fruits & walnut, peach pp.27–36, diseases pp.62–66, pests pp.68–69',
    'Dept of Horticulture HP with Dr YSPUHF, Spray Schedule 2022 (Peach, Plum, Apricot & Almond)',
    'SKUAST-Jammu Package of Practices for Fruit Crops (2020), peach pp.102–107',
    'Dr YSPUHF Package of Practices for Subtropical Fruit Crops of HP (2022), plum p.109 (cut paste size)',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'HILLS_COOL'],
  regions: { NORTH_INDIA, HILLS_COOL },
};
