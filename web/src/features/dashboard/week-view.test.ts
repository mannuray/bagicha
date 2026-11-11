import { describe, expect, it } from 'vitest';
import { weekView } from './week-view';

const ok = { tasksError: null, plantsError: null, seasonError: null, hasPendingSoon: false, tasksLoaded: true, seasonSettled: true };

describe('weekView: what "This week" on Home shows', () => {
  it('a tasks error comes first', () => {
    expect(weekView({ ...ok, tasksError: 'x', hasPendingSoon: true })).toEqual({ kind: 'error', source: 'tasks' });
  });
  it('tasks due soon show even while the season check runs or failed', () => {
    expect(weekView({ ...ok, hasPendingSoon: true, seasonSettled: false, seasonError: 'x' })).toEqual({ kind: 'tasks' });
  });
  it('then a plant-list error, then a season-check error', () => {
    expect(weekView({ ...ok, plantsError: 'x', seasonError: 'y' })).toEqual({ kind: 'error', source: 'plants' });
    expect(weekView({ ...ok, seasonError: 'y' })).toEqual({ kind: 'error', source: 'season' });
  });
  it('"nothing due" only once tasks loaded and the season check finished', () => {
    expect(weekView({ ...ok, tasksLoaded: false })).toEqual({ kind: 'loading' });
    expect(weekView({ ...ok, seasonSettled: false })).toEqual({ kind: 'loading' });
    expect(weekView(ok)).toEqual({ kind: 'empty' });
  });
});
