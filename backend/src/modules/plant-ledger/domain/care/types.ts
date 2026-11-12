import type { RegionCluster } from '@prisma/client';

/** Young trees (sapling, juvenile) and trees that flower and fruit. */
export type CareStage = 'YOUNG' | 'BEARING';

/** [month 1–12, day 1–31] */
export type MonthDay = [number, number];

/**
 * When a care item or phase applies. Only CALENDAR is evaluated today; the
 * planting- and choice-timed kinds (banana, papaya; bahar, pruning) come with
 * per-tree timing and until then show on the plant page only.
 */
export type Anchor =
  | { kind: 'CALENDAR'; from: MonthDay; to: MonthDay }
  | { kind: 'FROM_PLANTING'; fromDays: number; toDays: number }
  | { kind: 'FROM_CHOICE'; choice: string; fromDays: number; toDays: number };

export type CareCategory =
  | 'FEEDING'
  | 'PRUNING'
  | 'PROTECTION'
  | 'WATERING'
  | 'GENERAL';

export interface CareItem {
  /** Stable within the family: part of the task key. */
  key: string;
  /** The reminder text, at most 60 characters. */
  title: string;
  category: CareCategory;
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
}

export interface PhaseWindow {
  when: Anchor;
  stages: CareStage[];
  /** snake_case: the web humanises it and the paid overlay appends to it. */
  phase: string;
  avoid: string[];
  watch: string[];
}

export interface RegionCare {
  items: CareItem[];
  phases: PhaseWindow[];
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
}
