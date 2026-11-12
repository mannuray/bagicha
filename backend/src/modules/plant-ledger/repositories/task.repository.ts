import { Injectable } from '@nestjs/common';
import { Prisma, Task, TaskSource, TaskStatus } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import type { TaskListStatus } from '../dto/list-tasks-query.dto';
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

/** Most recently closed first (skipped tasks have no completed_at, so updated_at). */
const CLOSED_ORDER: Prisma.TaskOrderByWithRelationInput[] = [
  { updated_at: 'desc' },
  { id: 'desc' },
];
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
    status?: TaskListStatus,
  ): Promise<Rows<TaskWithView>> {
    const where: Prisma.TaskWhereInput = {
      plant: { user_id: userId },
      ...(status === 'open' && { status: TaskStatus.PENDING }),
      ...(status === 'closed' && { status: { not: TaskStatus.PENDING } }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskViewInclude,
        orderBy: status === 'closed' ? CLOSED_ORDER : ORDER,
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

  /** Pending, done or skipped (not cancelled): a one-off the gardener closed must not come back. */
  findOpenOrClosedBySourceKey(
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
        status: { not: TaskStatus.CANCELLED },
      },
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

  /**
   * Returns null (and writes nothing) unless the user owns the plant and it is
   * still growing. The one choke point for every task source, including jobs
   * queued before the tree ended.
   */
  async create(
    userId: string,
    plantId: string,
    data: NewTaskData,
    tx?: Tx,
  ): Promise<Task | null> {
    const db = this.db(tx);
    const plant = await db.plant.findFirst({
      where: { id: plantId, user_id: userId, ended_at: null },
      select: { id: true },
    });
    if (!plant) return null;
    return db.task.create({ data: { ...data, plant_id: plantId } });
  }

  /** Cancels the plant's pending tasks from these sources whose key isn't in `keep`. */
  async cancelPendingExcept(
    userId: string,
    plantId: string,
    sources: TaskSource[],
    keep: string[],
  ): Promise<number> {
    const { count } = await this.prisma.task.updateMany({
      where: {
        ...owned(userId, plantId),
        status: TaskStatus.PENDING,
        source: { in: sources },
        OR: [{ source_key: null }, { source_key: { notIn: keep } }],
      },
      data: { status: TaskStatus.CANCELLED },
    });
    return count;
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
