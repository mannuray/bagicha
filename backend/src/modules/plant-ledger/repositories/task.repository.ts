import { Injectable } from '@nestjs/common';
import { Prisma, Task, TaskSource, TaskStatus } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { Rows, SkipTake } from './types';

export type NewTaskData = Omit<Prisma.TaskUncheckedCreateInput, 'plant_id'>;

export const taskViewInclude = {
  plant: { select: { id: true, name: true, record_kind: true } },
  plant_cycle: { select: { cycle_year: true } },
  seasonal_pack: { select: { current_phase: true, upcoming_phase: true } },
  personalized_overlay: {
    select: { reasoning_summary: true, adjusted_phase: true },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithView = Prisma.TaskGetPayload<{
  include: typeof taskViewInclude;
}>;

const ORDER: Prisma.TaskOrderByWithRelationInput[] = [
  { status: 'asc' },
  { due_date: 'asc' },
  { created_at: 'desc' },
];

const owned = (userId: string, plantId: string) => ({
  plant_id: plantId,
  plant: { user_id: userId },
});

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  async listForPlant(
    userId: string,
    plantId: string,
    page: SkipTake,
  ): Promise<Rows<TaskWithView>> {
    const where = owned(userId, plantId);
    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskViewInclude,
        orderBy: ORDER,
        ...page,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { rows, total };
  }

  async listForUser(
    userId: string,
    page: SkipTake,
  ): Promise<Rows<TaskWithView>> {
    const where = { plant: { user_id: userId } };
    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskViewInclude,
        orderBy: ORDER,
        ...page,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { rows, total };
  }

  listForCycle(
    userId: string,
    plantId: string,
    cycleId: string,
  ): Promise<Array<Pick<Task, 'status' | 'title'>>> {
    return this.prisma.task.findMany({
      where: { ...owned(userId, plantId), plant_cycle_id: cycleId },
      select: { status: true, title: true },
    });
  }

  findOwned(
    userId: string,
    plantId: string,
    taskId: string,
  ): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: { id: taskId, ...owned(userId, plantId) },
    });
  }

  findPendingBySourceKey(
    userId: string,
    plantId: string,
    source: TaskSource,
    sourceKey: string,
    tx?: Tx,
  ): Promise<Task | null> {
    return this.db(tx).task.findFirst({
      where: {
        ...owned(userId, plantId),
        source,
        source_key: sourceKey,
        status: TaskStatus.PENDING,
      },
    });
  }

  /** Returns null (and writes nothing) unless the user owns the plant. */
  async create(
    userId: string,
    plantId: string,
    data: NewTaskData,
    tx?: Tx,
  ): Promise<Task | null> {
    const db = this.db(tx);
    const plant = await db.plant.findFirst({
      where: { id: plantId, user_id: userId },
      select: { id: true },
    });
    if (!plant) return null;
    return db.task.create({ data: { ...data, plant_id: plantId } });
  }

  async updateStatus(
    userId: string,
    plantId: string,
    taskId: string,
    status: TaskStatus,
    completedAt: Date | null,
  ): Promise<TaskWithView | null> {
    const { count } = await this.prisma.task.updateMany({
      where: { id: taskId, ...owned(userId, plantId) },
      data: { status, completed_at: completedAt },
    });
    if (count === 0) return null;
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: taskViewInclude,
    });
  }
}
