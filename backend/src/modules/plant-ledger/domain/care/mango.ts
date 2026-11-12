import type {
  CareItem,
  Dose,
  FamilyCare,
  MonthDay,
  PhaseWindow,
  RegionCare,
} from './types';

/**
 * Mango care, transcribed from the source-checked table approved on 2026-11-12
 * (docs/plant-care/mango.md, with a source for every row). Change it only
 * through the add-plant playbook: source check, then the owner's yes.
 *
 * Timing groups: A = North + East (same flowering Feb–Mar, harvest Jun–Aug);
 * CENTRAL; WEST (as Central but no frost — Gujarat frost unverified); SOUTH =
 * South Deccan; COAST = Coastal humid (from Konkan and coastal AP/TN sources;
 * Kerala's earlier season unverified).
 */
type Group = 'A' | 'CENTRAL' | 'WEST' | 'SOUTH' | 'COAST';
type Window = [MonthDay, MonthDay];
type Windows = Partial<Record<Group, Window | Window[]>>;

/** NHB-7: per year of age, up to 10 years; FYM once a year, NPK in two halves. */
const MAIN_FEED_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 155 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};
const SECOND_FEED_DOSE: Dose = { ...MAIN_FEED_DOSE, organic: [] };

interface ItemSpec extends Omit<CareItem, 'when'> {
  windows: Windows;
}

