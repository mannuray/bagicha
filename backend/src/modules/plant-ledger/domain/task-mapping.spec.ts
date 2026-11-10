import {
  DiagnosisIssueType as I,
  DiagnosisSeverity as S,
  TaskCategory as C,
  TaskPriority as P,
  TaskType as T,
} from '@prisma/client';
import {
  taskCategoryFromCategory,
  taskCategoryFromIssue,
  taskPriorityFrom,
  taskPriorityFromSeverity,
  taskTypeFromCategory,
  taskTypeFromIssue,
} from './task-mapping';

describe('template category mapping (was seasonal.service)', () => {
  it.each([
    ['watering', T.WATER, C.WATERING],
    ['Pruning', T.PRUNE, C.PRUNING],
    ['feeding', T.FEED, C.FEEDING],
    ['harvest', T.HARVEST, C.HARVEST],
    ['treatment', T.TREAT, C.TREATMENT],
    ['observation', T.OBSERVE, C.OBSERVATION],
    ['inspection', T.INSPECT, C.INSPECTION],
    ['???', T.INSPECT, C.INSPECTION],
  ])('%s → %s / %s', (category, type, cat) => {
    expect(taskTypeFromCategory(category)).toBe(type);
    expect(taskCategoryFromCategory(category)).toBe(cat);
  });

  it.each([
    ['low', P.LOW],
    ['HIGH', P.HIGH],
    ['medium', P.MEDIUM],
    ['urgent', P.MEDIUM],
  ])('priority %s → %s', (raw, priority) => {
    expect(taskPriorityFrom(raw)).toBe(priority);
  });
});

describe('diagnosis issue mapping (was diagnosis-pipeline.service)', () => {
  it.each([
    [I.PEST, T.TREAT, C.TREATMENT],
    [I.DISEASE, T.TREAT, C.TREATMENT],
    [I.WATER_STRESS, T.WATER, C.WATERING],
    [I.NUTRIENT, T.INSPECT, C.INSPECTION],
    [I.UNKNOWN, T.INSPECT, C.INSPECTION],
  ])('%s → %s / %s', (issue, type, cat) => {
    expect(taskTypeFromIssue(issue)).toBe(type);
    expect(taskCategoryFromIssue(issue)).toBe(cat);
  });

  it('gives the severity priority to the first action only', () => {
    expect(taskPriorityFromSeverity(S.HIGH, 0)).toBe(P.HIGH);
    expect(taskPriorityFromSeverity(S.MEDIUM, 0)).toBe(P.MEDIUM);
    expect(taskPriorityFromSeverity(S.LOW, 0)).toBe(P.LOW);
    expect(taskPriorityFromSeverity(S.UNKNOWN, 0)).toBe(P.LOW);
    expect(taskPriorityFromSeverity(S.HIGH, 1)).toBe(P.MEDIUM);
  });
});
