import { Injectable } from '@nestjs/common';
import { CropStage, LogType, Plant, Prisma } from '@prisma/client';
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

export type PlantDetail = Prisma.PlantGetPayload<{
  include: typeof detailInclude;
}>;

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
    status: 'active' | 'planned' | 'ended' = 'active',
    kind?: 'tree' | 'crop',
  ): Promise<Rows<Plant & { season_started_at: Date | null }>> {
    const growing: CropStage[] = [
      CropStage.NURSERY,
      CropStage.IN_GROUND,
      CropStage.HARVESTING,
    ];
    const waiting: CropStage[] = [CropStage.PLANNED, CropStage.RESTING];
    const byStatus: Prisma.PlantWhereInput =
      status === 'ended'
        ? { user_id: userId, ended_at: { not: null } }
        : status === 'planned'
          ? { user_id: userId, ended_at: null, crop_stage: { in: waiting } }
          : {
              user_id: userId,
              ended_at: null,
              OR: [{ crop_id: null }, { crop_stage: { in: growing } }],
            };
    const where: Prisma.PlantWhereInput =
      kind === undefined
        ? byStatus
        : {
            AND: [
              byStatus,
              { crop_id: kind === 'tree' ? null : { not: null } },
            ],
          };
    const [rows, total] = await Promise.all([
      this.prisma.plant.findMany({
        where,
        orderBy:
          status === 'ended'
            ? [{ ended_at: 'desc' as const }]
            : [{ created_at: 'desc' as const }],
        // A growing crop's open season, so lists can say "day 12".
        include: {
          cycles: {
            where: { started_at: { not: null }, closed_at: null },
            select: { started_at: true },
            orderBy: { started_at: 'desc' as const },
            take: 1,
          },
        },
        ...page,
      }),
      this.prisma.plant.count({ where }),
    ]);
    return {
      rows: rows.map(({ cycles, ...plant }) => ({
        ...plant,
        season_started_at: plant.crop_id
          ? (cycles[0]?.started_at ?? null)
          : null,
      })),
      total,
    };
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

  /** The user's not-ended record for a calendar crop, if any. */
  findActiveCrop(userId: string, cropId: string): Promise<Plant | null> {
    return this.prisma.plant.findFirst({
      where: { user_id: userId, crop_id: cropId, ended_at: null },
    });
  }

  /** Journey crops waiting for their next season (planned or resting). */
  listWaitingCrops(userId: string): Promise<Plant[]> {
    return this.prisma.plant.findMany({
      where: {
        user_id: userId,
        ended_at: null,
        crop_id: { not: null },
        crop_stage: { in: [CropStage.PLANNED, CropStage.RESTING] },
      },
    });
  }

  /** When each of the plant's seasons started. */
  async seasonStarts(plantId: string): Promise<Date[]> {
    const rows = await this.prisma.plantCycle.findMany({
      where: { plant_id: plantId, started_at: { not: null } },
      select: { started_at: true },
    });
    return rows.map((r) => r.started_at as Date);
  }
}