const BEARING: ItemSpec[] = [
  {
    key: 'prune_after_harvest',
    title: 'Prune dead and crossing branches',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut dead, diseased and inward branches; seal big cuts with Bordeaux paste (1 kg copper sulphate + 1 kg lime in 10 L water)',
    why: 'Light into the canopy: less disease, better flowering',
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 15],
        [7, 31],
      ],
      WEST: [
        [6, 15],
        [7, 31],
      ],
      SOUTH: [
        [6, 1],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 20],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Main feed after harvest',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "All the year's FYM in a ring under the canopy edge, mixed into the soil",
    chemical:
      "Half the year's urea + SSP + MOP in the same ring, then water in; wear gloves",
    dose: MAIN_FEED_DOSE,
    why: 'Recovery after fruiting; builds next season’s shoots',
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 20],
        [7, 31],
      ],
      WEST: [
        [6, 20],
        [7, 31],
      ],
      SOUTH: [
        [6, 15],
        [7, 31],
      ],
      COAST: [
        [5, 20],
        [6, 30],
      ],
    },
  },
  {
    key: 'second_feed',
    title: 'Second feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: "None now: all the year's FYM went in with the main feed",
    chemical:
      'Other half of urea + SSP + MOP in the ring; water in if there is no rain; wear gloves',
    dose: SECOND_FEED_DOSE,
    why: 'Last feed before the dry spell that brings flowers',
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
      CENTRAL: [
        [9, 1],
        [9, 30],
      ],
      WEST: [
        [9, 1],
        [9, 30],
      ],
      SOUTH: [
        [9, 1],
        [9, 30],
      ],
      COAST: [
        [8, 15],
        [9, 30],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water before flowering',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Don't water bearing trees now (young trees still need water); in coastal areas the rains usually cover this",
    why: 'A dry spell makes the tree flower; water now gives leaves, not flowers',
    windows: {
      A: [
        [10, 15],
        [1, 15],
      ],
      CENTRAL: [
        [10, 1],
        [12, 15],
      ],
      WEST: [
        [10, 1],
        [12, 15],
      ],
      SOUTH: [
        [10, 1],
        [11, 30],
      ],
      COAST: [
        [9, 15],
        [11, 30],
      ],
    },
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Dig the soil around the trunk; by mid-December tie a 20–25 cm wide polythene band (400 gauge) 30–50 cm up, with grease or mud on its lower edge; wipe it through Jan–Feb',
    chemical:
      'If young bugs still climb: spirotetramat + imidacloprid 11.01% SC 0.75 ml per litre; wear gloves; not within 15 days of picking',
    why: 'Stops mealybugs reaching the flowers in Jan–Feb',
    windows: {
      A: [
        [11, 15],
        [12, 15],
      ],
    },
  },
  {
    key: 'hopper_spray',
    title: 'Spray for hoppers as flowers appear',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Azadirachtin 3000 ppm, 2 ml per litre (or 1500 ppm, 4 ml) when flower stalks appear',
    chemical:
      'Imidacloprid 17.8 SL 0.3 ml per litre; wear gloves; not within 45 days of picking',
    why: 'Hoppers suck the new flower stalks. Never spray in full bloom (bees)',
    windows: {
      A: [
        [2, 10],
        [3, 10],
      ],
      CENTRAL: [
        [1, 10],
        [2, 10],
      ],
      WEST: [
        [1, 10],
        [2, 10],
      ],
      SOUTH: [
        [12, 15],
        [1, 31],
      ],
      COAST: [
        [11, 20],
        [12, 31],
      ],
    },
  },
  {
    key: 'mildew_spray',
    title: 'Spray against powdery mildew',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Wettable sulphur 2–3 g per litre when flower stalks are 3–4 inches long; repeat after 15–20 days',
    chemical:
      'Hexaconazole 5 EC 1 ml per litre; wear gloves; not within 30 days of picking',
    why: 'White powder on the flowers makes them drop',
    windows: {
      A: [
        [2, 10],
        [3, 10],
      ],
      CENTRAL: [
        [1, 10],
        [2, 10],
      ],
      WEST: [
        [1, 10],
        [2, 10],
      ],
      SOUTH: [
        [12, 15],
        [1, 31],
      ],
      COAST: [
        [11, 20],
        [12, 31],
      ],
    },
  },
  {
    key: 'water_after_set',
    title: 'Water every 10–15 days after fruit set',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'Water deeply from pea-size fruit until harvest',
    why: 'Steady water stops fruit drop and grows bigger fruit',
    windows: {
      A: [
        [3, 20],
        [4, 10],
      ],
      CENTRAL: [
        [2, 20],
        [3, 15],
      ],
      WEST: [
        [2, 20],
        [3, 15],
      ],
      SOUTH: [
        [2, 1],
        [2, 28],
      ],
      COAST: [
        [1, 10],
        [1, 31],
      ],
    },
  },
  {
    key: 'fruit_fly_trap',
    title: 'Hang a fruit fly trap, pick fallen fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      '1 methyl eugenol trap per tree at mid-canopy, lure changed every 2–3 weeks; bury fallen fruit',
    why: 'Fruit fly maggots spoil ripe fruit; the trap catches the males',
    windows: {
      A: [
        [5, 1],
        [8, 15],
      ],
      CENTRAL: [
        [4, 1],
        [6, 15],
      ],
      WEST: [
        [4, 1],
        [6, 15],
      ],
      SOUTH: [
        [3, 15],
        [7, 15],
      ],
      COAST: [
        [2, 15],
        [5, 15],
      ],
    },
  },
  {
    key: 'copper_spray',
    title: 'Spray copper after the monsoon flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Copper oxychloride 50 WG 2.4 g per litre on the new leaves (allowed in organic growing)',
    why: 'Stops anthracnose spots on new leaves and flowers',
    windows: {
      SOUTH: [
        [10, 1],
        [10, 31],
      ],
      COAST: [
        [10, 15],
        [11, 15],
      ],
    },
  },
  {
    key: 'pick_with_stalk',
    title: 'Pick fruit with a stalk',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'Pick with a 10–20 cm stalk; keep fruit stalk-down for a while so the sap drains',
    why: 'Sap burns the skin and spoils the fruit',
    windows: {
      A: [
        [6, 10],
        [8, 15],
      ],
      CENTRAL: [
        [5, 1],
        [6, 30],
      ],
      WEST: [
        [5, 1],
        [6, 30],
      ],
      SOUTH: [
        [4, 1],
        [7, 15],
      ],
      COAST: [
        [3, 15],
        [5, 31],
      ],
    },
  },
];

const ALL_YEAR: Window = [
  [1, 1],
  [12, 31],
];

