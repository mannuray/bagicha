import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  Prisma,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { NotFoundError } from '../../../common/errors';
import { Metrics } from '../../../common/observability';
import {
  Page,
  PageQuery,
  toPage,
  toSkipTake,
} from '../../../common/pagination';
import { Tx } from '../../../common/prisma/transaction';
import { mapTaskView } from '../domain/task-view';
import { isUniqueViolation } from '../../../common/prisma/unique-violation';
import { TaskRepository } from '../repositories/task.repository';

export interface TaskDraft {
  type: TaskType;
  category?: TaskCategory | null;
  priority: TaskPriority;
  title?: string | null;
  source: TaskSource;
  sourceKey: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
  dueDate: Date;
  plantCycleId?: string | null;
  seasonalPackId?: string | null;
  personalizedOverlayId?: string | null;
  diagnosisOutcomeId?: string | null;
}

export interface TaskCreationResult {
  sourceKey: string;
  status: 'created' | 'skipped' | 'failed';
  taskId?: string;
  reason?: string;
}

export type TaskView = ReturnType<typeof mapTaskView>;

/**
 * Sources whose keys name one occurrence (a plan step, a year's flower care, one
 * season pack's task): once done or skipped it must not come back. A task
 * cancelled because the tree ended doesn't count, so restoring a tree refills it.
 */
const ONE_OFF_SOURCES: ReadonlySet<TaskSource> = new Set([
  TaskSource.CROP_PLAN,
  TaskSource.FLOWER_CARE,
  TaskSource.SEASONAL_PACK,
  TaskSource.PERSONALIZED_OVERLAY,
]);

/** The single entry point for creating tasks, plus task reads and status changes. */
@Injectable()
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly metrics: Metrics,
    @InjectPinoLogger(TaskService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Creates each draft unless a task with the same (source, sourceKey) already
   * exists: pending for repeating sources, or for one-off sources also done or
   * skipped. Inside a transaction any error propagates (the transaction is
   * already aborted); outside one, a failing draft is reported and the rest continue.
   */
  async createTasks(
    userId: string,
    plantId: string,
    drafts: TaskDraft[],
    tx?: Tx,
  ): Promise<TaskCreationResult[]> {
    const results: TaskCreationResult[] = [];
    for (const draft of drafts) {
      try {
        results.push(await this.createOne(userId, plantId, draft, tx));
      } catch (err: unknown) {
        if (tx) throw err;
        // Internal details stay in the logs; clients get a stable code.
        this.logger.error(
          { err, plantId, sourceKey: draft.sourceKey },
          'Task creation failed',
        );
        results.push({
          sourceKey: draft.sourceKey,
          status: 'failed',
          reason: 'TASK_CREATE_FAILED',
        });
      }
    }
    const createdBySource = new Map<TaskSource, number>();
    drafts.forEach((draft, i) => {
      if (results[i]?.status === 'created') {
        createdBySource.set(
          draft.source,
          (createdBySource.get(draft.source) ?? 0) + 1,
        );
      }
    });
    createdBySource.forEach((count, source) =>
      this.metrics.taskCreated(source, count),
    );
    return results;
  }

  private async createOne(
    userId: string,
    plantId: string,
    draft: TaskDraft,
    tx?: Tx,
  ): Promise<TaskCreationResult> {
    const existing = ONE_OFF_SOURCES.has(draft.source)
      ? await this.tasks.findOpenOrClosedBySourceKey(
          userId,
          plantId,
          draft.source,
          draft.sourceKey,
          tx,
        )
      : await this.tasks.findPendingBySourceKey(
          userId,
          plantId,
          draft.source,
          draft.sourceKey,
          tx,
        );
    if (existing) {
      return {
        sourceKey: draft.sourceKey,
        status: 'skipped',
        taskId: existing.id,
      };
    }
    let task: Awaited<ReturnType<TaskRepository['create']>>;
    try {
      task = await this.tasks.create(
        userId,
        plantId,
        {
          type: draft.type,
          category: draft.category ?? null,
          priority: draft.priority,
          title: draft.title ?? null,
          source: draft.source,
          source_key: draft.sourceKey,
          reason: draft.reason ?? null,
          metadata: draft.metadata,
          due_date: draft.dueDate,
          plant_cycle_id: draft.plantCycleId ?? null,
          seasonal_pack_id: draft.seasonalPackId ?? null,
          personalized_overlay_id: draft.personalizedOverlayId ?? null,
          diagnosis_outcome_id: draft.diagnosisOutcomeId ?? null,
        },
        tx,
      );
    } catch (err) {
      // Two refreshes raced and the other one created it (unique pending key).
      // Inside a transaction Postgres has already aborted, so let it propagate.
      if (tx || !isUniqueViolation(err)) throw err;
      const winner = await this.tasks.findPendingBySourceKey(
        userId,
        plantId,
        draft.source,
        draft.sourceKey,
      );
      if (!winner) throw err;
      return {
        sourceKey: draft.sourceKey,
        status: 'skipped',
        taskId: winner.id,
      };
    }
    if (!task) {
      return {
        sourceKey: draft.sourceKey,
        status: 'failed',
        reason: 'PLANT_NOT_FOUND',
      };
    }
    return { sourceKey: draft.sourceKey, status: 'created', taskId: task.id };
  }

  async listForPlant(
    userId: string,
    plantId: string,
    q: PageQuery,
  ): Promise<Page<TaskView>> {
    const { rows, total } = await this.tasks.listForPlant(
      userId,
      plantId,
      toSkipTake(q),
    );
    return toPage(rows.map(mapTaskView), total, q);
  }

  async listForUser(userId: string, q: PageQuery): Promise<Page<TaskView>> {
    const { rows, total } = await this.tasks.listForUser(userId, toSkipTake(q));
    return toPage(rows.map(mapTaskView), total, q);
  }

  async updateStatus(
    userId: string,
    plantId: string,
    taskId: string,
    status: TaskStatus,
    now: Date,
  ): Promise<TaskView> {
    const updated = await this.tasks.updateStatus(
      userId,
      plantId,
      taskId,
      status,
      status === TaskStatus.COMPLETED ? now : null,
    );
    if (!updated) throw new NotFoundError('TASK_NOT_FOUND', 'Task not found');
    if (status === TaskStatus.COMPLETED) this.metrics.taskCompleted();
    return mapTaskView(updated);
  }
}
