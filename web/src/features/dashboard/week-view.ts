export type WeekView = { kind: 'error'; source: 'tasks' | 'plants' | 'season' } | { kind: 'tasks' } | { kind: 'loading' } | { kind: 'empty' };

/**
 * What Home's "This week" shows. Order matters: a tasks error first; tasks due soon
 * even while the season check runs; then plant-list and season-check errors; and
 * "nothing due" only once tasks loaded and the season check finished.
 */
export function weekView(input: {
  tasksError: unknown;
  plantsError: unknown;
  seasonError: unknown;
  hasPendingSoon: boolean;
  tasksLoaded: boolean;
  seasonSettled: boolean;
}): WeekView {
  if (input.tasksError) return { kind: 'error', source: 'tasks' };
  if (input.hasPendingSoon) return { kind: 'tasks' };
  if (input.plantsError) return { kind: 'error', source: 'plants' };
  if (input.seasonError) return { kind: 'error', source: 'season' };
  if (!input.tasksLoaded || !input.seasonSettled) return { kind: 'loading' };
  return { kind: 'empty' };
}
