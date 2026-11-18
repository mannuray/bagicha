import { TaskSource, TaskType } from '@prisma/client';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { FixedClock } from '../../../common/time';
import { TaskDraft, TaskService } from '../services/task.service';
import { CATALOGUE_SEED, type TreeCareSeed } from '../../catalogue';
import { seededCatalogueStore, treeCareFixture } from '../../catalogue/testing';
import { SpeciesNormalizationService } from '../services/species-normalization.service';
import { TaskProcessor } from './task.processor';

/** A processor over a catalogue whose tree care is exactly `treeCare`. */
function build(treeCare: TreeCareSeed[] = []) {
  const pending = new Set<string>();
  const calls: TaskDraft[][] = [];
  const tasks = {
    createTasks: jest.fn((_u: string, _p: string, drafts: TaskDraft[]) => {
      calls.push(drafts);
      return Promise.resolve(
        drafts.map((d) => {
          const seen = pending.has(d.sourceKey);
          pending.add(d.sourceKey);
          return {
            sourceKey: d.sourceKey,
            status: seen ? 'skipped' : 'created',
          };
        }),
      );
    }),
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const processor = new TaskProcessor(
    tasks as unknown as TaskService,
    new FixedClock(new Date('2026-01-15T00:00:00Z')),
    logger as unknown as PinoLogger,
    new SpeciesNormalizationService(seededCatalogueStore()),
    seededCatalogueStore({ ...CATALOGUE_SEED, treeCare }),
  );
  return { processor, calls, logger, tasks };
}

const job = (data: Record<string, unknown>) => ({ data }) as Job;

describe('TaskProcessor', () => {
  it('creates nothing for a family with care data (its care calendar gives the first tasks)', async () => {
    const { processor, tasks } = build([treeCareFixture()]);
    const result = await processor.process(
      job({
        user_id: 'u1',
        plant_id: 'p1',
        lifecycle_stage: 'MATURE_BEARING',
        species: 'Langra Mango',
      }),
    );
    expect(tasks.createTasks).not.toHaveBeenCalled();
    expect(result.created_count).toBe(0);
  });

  it('waters a pending family in 3 days, mango included until its care ships', async () => {
    const { processor, calls } = build();
    await processor.process(
      job({
        user_id: 'u1',
        plant_id: 'p1',
        lifecycle_stage: 'MATURE_BEARING',
        species: 'Langra Mango',
      }),
    );
    expect(calls[0].map((d) => d.type)).toEqual([TaskType.WATER]);
    expect(calls[0][0]).toMatchObject({
      source: TaskSource.SYSTEM,
      sourceKey: 'lifecycle:p1:MATURE_BEARING:WATER',
    });
  });

  it('schedules a watering check in 3 days for other species', async () => {
    const { processor, calls } = build();
    await processor.process(
      job({
        user_id: 'u1',
        plant_id: 'p1',
        lifecycle_stage: 'SAPLING',
        species: 'Lemon',
      }),
    );
    expect(calls[0]).toHaveLength(1);
    expect(calls[0][0].dueDate.toISOString()).toBe('2026-01-18T00:00:00.000Z');
  });

  it('waters a citrus tree of no known kind in 3 days; a known kind gets its care instead', async () => {
    const citrus = CATALOGUE_SEED.treeCare.filter((c) => c.family === 'citrus');
    const nimbu = build(citrus);
    await nimbu.processor.process(
      job({
        user_id: 'u1',
        plant_id: 'p1',
        lifecycle_stage: 'SAPLING',
        species: 'Lemon',
      }),
    );
    expect(nimbu.calls[0].map((d) => d.type)).toEqual([TaskType.WATER]);
    const kinnow = build(citrus);
    await kinnow.processor.process(
      job({
        user_id: 'u1',
        plant_id: 'p2',
        lifecycle_stage: 'SAPLING',
        species: 'mandarin',
      }),
    );
    expect(kinnow.tasks.createTasks).not.toHaveBeenCalled();
  });

  it('is idempotent: a retried job creates nothing new', async () => {
    const { processor } = build();
    const data = {
      user_id: 'u1',
      plant_id: 'p1',
      lifecycle_stage: 'SAPLING',
      species: 'Lemon',
    };
    const first = await processor.process(job(data));
    const second = await processor.process(job(data));
    expect(first.created_count).toBe(1);
    expect(second.created_count).toBe(0);
  });

  it('drops legacy jobs that carry no user id instead of writing unscoped', async () => {
    const { processor, tasks, logger } = build();
    const result = await processor.process(
      job({ plant_id: 'p1', lifecycle_stage: 'SAPLING', species: 'Lemon' }),
    );
    expect(tasks.createTasks).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(result.created_count).toBe(0);
  });
});
