import { describe, expect, it } from 'vitest';
import { dueLabel, thisWeek } from './this-week';
import type { Task } from './schemas';

// 2026-03-10 09:00 IST
const NOW = new Date('2026-03-10T03:30:00Z');
const task = (id: string, due: string, over: Partial<Task> = {}): Task =>
  ({
    id,
    type: 'WATER',
    title: id,
    category: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    source: 'SYSTEM',
    reason: null,
    due_date: due,
    completed_at: null,
    plant_id: 'p1',
    tree_name: 'Aam',
    record_kind: 'TREE',
    plant_cycle_id: null,
    cycle_year: null,
    source_summary: null,
    ...over,
  }) as Task;

describe('thisWeek', () => {
  it('groups pending tasks into overdue, this week and later (IST days)', () => {
    const groups = thisWeek(
      [
        task('yesterday', '2026-03-09T12:00:00Z'),
        task('earlier-today', '2026-03-09T20:00:00Z'), // 10 Mar 01:30 IST → today, not overdue
        task('in7', '2026-03-17T03:00:00Z'),
        task('in8', '2026-03-18T05:00:00Z'),
        task('done', '2026-03-11T00:00:00Z', { status: 'COMPLETED' }),
      ],
      NOW,
    );
    expect(groups.overdue.map((t) => t.id)).toEqual(['yesterday']);
    expect(groups.week.map((t) => t.id)).toEqual(['earlier-today', 'in7']);
    expect(groups.later.map((t) => t.id)).toEqual(['in8']);
  });

  it('sorts by due date, then HIGH priority first', () => {
    const same = '2026-03-11T05:00:00Z';
    const groups = thisWeek(
      [task('low', same, { priority: 'LOW' }), task('high', same, { priority: 'HIGH' }), task('first', '2026-03-10T10:00:00Z')],
      NOW,
    );
    expect(groups.week.map((t) => t.id)).toEqual(['first', 'high', 'low']);
  });
});

describe('dueLabel', () => {
  it.each([
    ['2026-03-10T12:00:00Z', 'today'],
    ['2026-03-11T05:00:00Z', 'tomorrow'],
    ['2026-03-13T05:00:00Z', 'inDays:3'],
    ['2026-03-08T05:00:00Z', 'overdue:2'],
  ])('%s → %s', (due, expected) => {
    const label = dueLabel(due, NOW);
    expect(label.count === undefined ? label.key : `${label.key}:${label.count}`).toBe(expected);
  });
});

describe('taskBadge', () => {
  it('overdue is urgent; otherwise a HIGH task is high; else no badge', async () => {
    const { taskBadge } = await import('./this-week');
    const now = new Date('2026-11-12T06:30:00Z');
    expect(taskBadge({ due_date: '2026-11-01T00:00:00Z', priority: 'LOW' }, now)).toBe('urgent');
    expect(taskBadge({ due_date: '2026-11-20T00:00:00Z', priority: 'HIGH' }, now)).toBe('high');
    expect(taskBadge({ due_date: '2026-11-20T00:00:00Z', priority: 'MEDIUM' }, now)).toBeNull();
  });
});

describe('upcoming', () => {
  it('the next n pending tasks: overdue first, then this week, then later', async () => {
    const { upcoming } = await import('./this-week');
    const now = new Date('2026-11-12T06:30:00Z');
    const t = (id: string, due: string) => task(id, due);
    const list = [t('later', '2026-12-30T00:00:00Z'), t('week', '2026-11-14T00:00:00Z'), t('late', '2026-11-01T00:00:00Z'), t('later2', '2027-01-30T00:00:00Z')];
    expect(upcoming(list, now, 3).map((x) => x.id)).toEqual(['late', 'week', 'later']);
  });
});

describe('hasPendingSoon and taskSections', () => {
  const now = new Date('2026-11-12T06:30:00Z');
  const list = [task('late', '2026-11-01T00:00:00Z'), task('week', '2026-11-14T00:00:00Z'), task('later', '2026-12-30T00:00:00Z')];

  it('something is due this week or overdue', async () => {
    const { hasPendingSoon } = await import('./this-week');
    expect(hasPendingSoon(list, now)).toBe(true);
    expect(hasPendingSoon([task('later', '2026-12-30T00:00:00Z')], now)).toBe(false);
  });

  it('the full list: overdue, then the plan; a capped list: overdue and this week only', async () => {
    const { taskSections } = await import('./this-week');
    expect(taskSections(list, now).map((s) => [s.key, s.items.map((x) => x.id)])).toEqual([
      ['overdue', ['late']],
      ['plan', ['week', 'later']],
    ]);
    expect(taskSections(list, now, 1).map((s) => [s.key, s.items.map((x) => x.id)])).toEqual([['week', ['late']]]);
  });

  it('empty sections are left out', async () => {
    const { taskSections } = await import('./this-week');
    expect(taskSections([task('later', '2026-12-30T00:00:00Z')], now).map((s) => s.key)).toEqual(['plan']);
  });
});

describe('closedTasks', () => {
  it('done and skipped tasks, most recent first, capped', async () => {
    const { closedTasks } = await import('./this-week');
    const list = [
      task('open', '2026-11-20T00:00:00Z'),
      task('old', '2026-10-01T00:00:00Z', { status: 'COMPLETED', completed_at: '2026-10-02T00:00:00Z' }),
      task('new', '2026-11-01T00:00:00Z', { status: 'SKIPPED', completed_at: '2026-11-03T00:00:00Z' }),
    ];
    expect(closedTasks(list).map((x) => x.id)).toEqual(['new', 'old']);
    expect(closedTasks(list, 1).map((x) => x.id)).toEqual(['new']);
  });
});
