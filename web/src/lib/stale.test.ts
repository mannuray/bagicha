import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';
import { staleAfter } from './stale';

describe('what each change makes stale, in one place', () => {
  it('a journal entry refreshes the plant\'s record, seasons, tasks and Home\'s tasks', () => {
    expect(staleAfter.journalWrite('p1')).toEqual(
      expect.arrayContaining([
        queryKeys.plants.timelineAll('p1'),
        queryKeys.plants.cycles('p1'),
        queryKeys.plants.tasks('p1'),
        queryKeys.plants.detail('p1'),
        queryKeys.tasks.mineAll,
      ]),
    );
  });

  it('a garden change (add, end, restore, plan) refreshes every plant list and all tasks', () => {
    expect(staleAfter.gardenChange()).toEqual([queryKeys.plants.all, queryKeys.tasks.mineAll]);
  });

  it('a task change refreshes that plant\'s task views, or just Home\'s without a plant', () => {
    expect(staleAfter.taskChange(null)).toEqual([queryKeys.tasks.mineAll]);
    expect(staleAfter.taskChange('p1')).toEqual(expect.arrayContaining([queryKeys.plants.tasks('p1'), queryKeys.plants.cycles('p1')]));
  });

  it('a diagnosis refreshes the plant\'s tasks and record', () => {
    expect(staleAfter.diagnosis('p1')).toEqual([queryKeys.plants.tasks('p1'), queryKeys.plants.timelineAll('p1'), queryKeys.tasks.mineAll]);
  });
});
