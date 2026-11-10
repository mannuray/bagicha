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
