import { istDayDiff } from '../../lib/ist';
import type { Task } from './schemas';

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

const byDueThenPriority = (a: Task, b: Task) =>
  a.due_date.localeCompare(b.due_date) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];

/** Pending tasks split the way a gardener plans: overdue, the next 7 days, later. */
export function thisWeek(tasks: Task[], now: Date): { overdue: Task[]; week: Task[]; later: Task[] } {
  const groups = { overdue: [] as Task[], week: [] as Task[], later: [] as Task[] };
  for (const task of tasks) {
    if (task.status !== 'PENDING') continue;
    const days = istDayDiff(now, new Date(task.due_date));
    if (days < 0) groups.overdue.push(task);
    else if (days <= 7) groups.week.push(task);
    else groups.later.push(task);
  }
  groups.overdue.sort(byDueThenPriority);
  groups.week.sort(byDueThenPriority);
  groups.later.sort(byDueThenPriority);
  return groups;
}

export function dueLabel(due: string, now: Date): { key: string; count?: number } {
  const days = istDayDiff(now, new Date(due));
  if (days < 0) return { key: 'overdue', count: -days };
  if (days === 0) return { key: 'today' };
  if (days === 1) return { key: 'tomorrow' };
  return { key: 'inDays', count: days };
}

/** Tasks that are done or skipped, most recent first, for the closed history. */
export function closedTasks(tasks: Task[], limit = 10): Task[] {
  return tasks
    .filter((task) => task.status !== 'PENDING')
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    .slice(0, limit);
}

export function closedLabel(task: Task, now: Date): { key: string; count?: number } {
  if (task.status === 'SKIPPED') return { key: 'skipped' };
  if (task.status === 'CANCELLED') return { key: 'cancelled' };
  if (!task.completed_at) return { key: 'completed' };
  const ago = -istDayDiff(now, new Date(task.completed_at));
  if (ago <= 0) return { key: 'completedToday' };
  if (ago === 1) return { key: 'completedYesterday' };
  return { key: 'completedDays', count: ago };
}

/** The card's badge: overdue tasks are urgent; otherwise a HIGH priority task is "high". */
export function taskBadge(task: { due_date: string; priority: string }, now: Date): 'urgent' | 'high' | null {
  if (dueLabel(task.due_date, now).key === 'overdue') return 'urgent';
  return task.priority === 'HIGH' ? 'high' : null;
}

/** The next `n` pending tasks: overdue first, then this week, then later. */
export function upcoming(tasks: Task[], now: Date, n: number): Task[] {
  const { overdue, week, later } = thisWeek(tasks, now);
  return [...overdue, ...week, ...later].slice(0, n);
}

/** Anything overdue or due this week. */
export function hasPendingSoon(tasks: Task[], now: Date): boolean {
  const g = thisWeek(tasks, now);
  return g.overdue.length + g.week.length > 0;
}

export interface TaskSection {
  key: 'overdue' | 'plan' | 'week';
  items: Task[];
}

/**
 * How a task list is grouped: Overdue then the plan; or, capped at `limit`, one list
 * of overdue and this week's tasks (Home). Empty sections are left out.
 */
export function taskSections(tasks: Task[], now: Date, limit?: number): TaskSection[] {
  const groups = thisWeek(tasks, now);
  const sections: TaskSection[] = limit
    ? [{ key: 'week', items: [...groups.overdue, ...groups.week].slice(0, limit) }]
    : [
        { key: 'overdue', items: groups.overdue },
        { key: 'plan', items: [...groups.week, ...groups.later] },
      ];
  return sections.filter((s) => s.items.length > 0);
}
