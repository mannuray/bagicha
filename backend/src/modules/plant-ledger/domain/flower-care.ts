/**
 * Perennial flowers: species that stay for years (rose, hibiscus, mogra…).
 * Each has its usual bloom months, a month-anchored care calendar and life
 * ranges per climate group. Typical Indian home-garden values from general
 * floriculture references; weather and variety move them, so the app says
 * "usually". Spec: docs/superpowers/specs/2026-11-11-flowers-design.md §2.2.
 */
import { istMonth, istYear } from '../../../common/time';
import type { ClimateGroup } from './crop-calendar';

type Months = [number, number];
export type CareCategory = 'PRUNING' | 'FEEDING' | 'GENERAL';
export interface CareItem {
  key: string;
  month: number;
  title: string;
  category: CareCategory;
}
export interface PerennialFlower {
  family: string;
  name: string;
  aliases: string[];
  bloom: Record<ClimateGroup, Months[]>;
  care: Record<ClimateGroup, CareItem[]>;
  first_bloom_months: Months;
  lifespan_months: Months;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const years = ([a, b]: Months): Months => [a * 12, b * 12];
const prune = (
  month: number,
  name: string,
  title = `Prune the ${name}`,
): CareItem => ({ key: 'prune', month, title, category: 'PRUNING' });
const feed = (month: number, name: string): CareItem => ({
  key: 'feed',
  month,
  title: `Feed the ${name}`,
  category: 'FEEDING',
});
/** Same care in the plains and the peninsula; the hills run later. */
const byGroup = <T>(
  plains: T,
  hills: T,
  peninsular: T = plains,
): Record<ClimateGroup, T> => ({
  PLAINS: plains,
  PENINSULAR: peninsular,
  HILLS: hills,
});

export const PERENNIAL_FLOWERS: readonly PerennialFlower[] = [
  {
    family: 'rose',
    name: 'rose',
    aliases: ['rose', 'gulab', 'गुलाब'],
    bloom: byGroup(
      [[11, 3]],
      [
        [4, 6],
        [9, 10],
      ],
      [[10, 3]],
    ),
    care: byGroup(
      [
        prune(10, 'rose', 'Hard prune the rose'),
        feed(11, 'rose'),
        feed(2, 'rose'),
      ],
      [
        prune(2, 'rose', 'Hard prune the rose'),
        feed(3, 'rose'),
        feed(6, 'rose'),
      ],
      [
        prune(9, 'rose', 'Hard prune the rose'),
        feed(10, 'rose'),
        feed(1, 'rose'),
      ],
    ),
    first_bloom_months: [4, 8],
    lifespan_months: years([10, 15]),
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
    bloom: byGroup([[3, 10]], [[5, 9]], [[1, 12]]),
    care: byGroup(
      [
        prune(2, 'hibiscus'),
        feed(3, 'hibiscus'),
        feed(5, 'hibiscus'),
        feed(7, 'hibiscus'),
      ],
      [prune(4, 'hibiscus'), feed(5, 'hibiscus'), feed(7, 'hibiscus')],
    ),
    first_bloom_months: [6, 12],
    lifespan_months: years([10, 20]),
  },
  {
    family: 'jasmine',
    name: 'mogra',
    aliases: ['jasmine', 'mogra', 'मोगरा', 'chameli', 'juhi'],
    bloom: byGroup([[3, 6]], [[5, 8]], [[2, 7]]),
    care: byGroup(
      [prune(12, 'mogra'), feed(2, 'mogra')],
      [prune(3, 'mogra'), feed(4, 'mogra')],
      [prune(11, 'mogra'), feed(1, 'mogra')],
    ),
    first_bloom_months: [6, 12],
    lifespan_months: years([10, 20]),
  },
  {
    family: 'bougainvillea',
    name: 'bougainvillea',
    aliases: ['bougainvillea', 'बोगनविलिया'],
    bloom: byGroup(
      [
        [2, 5],
        [10, 11],
      ],
      [[5, 9]],
    ),
    care: byGroup(
      [prune(6, 'bougainvillea'), prune(12, 'bougainvillea')],
      [prune(3, 'bougainvillea')],
    ),
    first_bloom_months: [8, 18],
    lifespan_months: years([20, 30]),
  },
  {
    family: 'ixora',
    name: 'ixora',
    aliases: ['ixora', 'rugmini', 'रुग्मिनी'],
    bloom: byGroup([[4, 10]], [[6, 9]], [[1, 12]]),
    care: byGroup([prune(2, 'ixora'), feed(4, 'ixora')], [prune(4, 'ixora')]),
    first_bloom_months: [6, 12],
    lifespan_months: years([10, 20]),
  },
  {
    family: 'oleander',
    name: 'kaner',
    aliases: ['oleander', 'kaner', 'कनेर'],
    bloom: byGroup([[4, 10]], [[6, 9]]),
    care: byGroup([prune(2, 'kaner')], [prune(4, 'kaner')]),
    first_bloom_months: [12, 24],
    lifespan_months: years([20, 40]),
  },
  {
    family: 'parijat',
    name: 'harsingar',
    aliases: ['parijat', 'harsingar', 'हरसिंगार', 'night jasmine'],
    bloom: byGroup([[8, 11]], [[8, 10]]),
    care: byGroup([prune(2, 'harsingar')], [prune(3, 'harsingar')]),
    first_bloom_months: [24, 36],
    lifespan_months: years([20, 40]),
  },
  {
    family: 'plumeria',
    name: 'champa',
    aliases: ['plumeria', 'champa', 'चंपा', 'frangipani'],
    bloom: byGroup([[4, 9]], [[6, 8]], [[3, 10]]),
    care: byGroup([prune(1, 'champa')], [prune(3, 'champa')]),
    first_bloom_months: [24, 36],
    lifespan_months: years([30, 50]),
  },
  {
    family: 'adenium',
    name: 'adenium',
    aliases: ['adenium', 'desert rose', 'एडेनियम'],
    bloom: byGroup(
      [
        [3, 6],
        [10, 11],
      ],
      [[5, 8]],
    ),
    care: byGroup(
      [prune(2, 'adenium'), feed(3, 'adenium')],
      [prune(4, 'adenium')],
    ),
    first_bloom_months: [12, 24],
    lifespan_months: years([15, 25]),
  },
  {
    family: 'periwinkle',
    name: 'sadabahar',
    aliases: ['periwinkle', 'sadabahar', 'सदाबहार', 'vinca'],
    bloom: byGroup([[1, 12]], [[4, 10]]),
    care: byGroup(
      [
        {
          key: 'pinch',
          month: 3,
          title: 'Pinch the sadabahar tips for a bushier plant',
          category: 'GENERAL',
        },
      ],
      [
        {
          key: 'pinch',
          month: 5,
          title: 'Pinch the sadabahar tips for a bushier plant',
          category: 'GENERAL',
        },
      ],
    ),
    first_bloom_months: [2, 3],
    lifespan_months: years([2, 3]),
  },
];

export function perennialFlower(
  family: string | null | undefined,
): PerennialFlower | undefined {
  return PERENNIAL_FLOWERS.find((f) => f.family === family);
}

/** Longest alias first, so "china rose" (hibiscus) and "desert rose" (adenium) beat "rose". */
const ALIASES = PERENNIAL_FLOWERS.flatMap((f) =>
  f.aliases.map((alias) => ({ alias, family: f.family })),
).sort((a, b) => b.alias.length - a.alias.length);

/** The perennial flower family named in this text, or null. */
export function flowerFamilyIn(text: string): string | null {
  const haystack = ` ${text.toLowerCase().replace(/[^\p{L}\p{M}0-9]+/gu, ' ')} `;
  return (
    ALIASES.find(({ alias }) => haystack.includes(` ${alias} `))?.family ?? null
  );
}

/** Midnight IST on the 1st of a month. */
function firstOfMonthIst(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - 5.5 * 60 * 60 * 1000);
}

