import { Injectable } from '@nestjs/common';
import { Plant } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../common/errors';
import { Tx } from '../../../common/prisma/transaction';
import { PlantRepository } from '../repositories/plant.repository';

/** The one place that decides whether a user may read or grow a plant. */
@Injectable()
export class PlantAccess {
  constructor(private readonly plants: PlantRepository) {}

  /** The user's plant; PLANT_NOT_FOUND for anyone else's (never revealing it exists). */
  async owned(userId: string, plantId: string, tx?: Tx): Promise<Plant> {
    const plant = await this.plants.findOwned(userId, plantId, tx);
    if (!plant) throw new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');
    return plant;
  }

  /** The user's plant, still growing: an ended plant takes no new entries or task changes. */
  async growing(userId: string, plantId: string, tx?: Tx): Promise<Plant> {
    const plant = await this.owned(userId, plantId, tx);
    if (plant.ended_at) {
      throw new ConflictError(
        'PLANT_ENDED',
        'This tree has ended; restore it to keep growing its record',
      );
    }
    return plant;
  }
}
