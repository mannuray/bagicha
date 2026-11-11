import { Injectable } from '@nestjs/common';
import { GardenPlace, GardenPlaceKind, GardenSun } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';

/** The user's named beds, grow-bags and pots. Every query is owner-scoped. */
@Injectable()
export class GardenPlaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  listActive(userId: string): Promise<GardenPlace[]> {
    return this.prisma.gardenPlace.findMany({
      where: { user_id: userId, archived_at: null },
      orderBy: { name: 'asc' },
    });
  }

  findOwned(userId: string, id: string, tx?: Tx): Promise<GardenPlace | null> {
    return this.db(tx).gardenPlace.findFirst({
      where: { id, user_id: userId },
    });
  }

  create(
    userId: string,
    data: { name: string; kind: GardenPlaceKind; sun_hours?: GardenSun | null },
  ): Promise<GardenPlace> {
    return this.prisma.gardenPlace.create({
      data: { ...data, user_id: userId },
    });
  }

  async updateOwned(
    userId: string,
    id: string,
    data: {
      name?: string;
      kind?: GardenPlaceKind;
      sun_hours?: GardenSun | null;
      archived_at?: Date | null;
    },
  ): Promise<GardenPlace | null> {
    const { count } = await this.prisma.gardenPlace.updateMany({
      where: { id, user_id: userId },
      data,
    });
    return count === 0 ? null : this.findOwned(userId, id);
  }

  /** The most recent season in this place that ended on or after `since`, with its crop. */
  lastClosedSeason(placeId: string, since: Date) {
    return this.prisma.plantCycle.findFirst({
      where: { place_id: placeId, closed_at: { gte: since } },
      orderBy: { closed_at: 'desc' },
      select: {
        started_at: true,
        closed_at: true,
        plant: { select: { crop_id: true } },
      },
    });
  }
}
