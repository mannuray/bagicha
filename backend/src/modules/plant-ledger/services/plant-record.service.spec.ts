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
    updateOwned: jest.fn(() => Promise.resolve(plant)),
  };
  const queue = { add: jest.fn(), getJobCounts: jest.fn() };
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
});
