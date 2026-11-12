import type {
  CareItem,
  CareStage,
  MonthDay,
  PhaseWindow,
  RegionCare,
} from './types';

/** A calendar window: [from, to], each [month, day]; may cross New Year. */
export type Window = [MonthDay, MonthDay];
export const ALL_YEAR: Window = [
  [1, 1],
  [12, 31],
];

/** A care item with its window per timing group (absent group: not done there). */
export interface ItemSpec<G extends string> extends Omit<CareItem, 'when'> {
  windows: Partial<Record<G, Window | Window[]>>;
}

/** A phase with its [first month, last month] per timing group. */
export interface PhaseSpec<G extends string> extends Omit<
  PhaseWindow,
  'when' | 'stages'
> {
  months: Partial<Record<G, [number, number]>>;
  stages?: CareStage[];
}

/** Last day of a month; February counts 29 so a leap day is never uncovered. */
const lastDay = (month: number) =>
  month === 2 ? 29 : new Date(Date.UTC(2026, month, 0)).getUTCDate();

/**
 * One timing group's care: verified tables are written per group (regions that
 * flower and fruit at the same time), then each region points at its group.
 */
export function groupCare<G extends string>(
  group: G,
  items: ItemSpec<G>[],
  phases: PhaseSpec<G>[],
): RegionCare {
  return {
    items: items.flatMap(({ windows, ...item }) => {
      const w = windows[group];
      if (!w) return [];
      const list = Array.isArray(w[0][0]) ? (w as Window[]) : [w as Window];
      return list.map(([from, to]) => ({
        ...item,
        when: { kind: 'CALENDAR' as const, from, to },
      }));
    }),
    phases: phases.flatMap(({ months, stages, ...p }) => {
      const m = months[group];
      if (!m) return [];
      const [from, to] = m;
      return [
        {
          ...p,
          stages: stages ?? ['BEARING'],
          when: {
            kind: 'CALENDAR' as const,
            from: [from, 1] as MonthDay,
            to: [to, lastDay(to)] as MonthDay,
          },
        },
      ];
    }),
  };
}
