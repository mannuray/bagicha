import { PERENNIAL_FLOWERS } from './flower-care';

/**
 * How long each species family typically takes to fruit, stays productive and
 * lives, as [min, max] ranges in months. Typical Indian home-garden values for
 * usual nursery stock; variety, rootstock and care move them, so they are
 * shown as ranges ("usually", "about"), never as promises.
 * Source: general horticulture references (spec 2026-11-10-tree-life-and-loss §2.2).
 */
export interface LifeProfile {
  first_fruit_months: [number, number];
  productive_until_months: [number, number];
  lifespan_months: [number, number];
  /** Web translation key for the species pattern note, if any. */
  note_key: string | null;
}

const years = ([min, max]: [number, number]): [number, number] => [
  min * 12,
  max * 12,
];

const PROFILES: Record<string, LifeProfile> = {
  mango: {
    first_fruit_months: years([3, 5]),
    productive_until_months: years([40, 60]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  citrus: {
    first_fruit_months: years([2, 4]),
    productive_until_months: years([20, 30]),
    lifespan_months: years([30, 50]),
    note_key: null,
  },
  litchi: {
    first_fruit_months: years([4, 6]),
    productive_until_months: years([40, 60]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  guava: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([15, 25]),
    lifespan_months: years([30, 40]),
    note_key: null,
  },
  pomegranate: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([15, 20]),
    lifespan_months: years([25, 30]),
    note_key: null,
  },
  banana: {
    first_fruit_months: [9, 15],
    productive_until_months: years([3, 5]),
    lifespan_months: years([5, 8]),
    note_key: 'banana',
  },
  papaya: {
    first_fruit_months: [8, 12],
    productive_until_months: years([2, 3]),
    lifespan_months: years([4, 6]),
    note_key: 'papaya',
  },
  grape: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([20, 30]),
    lifespan_months: years([40, 60]),
    note_key: 'grape',
  },
  jackfruit: {
    first_fruit_months: years([4, 8]),
    productive_until_months: years([50, 70]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  coconut: {
    first_fruit_months: years([4, 7]),
    productive_until_months: years([50, 70]),
    lifespan_months: years([60, 80]),
    note_key: 'coconut',
  },
  sapota: {
    first_fruit_months: years([3, 5]),
    productive_until_months: years([40, 60]),
    lifespan_months: years([60, 80]),
    note_key: null,
  },
  amla: {
    first_fruit_months: years([3, 5]),
    productive_until_months: years([40, 50]),
    lifespan_months: years([50, 60]),
    note_key: null,
  },
  custard_apple: {
    first_fruit_months: years([3, 4]),
    productive_until_months: years([15, 20]),
    lifespan_months: years([20, 30]),
    note_key: null,
  },
  moringa: {
    first_fruit_months: [6, 8],
    productive_until_months: years([4, 6]),
    lifespan_months: years([10, 20]),
    note_key: 'moringa',
  },
  // Catalogue phase 2: common home fruit trees (grafted plants where common; seedlings take longer).
  jamun: {
    first_fruit_months: years([4, 8]),
    productive_until_months: years([50, 60]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  ber: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([20, 25]),
    lifespan_months: years([25, 40]),
    note_key: null,
  },
  bael: {
    first_fruit_months: years([4, 7]),
    productive_until_months: years([40, 60]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  fig: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([15, 25]),
    lifespan_months: years([30, 50]),
    note_key: null,
  },
  mulberry: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([20, 30]),
    lifespan_months: years([30, 50]),
    note_key: null,
  },
  star_fruit: {
    first_fruit_months: years([3, 4]),
    productive_until_months: years([20, 30]),
    lifespan_months: years([30, 40]),
    note_key: null,
  },
  karonda: {
    first_fruit_months: years([2, 3]),
    productive_until_months: years([15, 20]),
    lifespan_months: years([20, 30]),
    note_key: null,
  },
  phalsa: {
    first_fruit_months: years([1, 2]),
    productive_until_months: years([15, 20]),
    lifespan_months: years([20, 25]),
    note_key: null,
  },
  wood_apple: {
    first_fruit_months: years([5, 10]),
    productive_until_months: years([50, 60]),
    lifespan_months: years([60, 100]),
    note_key: null,
  },
  tamarind: {
    first_fruit_months: years([5, 12]),
    productive_until_months: years([60, 80]),
    lifespan_months: years([80, 150]),
    note_key: null,
  },
  kokum: {
    first_fruit_months: years([5, 8]),
    productive_until_months: years([40, 50]),
    lifespan_months: years([50, 80]),
    note_key: null,
  },
  dragon_fruit: {
    first_fruit_months: [12, 18],
    productive_until_months: years([15, 20]),
    lifespan_months: years([20, 25]),
    note_key: null,
  },
};

// Perennial flowers: first_fruit_months holds the first-bloom range; they bloom for their whole life.
for (const f of PERENNIAL_FLOWERS) {
  PROFILES[f.family] = {
    first_fruit_months: f.first_bloom_months,
    productive_until_months: f.lifespan_months,
    lifespan_months: f.lifespan_months,
    note_key: f.family === 'periwinkle' ? 'periwinkle' : null,
  };
}

export const LIFE_PROFILE_FAMILIES: readonly string[] = Object.keys(PROFILES);

/** The profile for a species family, or null when we don't know it (no guesses). */
export function lifeProfileFor(
  family: string | null | undefined,
): LifeProfile | null {
  return (family && PROFILES[family]) || null;
}
