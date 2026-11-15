/**
 * Perennial flowers: bloom months, a month-anchored care calendar and life ranges per climate group. Edit here, then run the catalogue push (docs/deploy.md); the
 * API reads the database, not this file. Change values only through the
 * add-plant playbook: source check, then the owner's yes.
 */
import type { PerennialFlowerSeed } from '../domain/types';

export const PERENNIAL_FLOWER_SEED: PerennialFlowerSeed[] = [
  {
    family: 'rose',
    name: 'rose',
    aliases: ['rose', 'gulab', 'गुलाब'],
    bloom: {
      PLAINS: [[11, 3]],
      PENINSULAR: [[10, 3]],
      HILLS: [
        [4, 6],
        [9, 10],
      ],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 10,
          title: 'Hard prune the rose',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 11,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 2,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 9,
          title: 'Hard prune the rose',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 10,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 1,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 2,
          title: 'Hard prune the rose',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 3,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 6,
          title: 'Feed the rose',
          category: 'FEEDING',
        },
      ],
    },
    first_bloom_months: [4, 8],
    lifespan_months: [120, 180],
    note_key: null,
    hi: { name: 'गुलाब' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'hibiscus',
    name: 'hibiscus',
    aliases: [
      'hibiscus',
      'gudhal',
      'गुड़हल',
      'jaswand',
      'shoe flower',
      'china rose',
    ],
    bloom: {
      PLAINS: [[3, 10]],
      PENINSULAR: [[1, 12]],
      HILLS: [[5, 9]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the hibiscus',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 3,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 5,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 7,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the hibiscus',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 3,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 5,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 7,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 4,
          title: 'Prune the hibiscus',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 5,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
        {
          key: 'feed',
          month: 7,
          title: 'Feed the hibiscus',
          category: 'FEEDING',
        },
      ],
    },
    first_bloom_months: [6, 12],
    lifespan_months: [120, 240],
    note_key: null,
    hi: { name: 'गुड़हल' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'jasmine',
    name: 'mogra',
    aliases: ['jasmine', 'mogra', 'मोगरा', 'chameli', 'juhi'],
    bloom: {
      PLAINS: [[3, 6]],
      PENINSULAR: [[2, 7]],
      HILLS: [[5, 8]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 12,
          title: 'Prune the mogra',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 2,
          title: 'Feed the mogra',
          category: 'FEEDING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 11,
          title: 'Prune the mogra',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 1,
          title: 'Feed the mogra',
          category: 'FEEDING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 3,
          title: 'Prune the mogra',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 4,
          title: 'Feed the mogra',
          category: 'FEEDING',
        },
      ],
    },
    first_bloom_months: [6, 12],
    lifespan_months: [120, 240],
    note_key: null,
    hi: { name: 'मोगरा' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'bougainvillea',
    name: 'bougainvillea',
    aliases: ['bougainvillea', 'बोगनविलिया'],
    bloom: {
      PLAINS: [
        [2, 5],
        [10, 11],
      ],
      PENINSULAR: [
        [2, 5],
        [10, 11],
      ],
      HILLS: [[5, 9]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 6,
          title: 'Prune the bougainvillea',
          category: 'PRUNING',
        },
        {
          key: 'prune',
          month: 12,
          title: 'Prune the bougainvillea',
          category: 'PRUNING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 6,
          title: 'Prune the bougainvillea',
          category: 'PRUNING',
        },
        {
          key: 'prune',
          month: 12,
          title: 'Prune the bougainvillea',
          category: 'PRUNING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 3,
          title: 'Prune the bougainvillea',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [8, 18],
    lifespan_months: [240, 360],
    note_key: null,
    hi: { name: 'बोगनविलिया' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'ixora',
    name: 'ixora',
    aliases: ['ixora', 'rugmini', 'रुग्मिनी'],
    bloom: {
      PLAINS: [[4, 10]],
      PENINSULAR: [[1, 12]],
      HILLS: [[6, 9]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the ixora',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 4,
          title: 'Feed the ixora',
          category: 'FEEDING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the ixora',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 4,
          title: 'Feed the ixora',
          category: 'FEEDING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 4,
          title: 'Prune the ixora',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [6, 12],
    lifespan_months: [120, 240],
    note_key: null,
    hi: { name: 'रुग्मिनी' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'oleander',
    name: 'kaner',
    aliases: ['oleander', 'kaner', 'कनेर'],
    bloom: {
      PLAINS: [[4, 10]],
      PENINSULAR: [[4, 10]],
      HILLS: [[6, 9]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the kaner',
          category: 'PRUNING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the kaner',
          category: 'PRUNING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 4,
          title: 'Prune the kaner',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [12, 24],
    lifespan_months: [240, 480],
    note_key: null,
    hi: { name: 'कनेर' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'parijat',
    name: 'harsingar',
    aliases: ['parijat', 'harsingar', 'हरसिंगार', 'night jasmine'],
    bloom: {
      PLAINS: [[8, 11]],
      PENINSULAR: [[8, 11]],
      HILLS: [[8, 10]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the harsingar',
          category: 'PRUNING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the harsingar',
          category: 'PRUNING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 3,
          title: 'Prune the harsingar',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [24, 36],
    lifespan_months: [240, 480],
    note_key: null,
    hi: { name: 'हरसिंगार' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'plumeria',
    name: 'champa',
    aliases: ['plumeria', 'champa', 'चंपा', 'frangipani'],
    bloom: {
      PLAINS: [[4, 9]],
      PENINSULAR: [[3, 10]],
      HILLS: [[6, 8]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 1,
          title: 'Prune the champa',
          category: 'PRUNING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 1,
          title: 'Prune the champa',
          category: 'PRUNING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 3,
          title: 'Prune the champa',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [24, 36],
    lifespan_months: [360, 600],
    note_key: null,
    hi: { name: 'चंपा' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'adenium',
    name: 'adenium',
    aliases: ['adenium', 'desert rose', 'एडेनियम'],
    bloom: {
      PLAINS: [
        [3, 6],
        [10, 11],
      ],
      PENINSULAR: [
        [3, 6],
        [10, 11],
      ],
      HILLS: [[5, 8]],
    },
    care: {
      PLAINS: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the adenium',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 3,
          title: 'Feed the adenium',
          category: 'FEEDING',
        },
      ],
      PENINSULAR: [
        {
          key: 'prune',
          month: 2,
          title: 'Prune the adenium',
          category: 'PRUNING',
        },
        {
          key: 'feed',
          month: 3,
          title: 'Feed the adenium',
          category: 'FEEDING',
        },
      ],
      HILLS: [
        {
          key: 'prune',
          month: 4,
          title: 'Prune the adenium',
          category: 'PRUNING',
        },
      ],
    },
    first_bloom_months: [12, 24],
    lifespan_months: [180, 300],
    note_key: null,
    hi: { name: 'एडेनियम' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
  {
    family: 'periwinkle',
    name: 'sadabahar',
    aliases: ['periwinkle', 'sadabahar', 'सदाबहार', 'vinca'],
    bloom: {
      PLAINS: [[1, 12]],
      PENINSULAR: [[1, 12]],
      HILLS: [[4, 10]],
    },
    care: {
      PLAINS: [
        {
          key: 'pinch',
          month: 3,
          title: 'Pinch the sadabahar tips for a bushier plant',
          category: 'GENERAL',
        },
      ],
      PENINSULAR: [
        {
          key: 'pinch',
          month: 3,
          title: 'Pinch the sadabahar tips for a bushier plant',
          category: 'GENERAL',
        },
      ],
      HILLS: [
        {
          key: 'pinch',
          month: 5,
          title: 'Pinch the sadabahar tips for a bushier plant',
          category: 'GENERAL',
        },
      ],
    },
    first_bloom_months: [2, 3],
    lifespan_months: [24, 36],
    note_key: 'periwinkle',
    hi: { name: 'सदाबहार' },
    status: 'APPROVED',
    notes:
      'Typical Indian home-garden values from general floriculture references (spec 2026-11-11-flowers-design §2.2); weather and variety move them.',
  },
];
