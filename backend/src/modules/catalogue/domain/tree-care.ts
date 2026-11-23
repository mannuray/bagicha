/**
 * Tree care: month-by-month reminders and phases per region, written by the
 * add-plant playbook. Records live in the catalogue (seed/tree-care); the
 * plant-ledger care engine turns them into reminders.
 * Spec: docs/superpowers/specs/2026-11-18-tree-care-in-catalogue-design.md.
 */
import type { RegionCluster } from '@prisma/client';
import type { CatalogueStatus } from './types';

/** Young trees (sapling, juvenile) and trees that flower and fruit. */
export type CareStage = 'YOUNG' | 'BEARING';

/** [month 1–12, day 1–31] */
export type MonthDay = [number, number];

/**
 * When a care item or phase applies. Phases are CALENDAR only. FROM_PLANTING
 * counts from the tree's planting date (papaya); an item timed this way writes
 * its amount in the text, never as a `dose`. FROM_CHOICE (bahar, pruning) is
 * not evaluated yet and shows on the plant page only.
 */
export type Anchor =
  | { kind: 'CALENDAR'; from: MonthDay; to: MonthDay }
  | { kind: 'FROM_PLANTING'; fromDays: number; toDays: number }
  | { kind: 'FROM_CHOICE'; choice: string; fromDays: number; toDays: number };

export type TreeCareCategory =
  'FEEDING' | 'PRUNING' | 'PROTECTION' | 'WATERING' | 'GENERAL';

export interface TreeCareItem {
  /** Stable within the family: part of the task key. */
  key: string;
  /** The reminder text, at most 60 characters. */
  title: string;
  category: TreeCareCategory;
  stages: CareStage[];
  when: Anchor;
  /** What to use and how much: always offered first. */
  organic: string;
  /** Alternative with dose, gloves and waiting days before harvest. */
  chemical?: string;
  /**
   * Dose per year of the tree's age, as the guides give it (e.g. 5 kg FYM and
   * 110 g urea × age), up to `maxAgeYears`. The engine works out this tree's amount.
   */
  dose?: Dose;
  /** "Only if you see …": shown on the plant page, never a reminder. */
  conditional?: string;
  why: string;
}

/** What the tree is doing in a window: Now / Next, and what to avoid and watch. */
export interface DosePart {
  what: string;
  grams: number;
}

export interface Dose {
  organic: DosePart[];
  chemical: DosePart[];
  maxAgeYears: number;
  /** Organic and chemical parts go in together (one feed), not as alternatives. */
  together?: boolean;
}

export interface PhaseWindow {
  when: Extract<Anchor, { kind: 'CALENDAR' }>;
  stages: CareStage[];
  /** snake_case: the web humanises it and the paid overlay appends to it. */
  phase: string;
  avoid: string[];
  watch: string[];
}

export interface RegionCare {
  items: TreeCareItem[];
  phases: PhaseWindow[];
}

/**
 * One kind within a family (lime, lemon, mandarin…) with care of its own. A
 * tree is of a kind when one of the kind's words is in its variety, species
 * or name; words that fit several kinds ("nimbu") belong to none.
 */
export interface CareKind {
  /** Stable: part of the task key (`citrus:lime:…`). */
  key: string;
  /** English or Hindi-script words; each on one kind only. */
  words: string[];
  /**
   * Place and variety names (Nagpur, Coorg, Daisy) that pick this kind only in
   * the tree's variety or species: in a free-text name they may mean something
   * else ("Nimbu from Nagpur").
   */
  varietyWords?: string[];
  grownIn: RegionCluster[];
  regions: Partial<
    Record<RegionCluster, RegionCare | { sameAs: RegionCluster }>
  >;
  pendingRegions?: RegionCluster[];
}

export interface FamilyCare {
  family: string;
  sources: string[];
  /** Regions the tree is grown in: care must exist for each. */
  grownIn: RegionCluster[];
  regions: Partial<
    Record<RegionCluster, RegionCare | { sameAs: RegionCluster }>
  >;
  /**
   * Regions the tree is grown in but whose calendar isn't source-checked yet:
   * gardeners there keep the season-pack advice until it is.
   */
  pendingRegions?: RegionCluster[];
  /**
   * Care split by kind: a family with kinds has no care of its own (empty
   * `grownIn` and `regions`), and a tree whose kind isn't known keeps the season pack.
   */
  kinds?: CareKind[];
  /**
   * Words for a different plant that shares a kind's word ("kaffir lime"):
   * where one comes first in a field, that field picks no kind.
   */
  noKindWords?: string[];
}

/** A family's care as the seed and the database hold it. */
export type TreeCareSeed = FamilyCare & {
  status: CatalogueStatus;
  /** Source notes kept beside the values. */
  notes: string | null;
};
