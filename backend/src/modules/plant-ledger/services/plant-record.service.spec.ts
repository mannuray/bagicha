import { LifecycleStage } from '@prisma/client';
import { FixedClock } from '../../../common/time';
import { PlantRepository } from '../repositories/plant.repository';
import { LifecycleService } from './lifecycle.service';
import { PlantRecordService } from './plant-record.service';
import { SpeciesNormalizationService } from './species-normalization.service';

const NOW = new Date('2026-11-10T06:00:00Z');

function build(plant: Record<string, unknown>) {
  const repo = {
    findOwnedDetail: jest.fn(() => Promise.resolve({ ...plant })),
    findOwnedWithContext: jest.fn(() => Promise.resolve({ ...plant })),
    updateOwned: jest.fn(() => Promise.resolve(plant)),
  };
  const queue = {
    add: jest.fn(() => Promise.resolve()),
    getJobCounts: jest.fn(),
  };
  const clock = new FixedClock(NOW);
  const species = new SpeciesNormalizationService();
  const service = new PlantRecordService(
    repo as unknown as PlantRepository,
    new LifecycleService(clock, species),
    {} as never,
    species,
    clock,
    queue as never,
    { registerQueueDepth: jest.fn() } as never,
    { warn: jest.fn() } as never,
  );
  return { service, repo, queue };
}

describe('PlantRecordService.getDetail stage', () => {
  it('never moves an automatic stage backwards, and queues nothing', async () => {
    const { service, repo, queue } = build({
      id: 'p1',
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: LifecycleStage.MATURE_BEARING,
      lifecycle_stage_manual: false,
      planting_date: new Date('2021-05-10T00:00:00Z'),
      first_flowering_at: null,
      first_fruit_set_at: null,
      first_harvest_at: null,
      ended_at: null,
    });
    const plant = await service.getDetail('u1', 'p1');
    expect(plant.lifecycle_stage).toBe(LifecycleStage.MATURE_BEARING);
    expect(repo.updateOwned).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('moves a papaya forward by its own profile', async () => {
    const { service, repo } = build({
      id: 'p1',
      species: 'Papaya',
      species_family: 'papaya',
      lifecycle_stage: LifecycleStage.SAPLING,
      lifecycle_stage_manual: false,
      planting_date: new Date('2026-01-10T00:00:00Z'),
      first_flowering_at: null,
      first_fruit_set_at: null,
      first_harvest_at: null,
      ended_at: null,
    });
    const plant = await service.getDetail('u1', 'p1');
    expect(plant.lifecycle_stage).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(repo.updateOwned).toHaveBeenCalled();
  });

  it('queues one job per plant and stage, and the page still opens when the queue is down', async () => {
    const { service, queue } = build({
      id: 'p1',
      species: 'Papaya',
      species_family: 'papaya',
      lifecycle_stage: LifecycleStage.SAPLING,
      lifecycle_stage_manual: false,
      planting_date: new Date('2026-01-10T00:00:00Z'),
      first_flowering_at: null,
      first_fruit_set_at: null,
      first_harvest_at: null,
      ended_at: null,
    });
    queue.add.mockRejectedValue(new Error('redis down'));
    const plant = await service.getDetail('u1', 'p1');
    expect(plant.lifecycle_stage).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(queue.add).toHaveBeenCalledWith(
      'generate',
      expect.objectContaining({ plant_id: 'p1' }),
      { jobId: 'lifecycle-p1-FIRST_FLOWERING' },
    );
  });
});

describe('PlantRecordService.getContextForAi for a flower', () => {
  it('sends the bloom season, never the fruit-tree season', async () => {
    const { service } = build({
      id: 'p1',
      name: 'Gulab',
      species: 'Rose',
      variety: null,
      record_kind: 'FLOWER',
      crop_id: null,
      lifecycle_stage: LifecycleStage.FIRST_FLOWERING,
      health_status: 'HEALTHY',
      user: {
        district: 'Patna',
        latitude: null,
        longitude: null,
        region_cluster: 'EAST_INDIA',
      },
      cycles: [],
      journal_entries: [],
      diagnosis_outcomes: [],
      tasks: [],
    });
    const context = await service.getContextForAi('u1', 'p1');
    expect(context.plant.species_family).toBe('rose');
    expect(context.seasonal_state).toEqual({
      kind: 'perennial_flower',
      bloom: { status: 'in_season', window_label: 'Nov–Mar' },
    });
  });
});
