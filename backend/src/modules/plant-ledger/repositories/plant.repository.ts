import { Injectable } from '@nestjs/common';
import { LogType, Plant, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { Rows, SkipTake } from './types';

export type NewPlantData = Omit<Prisma.PlantUncheckedCreateInput, 'user_id'>;

const AI_CONTEXT_LOG_TYPES = [
  LogType.DIAGNOSIS,
  LogType.PEST_DIAGNOSIS,
  LogType.TREATMENT,
  LogType.WATERING_STRESS,
  LogType.HARVEST,
];

const aiContextInclude = {
  user: { select: { district: true, latitude: true, longitude: true } },
  cycles: { orderBy: { cycle_year: 'desc' }, take: 2 },
  journal_entries: {
    where: { type: { in: AI_CONTEXT_LOG_TYPES } },
    orderBy: { timestamp: 'desc' },
    take: 8,
  },
  tasks: { orderBy: { due_date: 'asc' }, take: 6 },
  diagnosis_outcomes: { orderBy: { event_at: 'desc' }, take: 3 },
} satisfies Prisma.PlantInclude;

export type PlantWithAiContext = Prisma.PlantGetPayload<{
  include: typeof aiContextInclude;
}>;

const detailInclude = {
  _count: { select: { journal_entries: true } },
  replaced_by: { select: { id: true, name: true } },
  replaces: { select: { id: true, name: true } },
} satisfies Prisma.PlantInclude;

export type PlantDetail = Prisma.PlantGetPayload<{ include: typeof detailInclude }>;

/** Every query is filtered by owner; a miss returns null, never throws. */
@Injectable()
export class PlantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  findOwned(userId: string, plantId: string, tx?: Tx): Promise<Plant | null> {
    return this.db(tx).plant.findFirst({
      where: { id: plantId, user_id: userId },
    });
  }

  findOwnedDetail(
    userId: string,
    plantId: string,
  ): Promise<PlantDetail | null> {
    return this.prisma.plant.findFirst({
      where: { id: plantId, user_id: userId },
      include: detailInclude,
    });
  }

  findOwnedWithContext(
    userId: string,
    plantId: string,
  ): Promise<PlantWithAiContext | null> {
    return this.prisma.plant.findFirst({
      where: { id: plantId, user_id: userId },
      include: aiContextInclude,
    });
  }

  findOwnedWithOwnerLocation(userId: string, plantId: string) {
    return this.prisma.plant.findFirst({
      where: { id: plantId, user_id: userId },
      include: {
        user: { select: { district: true, latitude: true, longitude: true } },
      },
    });
  }

  async listOwned(
    userId: string,
    page: SkipTake,
    status: 'active' | 'ended' = 'active',
  ): Promise<Rows<Plant>> {
    const where = {
      user_id: userId,
      ended_at: status === 'ended' ? { not: null } : null,
    };
    const [rows, total] = await Promise.all([
      this.prisma.plant.findMany({
        where,
        orderBy:
          status === 'ended'
            ? [{ ended_at: 'desc' as const }]
            : [{ created_at: 'desc' as const }],
        ...page,
      }),
      this.prisma.plant.count({ where }),
    ]);
    return { rows, total };
  }

  create(userId: string, data: NewPlantData, tx?: Tx): Promise<Plant> {
    return this.db(tx).plant.create({ data: { ...data, user_id: userId } });
  }

  async updateOwned(
    userId: string,
    plantId: string,
    data: Prisma.PlantUncheckedUpdateManyInput,
    tx?: Tx,
  ): Promise<Plant | null> {
    const { count } = await this.db(tx).plant.updateMany({
      where: { id: plantId, user_id: userId },
      data,
    });
    return count === 0 ? null : this.findOwned(userId, plantId, tx);
  }
}