/**
 * Care whose month is this IST month or next. Keyed by year and month, so each
 * feed in a year is its own task and a yearly task comes back next year.
 */
export function flowerCareDue(
  flower: PerennialFlower,
  group: ClimateGroup,
  now: Date,
) {
  const month = istMonth(now);
  const year = istYear(now);
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return flower.care[group]
    .filter((c) => c.month === month || c.month === next)
    .map((c) => {
      const thisMonth = c.month === month;
      const y = thisMonth ? year : nextYear;
      return {
        key: c.key,
        title: c.title,
        category: c.category,
        due: thisMonth ? now : firstOfMonthIst(y, c.month),
        sourceKey: `${flower.family}:${c.key}:${y}-${String(c.month).padStart(2, '0')}`,
      };
    });
}

const contains = ([a, b]: Months, m: number) =>
  a <= b ? m >= a && m <= b : m >= a || m <= b;
const label = ([a, b]: Months) =>
  a === 1 && b === 12 ? 'All year' : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`;

/** Whether the flower is in its usual bloom months now, and which window to show. */
export function bloomStatus(
  flower: PerennialFlower,
  group: ClimateGroup,
  now: Date,
): { status: 'in_season' | 'later'; window_label: string } {
  const month = istMonth(now);
  const windows = flower.bloom[group];
  const current = windows.find((w) => contains(w, month));
  if (current) return { status: 'in_season', window_label: label(current) };
  const ahead = (w: Months) => (w[0] - month + 12) % 12;
  const upcoming = [...windows].sort((x, y) => ahead(x) - ahead(y))[0];
  return { status: 'later', window_label: label(upcoming) };
}

/**
 * One-time cleanup (spec §3.1): flowers made before this work ran the fruit
 * pack. Cancel their pending pack and overlay tasks; completed history stays.
 */
export const FLOWER_CLEANUP_SQL = `UPDATE "tasks" SET "status" = 'CANCELLED' WHERE "status" = 'PENDING' AND "source" IN ('SEASONAL_PACK', 'PERSONALIZED_OVERLAY') AND "tree_id" IN (SELECT "id" FROM "trees" WHERE "record_kind" = 'FLOWER')`;
