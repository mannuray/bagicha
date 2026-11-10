import { Injectable } from '@nestjs/common';
import { PlantCycle, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { Rows, SkipTake } from './types';

const withRecentEntries = {
  journal_entries: { orderBy: { timestamp: 'desc' }, take: 3 },
} satisfies Prisma.PlantCycleInclude;

export type CycleWithRecentEntries = Prisma.PlantCycleGetPayload<{
  include: typeof withRecentEntries;
}>;

@Injectable()
export class CycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  /** Returns null (and writes nothing) unless the user owns the plant. */
  async upsertForYear(
    userId: string,
    plantId: string,
    cycleYear: number,
    tx?: Tx,
  ): Promise<PlantCycle | null> {
    const db = this.db(tx);
    const plant = await db.plant.findFirst({
      where: { id: plantId, user_id: userId },
      select: { id: true },
    });
    if (!plant) return null;
    return db.plantCycle.upsert({
      // Trees have one cycle per year (season 1); crop seasons are opened by the journey.
      where: {
        plant_cycle_season: {
          plant_id: plantId,
          cycle_year: cycleYear,
          season_no: 1,
        },
      },
      create: { plant_id: plantId, cycle_year: cycleYear },
      update: {},
    });
  }

  /** A crop's season that has started and not closed. */
  openSeason(plantId: string, tx?: Tx): Promise<PlantCycle | null> {
    return this.db(tx).plantCycle.findFirst({
      where: { plant_id: plantId, started_at: { not: null }, closed_at: null },
      orderBy: { started_at: 'desc' },
    });
  }

  async listForPlant(
    userId: string,
    plantId: string,
    page: SkipTake,
  ): Promise<Rows<CycleWithRecentEntries>> {
    const where = { plant_id: plantId, plant: { user_id: userId } };
    const [rows, total] = await Promise.all([
      this.prisma.plantCycle.findMany({
        where,
        include: withRecentEntries,
        orderBy: [{ cycle_year: 'desc' }, { season_no: 'desc' }],
        ...page,
      }),
      this.prisma.plantCycle.count({ where }),
    ]);
    return { rows, total };
  }

  latestTwo(userId: string, plantId: string): Promise<PlantCycle[]> {
    return this.prisma.plantCycle.findMany({
      where: { plant_id: plantId, plant: { user_id: userId } },
      orderBy: [{ cycle_year: 'desc' }, { season_no: 'desc' }],
      take: 2,
    });
  }

  /** True when the owner's cycle was updated. */
  async update(
    userId: string,
    cycleId: string,
    data: Prisma.PlantCycleUncheckedUpdateManyInput,
    tx?: Tx,
  ): Promise<boolean> {
    const { count } = await this.db(tx).plantCycle.updateMany({
      where: { id: cycleId, plant: { user_id: userId } },
      data,
    });
    return count > 0;
  }
}
