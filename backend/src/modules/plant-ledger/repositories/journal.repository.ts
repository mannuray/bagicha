import { Injectable } from '@nestjs/common';
import { JournalEntry, LogType, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { Rows, SkipTake } from './types';

export type NewJournalData = Omit<
  Prisma.JournalEntryUncheckedCreateInput,
  'plant_id'
>;

const owned = (userId: string, plantId: string) => ({
  plant_id: plantId,
  plant: { user_id: userId },
});

@Injectable()
export class JournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  async listForPlant(
    userId: string,
    plantId: string,
    page: SkipTake,
  ): Promise<Rows<JournalEntry>> {
    const where = owned(userId, plantId);
    const [rows, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        ...page,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);
    return { rows, total };
  }

  /** Oldest first: the order cycle summaries are computed in. */
  listForCycle(
    userId: string,
    plantId: string,
    cycleId: string,
    tx?: Tx,
  ): Promise<JournalEntry[]> {
    return this.db(tx).journalEntry.findMany({
      where: { ...owned(userId, plantId), plant_cycle_id: cycleId },
      orderBy: { timestamp: 'asc' },
    });
  }

  recentForCycle(
    userId: string,
    plantId: string,
    cycleId: string,
    take: number,
  ): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: { ...owned(userId, plantId), plant_cycle_id: cycleId },
      orderBy: { timestamp: 'desc' },
      take,
    });
  }

  recentByTypes(
    userId: string,
    plantId: string,
    types: LogType[],
    take: number,
  ): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: { ...owned(userId, plantId), type: { in: types } },
      orderBy: { timestamp: 'desc' },
      take,
    });
  }

  recent(
    userId: string,
    plantId: string,
    take: number,
  ): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: owned(userId, plantId),
      orderBy: { timestamp: 'desc' },
      take,
    });
  }

  /** Returns null (and writes nothing) unless the user owns the plant. */
  async create(
    userId: string,
    plantId: string,
    data: NewJournalData,
    tx?: Tx,
  ): Promise<JournalEntry | null> {
    const db = this.db(tx);
    const plant = await db.plant.findFirst({
      where: { id: plantId, user_id: userId },
      select: { id: true },
    });
    if (!plant) return null;
    return db.journalEntry.create({ data: { ...data, plant_id: plantId } });
  }
}
