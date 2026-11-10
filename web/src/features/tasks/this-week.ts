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
  if (!task.completed_at) return { key: 'completed' };
  const ago = -istDayDiff(now, new Date(task.completed_at));
  if (ago <= 0) return { key: 'completedToday' };
  if (ago === 1) return { key: 'completedYesterday' };
  return { key: 'completedDays', count: ago };
}
