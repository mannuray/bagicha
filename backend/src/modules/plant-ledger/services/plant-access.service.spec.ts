import type { Plant } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../common/errors';
import type { PlantRepository } from '../repositories/plant.repository';
import { PlantAccess } from './plant-access.service';

const repo = (plant: Partial<Plant> | null) =>
  ({
    findOwned: jest.fn().mockResolvedValue(plant),
  }) as unknown as PlantRepository;

describe('PlantAccess', () => {
  it('returns the owner’s plant', async () => {
    await expect(
      new PlantAccess(repo({ id: 'p' })).owned('u', 'p'),
    ).resolves.toEqual({ id: 'p' });
  });

  it('is PLANT_NOT_FOUND for a plant the user does not own', async () => {
    await expect(
      new PlantAccess(repo(null)).owned('u', 'p'),
    ).rejects.toMatchObject({
      reason: 'PLANT_NOT_FOUND',
    });
    await expect(
      new PlantAccess(repo(null)).growing('u', 'p'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('is PLANT_ENDED for an ended plant when growing is required', async () => {
    const ended = new PlantAccess(repo({ id: 'p', ended_at: new Date() }));
    await expect(ended.growing('u', 'p')).rejects.toBeInstanceOf(ConflictError);
    await expect(ended.growing('u', 'p')).rejects.toMatchObject({
      reason: 'PLANT_ENDED',
    });
    await expect(ended.owned('u', 'p')).resolves.toMatchObject({ id: 'p' });
  });
});
