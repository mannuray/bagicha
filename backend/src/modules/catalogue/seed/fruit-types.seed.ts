/**
 * Fruit types: the names that identify each one in what people type, and its life profile. Edit here, then run the catalogue push (docs/deploy.md); the
 * API reads the database, not this file. Change values only through the
 * add-plant playbook: source check, then the owner's yes.
 */
import type { FruitTypeSeed } from '../domain/types';

export const FRUIT_TYPE_SEED: FruitTypeSeed[] = [
  {
    key: 'mango',
    match_aliases: [
      'mango',
      'malda',
      'langra',
      'dussehri',
      'dashehari',
      'alphonso',
      'chausa',
      'himsagar',
      'banganapalli',
      'totapuri',
      'kesar',
      'amrapali',
      'fazli',
      'hapus',
      'dasheri',
      'chaunsa',
      'mallika',
      'benishan',
    ],
    life: {
      first_fruit_months: [36, 60],
      productive_until_months: [480, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'citrus',
    match_aliases: [
      'citrus',
      'lemon',
      'lime',
      'orange',
      'mosambi',
      'mausambi',
      'sweet lime',
      'kinnow',
      'mandarin',
      'kagzi',
      'gondhoraj',
      'galgal',
      'santra',
      'pomelo',
      'chakotra',
    ],
    life: {
      first_fruit_months: [24, 48],
      productive_until_months: [240, 360],
      lifespan_months: [360, 600],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'litchi',
    match_aliases: ['litchi', 'lychee', 'shahi', 'china'],
    life: {
      first_fruit_months: [48, 72],
      productive_until_months: [480, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'guava',
    match_aliases: ['guava', 'allahabad safeda', 'lalit', 'lucknow 49'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [180, 300],
      lifespan_months: [360, 480],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'pomegranate',
    match_aliases: ['pomegranate', 'anar', 'bhagawa', 'bhagwa', 'kandhari'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [180, 240],
      lifespan_months: [300, 360],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'banana',
    match_aliases: [
      'banana',
      'plantain',
      'grand naine',
      'g9',
      'robusta',
      'kela',
      'malbhog',
      'poovan',
      'nendran',
      'yelakki',
      'basrai',
    ],
    life: {
      first_fruit_months: [9, 15],
      productive_until_months: [36, 60],
      lifespan_months: [60, 96],
      note_key: 'banana',
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'papaya',
    match_aliases: ['papaya', 'papita', 'red lady'],
    life: {
      first_fruit_months: [8, 12],
      productive_until_months: [24, 36],
      lifespan_months: [48, 72],
      note_key: 'papaya',
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'grape',
    match_aliases: ['grape', 'angoor', 'angur'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [240, 360],
      lifespan_months: [480, 720],
      note_key: 'grape',
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'jackfruit',
    match_aliases: ['jackfruit', 'jack fruit', 'kathal'],
    life: {
      first_fruit_months: [48, 96],
      productive_until_months: [600, 840],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'coconut',
    match_aliases: ['coconut', 'nariyal'],
    life: {
      first_fruit_months: [48, 84],
      productive_until_months: [600, 840],
      lifespan_months: [720, 960],
      note_key: 'coconut',
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'sapota',
    match_aliases: ['sapota', 'chikoo', 'chiku', 'sapodilla', 'kalipatti'],
    life: {
      first_fruit_months: [36, 60],
      productive_until_months: [480, 720],
      lifespan_months: [720, 960],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'amla',
    match_aliases: ['amla', 'aonla', 'indian gooseberry'],
    life: {
      first_fruit_months: [36, 60],
      productive_until_months: [480, 600],
      lifespan_months: [600, 720],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'custard_apple',
    match_aliases: ['custard apple', 'sitaphal', 'sharifa', 'sugar apple'],
    life: {
      first_fruit_months: [36, 48],
      productive_until_months: [180, 240],
      lifespan_months: [240, 360],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'moringa',
    match_aliases: ['moringa', 'drumstick', 'sahjan', 'sehjan', 'munga'],
    life: {
      first_fruit_months: [6, 8],
      productive_until_months: [48, 72],
      lifespan_months: [120, 240],
      note_key: 'moringa',
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'jamun',
    match_aliases: ['jamun', 'java plum', 'black plum', 'jambul', 'jamoon'],
    life: {
      first_fruit_months: [48, 96],
      productive_until_months: [600, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'ber',
    match_aliases: ['ber', 'jujube', 'bor', 'apple ber', 'umran', 'gola ber'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [240, 300],
      lifespan_months: [300, 480],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'bael',
    match_aliases: ['bael', 'bel', 'bilva', 'bengal quince'],
    life: {
      first_fruit_months: [48, 84],
      productive_until_months: [480, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'fig',
    match_aliases: ['fig', 'anjeer', 'anjir', 'poona fig'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [180, 300],
      lifespan_months: [360, 600],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'mulberry',
    match_aliases: ['mulberry', 'shahtoot', 'shehtoot', 'tut'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [240, 360],
      lifespan_months: [360, 600],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'star_fruit',
    match_aliases: [
      'star fruit',
      'starfruit',
      'kamrakh',
      'kamranga',
      'carambola',
    ],
    life: {
      first_fruit_months: [36, 48],
      productive_until_months: [240, 360],
      lifespan_months: [360, 480],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'karonda',
    match_aliases: ['karonda', 'karanda', 'carissa', 'karaunda'],
    life: {
      first_fruit_months: [24, 36],
      productive_until_months: [180, 240],
      lifespan_months: [240, 360],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'phalsa',
    match_aliases: ['phalsa', 'falsa', 'grewia'],
    life: {
      first_fruit_months: [12, 24],
      productive_until_months: [180, 240],
      lifespan_months: [240, 300],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'wood_apple',
    match_aliases: [
      'wood apple',
      'kaith',
      'kath bel',
      'elephant apple',
      'kavath',
    ],
    life: {
      first_fruit_months: [60, 120],
      productive_until_months: [600, 720],
      lifespan_months: [720, 1200],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'tamarind',
    match_aliases: ['tamarind', 'imli', 'chinch'],
    life: {
      first_fruit_months: [60, 144],
      productive_until_months: [720, 960],
      lifespan_months: [960, 1800],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'kokum',
    match_aliases: ['kokum', 'kokam', 'ratamba', 'bhirand'],
    life: {
      first_fruit_months: [60, 96],
      productive_until_months: [480, 600],
      lifespan_months: [600, 960],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
  {
    key: 'dragon_fruit',
    match_aliases: ['dragon fruit', 'pitaya', 'pitahaya', 'kamalam'],
    life: {
      first_fruit_months: [12, 18],
      productive_until_months: [180, 240],
      lifespan_months: [240, 300],
      note_key: null,
    },
    status: 'APPROVED',
    notes:
      'life: typical Indian home-garden values for usual nursery stock, shown as ranges; source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).',
  },
];
