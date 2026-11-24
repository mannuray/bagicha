import type { Plant, Task } from '@prisma/client';
import { TransactionRunner } from '../../../common/prisma/transaction';
import { FixedClock } from '../../../common/time';
import { seededCatalogueStore } from '../../catalogue/testing';
import type { CycleRepository } from '../repositories/cycle.repository';
import type { JournalRepository } from '../repositories/journal.repository';
import type { PlantRepository } from '../repositories/plant.repository';
import type { TaskRepository } from '../repositories/task.repository';
import { CropPlanService } from './crop-plan.service';
import type { TaskService } from './task.service';

const crops = ['tomato', 'brinjal', 'okra', 'palak', 'radish'].map(
  (crop, i) =>
    ({
      id: `p${i}`,
      crop_id: crop,
      crop_stage: 'PLANNED',
      name: crop,
    }) as unknown as Plant,
);

function build(pending: Task[] = []) {
  const plants = {
    listWaitingCrops: jest.fn().mockResolvedValue(crops),
    seasonStartsFor: jest.fn().mockResolvedValue(new Map()),
  };
  const taskRows = {
    pendingForPlants: jest.fn().mockResolvedValue(pending),
    pendingForPlant: jest.fn().mockResolvedValue([]),
    cancelByIds: jest.fn().mockResolvedValue(undefined),
  };
  const created: string[] = [];
  const tasks = {
    createTasks: jest.fn(
      (_u: string, _p: string, drafts: Array<{ sourceKey: string }>) => {
        created.push(...drafts.map((d) => d.sourceKey));
        return Promise.resolve(
          drafts.map((d) => ({ sourceKey: d.sourceKey, status: 'created' })),
        );
      },
    ),
  };
  const transactions = {
    run: (fn: (tx: unknown) => unknown) => fn({}),
  } as unknown as TransactionRunner;
  const service = new CropPlanService(
    plants as unknown as PlantRepository,
    {} as CycleRepository,
    {} as JournalRepository,
    taskRows as unknown as TaskRepository,
    tasks as unknown as TaskService,
    transactions,
    new FixedClock(new Date('2026-06-01T06:00:00Z')),
    seededCatalogueStore(),
  );
  return { service, plants, taskRows, tasks, created };
}

describe('CropPlanService.sync', () => {
  it('reads seasons and pending reminders once for all waiting crops', async () => {
    const { service, plants, taskRows } = build();
    await service.sync('u', 'PLAINS');
    expect(plants.seasonStartsFor).toHaveBeenCalledTimes(1);
    expect(plants.seasonStartsFor).toHaveBeenCalledWith(crops.map((c) => c.id));
    expect(taskRows.pendingForPlants).toHaveBeenCalledTimes(1);
    expect(taskRows.pendingForPlant).not.toHaveBeenCalled();
  });

  it('writes nothing when every reminder is already pending', async () => {
    const first = build();
    await first.service.sync('u', 'PLAINS');
    expect(first.created.length).toBeGreaterThan(0);
    const pending = first.created.map(
      (key, i) =>
        ({
          id: `t${i}`,
          plant_id: key.split(':')[1],
          source_key: key,
          metadata: {},
        }) as unknown as Task,
    );
    const again = build(pending);
    const result = await again.service.sync('u', 'PLAINS');
    expect(again.tasks.createTasks).not.toHaveBeenCalled();
    expect(result.created_count).toBe(0);
  });
});
