import {
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskType,
} from '@prisma/client';
import { Metrics } from '../../../common/observability';
import { TaskRepository } from '../repositories/task.repository';
import { TaskDraft, TaskService } from './task.service';

const draft = (sourceKey: string): TaskDraft => ({
  type: TaskType.WATER,
  category: TaskCategory.WATERING,
  priority: TaskPriority.MEDIUM,
  title: 'Water',
  source: TaskSource.SEASONAL_PACK,
  sourceKey,
  dueDate: new Date('2026-12-01T00:00:00Z'),
});

function build(existingKeys: string[]) {
  const created: string[] = [];
  const repo = {
    findPendingBySourceKey: jest.fn(
      (_u: string, _p: string, _s: TaskSource, key: string) =>
        Promise.resolve(
          existingKeys.includes(key) ? { id: `old-${key}` } : null,
        ),
    ),
    create: jest.fn((_u: string, _p: string, data: { source_key: string }) => {
      created.push(data.source_key);
      return Promise.resolve({ id: `new-${data.source_key}` });
    }),
  };
  const metrics = { taskCreated: jest.fn(), taskCompleted: jest.fn() };
  const service = new TaskService(
    repo as unknown as TaskRepository,
    metrics as unknown as Metrics,
  );
  return { service, repo, metrics, created };
}

describe('TaskService.createTasks', () => {
  it('skips a draft whose source key already has a pending task', async () => {
    const { service, created, metrics } = build(['a']);
    const results = await service.createTasks('u1', 'p1', [
      draft('a'),
      draft('b'),
    ]);
    expect(results).toEqual([
      { sourceKey: 'a', status: 'skipped', taskId: 'old-a' },
      { sourceKey: 'b', status: 'created', taskId: 'new-b' },
    ]);
    expect(created).toEqual(['b']);
    expect(metrics.taskCreated).toHaveBeenCalledWith('SEASONAL_PACK', 1);
  });

  it('reports a failed draft without aborting the others (outside a transaction)', async () => {
    const { service, repo } = build([]);
    repo.create.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    const results = await service.createTasks('u1', 'p1', [
      draft('a'),
      draft('b'),
    ]);
    expect(results[0]).toMatchObject({ sourceKey: 'a', status: 'failed' });
    expect(results[1]).toMatchObject({ sourceKey: 'b', status: 'created' });
  });

  it('reports failed when the plant is not owned by the user', async () => {
    const { service, repo } = build([]);
    repo.create.mockImplementationOnce(() => Promise.resolve(null as never));
    const [result] = await service.createTasks('u1', 'p1', [draft('a')]);
    expect(result).toMatchObject({
      status: 'failed',
      reason: 'PLANT_NOT_FOUND',
    });
  });
});