/** Only if you see it: on the plant page, never reminders. */
const CONDITIONAL: ItemSpec[] = [
  {
    key: 'hopper_repeat',
    title: 'Repeat the hopper spray',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'More than 5 hoppers per flower stalk at pea-size fruit',
    organic: 'Repeat the azadirachtin spray',
    chemical:
      'Imidacloprid 17.8 SL 0.3 ml per litre; wear gloves; not within 45 days of picking',
    why: 'A second wave of hoppers can still drop young fruit',
    // Pea-size fruit: the fruit-development months of the approved phase table.
    windows: {
      A: [
        [4, 1],
        [5, 31],
      ],
      CENTRAL: [
        [3, 1],
        [4, 30],
      ],
      WEST: [
        [3, 1],
        [4, 30],
      ],
      SOUTH: [
        [2, 1],
        [3, 31],
      ],
      COAST: [
        [1, 1],
        [2, 28],
      ],
    },
  },
  {
    key: 'stem_borer',
    title: 'Treat stem borer holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Holes with sawdust on the trunk or branches',
    organic:
      'Hook out the grub with wire, plug the hole with cotton soaked in a little kerosene, seal with mud; cut and burn badly bored branches',
    why: 'Borers hollow the trunk and can kill branches',
    windows: {
      A: ALL_YEAR,
      CENTRAL: ALL_YEAR,
      WEST: ALL_YEAR,
      SOUTH: ALL_YEAR,
      COAST: ALL_YEAR,
    },
  },
  {
    key: 'malformation',
    title: 'Cut off malformed flower bunches',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Flower bunches that are bunched up and malformed',
    organic: 'Cut them off with 15–20 cm of healthy wood and burn them',
    why: 'Malformed bunches never fruit and spread the problem',
    // Flowering months of the approved phase table.
    windows: {
      A: [
        [2, 1],
        [3, 31],
      ],
      CENTRAL: [
        [1, 1],
        [2, 28],
      ],
      WEST: [
        [1, 1],
        [2, 28],
      ],
      SOUTH: [
        [12, 1],
        [1, 31],
      ],
      COAST: [
        [11, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'blossom_blight',
    title: 'Spray against blossom blight',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Humid, cloudy weather while the tree is flowering',
    organic: 'No verified organic spray for this; use the alternative below',
    chemical:
      'Azoxystrobin 23 SC 1 ml per litre; wear gloves; not within 5 days of picking',
    why: 'Blight blackens flowers in damp weather',
    windows: {
      // Coastal flowering (Nov–Dec), per the approved phase table.
      COAST: [
        [11, 1],
        [12, 31],
      ],
    },
  },
];

const YOUNG: ItemSpec[] = [
  {
    key: 'feed_young',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: "The year's FYM in a ring 30 cm from the trunk",
    chemical: 'Urea + SSP + MOP in the same ring, then water in; wear gloves',
    dose: MAIN_FEED_DOSE,
    why: 'Steady growth for a strong frame',
    windows: {
      A: [
        [7, 1],
        [7, 31],
      ],
      CENTRAL: [
        [6, 20],
        [7, 20],
      ],
      WEST: [
        [6, 20],
        [7, 20],
      ],
      SOUTH: [
        [6, 15],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 30],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Second feed for the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: "None now: all the year's FYM went in with the first feed",
    chemical: 'Urea + SSP + MOP in the ring, then water in; wear gloves',
    dose: SECOND_FEED_DOSE,
    why: 'Keeps growth steady into the cool months',
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
      CENTRAL: [
        [9, 1],
        [9, 30],
      ],
      WEST: [
        [9, 1],
        [9, 30],
      ],
      SOUTH: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree through the dry months',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'First year every 2–3 days, years 2–3 every 4–5 days; mulch the basin',
    why: 'Young roots dry out fast',
    windows: {
      A: [
        [10, 15],
        [6, 20],
      ],
      CENTRAL: [
        [10, 1],
        [6, 15],
      ],
      WEST: [
        [10, 1],
        [6, 15],
      ],
      SOUTH: [
        [10, 1],
        [5, 31],
      ],
      COAST: [
        [12, 1],
        [5, 15],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover the young tree on cold nights',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic: 'Thatch or wrap it with straw or jute',
    why: 'Frost kills young mango shoots',
    windows: {
      A: [
        [12, 15],
        [1, 31],
      ],
      CENTRAL: [
        [12, 20],
        [1, 20],
      ],
    },
  },
  {
    key: 'remove_flowers',
    title: 'Pick off all flowers on the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic: 'Remove every flower bunch for the first 3–4 years',
    why: 'Fruiting too early stunts the tree',
    windows: {
      A: [
        [2, 10],
        [3, 20],
      ],
      CENTRAL: [
        [1, 10],
        [2, 20],
      ],
      WEST: [
        [1, 10],
        [2, 20],
      ],
      SOUTH: [
        [12, 15],
        [2, 10],
      ],
      COAST: [
        [11, 20],
        [1, 10],
      ],
    },
  },
  {
    key: 'shape_young',
    title: 'Shape the young tree to 3–4 main branches',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Clear the trunk to about 75 cm; keep 3–4 branches facing different ways, 20–25 cm apart; remove crossing shoots while pencil-thick',
    why: 'A low, open frame is easy to care for and harvest',
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 15],
        [7, 31],
      ],
      WEST: [
        [6, 15],
        [7, 31],
      ],
      SOUTH: [
        [6, 1],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 20],
      ],
    },
  },
];

type PhaseSpec = Omit<PhaseWindow, 'when' | 'stages'> & {
  months: Partial<Record<Group, [number, number]>>;
};

const lastDay = (month: number) =>
  new Date(Date.UTC(2026, month, 0)).getUTCDate();

const PHASES: PhaseSpec[] = [
  {
    phase: 'post_harvest_recovery',
    avoid: ['Heavy pruning after September'],
    watch: ['Leaf spots in the rain', 'Stem borer'],
    months: {
      A: [7, 9],
      CENTRAL: [6, 8],
      WEST: [6, 8],
      SOUTH: [6, 8],
      COAST: [6, 8],
    },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Heavy watering', 'Extra nitrogen beyond the schedule'],
    watch: ['Mealybug', 'Shoot gall'],
    months: { A: [10, 1] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Heavy watering', 'Extra nitrogen beyond the schedule'],
    watch: [],
    months: {
      CENTRAL: [10, 12],
      WEST: [10, 12],
      SOUTH: [10, 11],
      COAST: [9, 10],
    },
  },
  {
    phase: 'flowering',
    avoid: ['Insecticide in full bloom (bees)', 'Heavy watering'],
    watch: ['Hoppers', 'Powdery mildew', 'Malformed flowers'],
    months: {
      A: [2, 3],
      CENTRAL: [1, 2],
      WEST: [1, 2],
      SOUTH: [12, 1],
      COAST: [11, 12],
    },
  },
  {
    phase: 'fruit_development',
    avoid: ['Letting the soil dry out'],
    watch: ['Fruit drop', 'Fruit fly'],
    months: {
      A: [4, 5],
      CENTRAL: [3, 4],
      WEST: [3, 4],
      SOUTH: [2, 3],
      COAST: [1, 2],
    },
  },
  {
    phase: 'harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Stem-end rot'],
    months: {
      A: [6, 6],
      CENTRAL: [5, 5],
      WEST: [5, 5],
      SOUTH: [4, 5],
      COAST: [3, 5],
    },
  },
];

function regionCare(group: Group): RegionCare {
  const items: CareItem[] = [...BEARING, ...CONDITIONAL, ...YOUNG].flatMap(
    ({ windows, ...item }) => {
      const w = windows[group];
      if (!w) return [];
      const list = Array.isArray(w[0][0]) ? (w as Window[]) : [w as Window];
      return list.map(([from, to]) => ({
        ...item,
        when: { kind: 'CALENDAR' as const, from, to },
      }));
    },
  );
  const phase = (specs: PhaseSpec[], stages: PhaseWindow['stages']) =>
    specs.flatMap(({ months, ...p }) => {
      const m = months[group];
      if (!m) return [];
      const [from, to] = m;
      return [
        {
          ...p,
          stages,
          when: {
            kind: 'CALENDAR' as const,
            from: [from, 1] as MonthDay,
            to: [to, lastDay(to)] as MonthDay,
          },
        },
      ];
    });
  return {
    items,
    // Young trees have no phase table in the approved content: they read as 'growing'.
    phases: phase(PHASES, ['BEARING']),
  };
}

export const MANGO_CARE: FamilyCare = {
  family: 'mango',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'DPPQS IPM Package of Practices for Mango (2022, CISH-reviewed)',
    'NHM IPM schedule for mango (agritech.tnau.ac.in)',
    'National Horticulture Board mango pages (nhb.gov.in)',
    'PAU Package of Practices for Fruits',
    'TNAU Agritech mango',
    'KAU mango',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  regions: {
    NORTH_INDIA: regionCare('A'),
    // Same flowering (Feb–Mar) and harvest (Jun–Aug) in the eastern plains.
    EAST_INDIA: { sameAs: 'NORTH_INDIA' },
    CENTRAL_INDIA: regionCare('CENTRAL'),
    WEST_INDIA: regionCare('WEST'),
    SOUTH_DECCAN: regionCare('SOUTH'),
    COASTAL_HUMID: regionCare('COAST'),
  },
};
