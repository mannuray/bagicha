import { Processor, WorkerHost } from '@nestjs/bullmq';
import { TaskPriority, TaskSource, TaskType } from '@prisma/client';
import { Job } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { addDays, addMonths, Clock } from '../../../common/time';
import { TaskDraft, TaskService } from '../services/task.service';

export const TASK_GENERATION_QUEUE = 'task-generation';

export interface TaskGenerationJob {
  user_id?: string;
  plant_id: string;
  lifecycle_stage: string;
  species: string;
}

/** Creates perennial care tasks when a plant is added or changes stage. Safe to retry. */
@Processor(TASK_GENERATION_QUEUE)
export class TaskProcessor extends WorkerHost {
  constructor(
    private readonly tasks: TaskService,
    private readonly clock: Clock,
    @InjectPinoLogger(TaskProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(
    job: Job<TaskGenerationJob>,
  ): Promise<{ created_count: number }> {
    const { user_id, plant_id, lifecycle_stage, species } = job.data;
    if (!user_id) {
      // Jobs queued before user scoping can't be written safely.
      this.logger.warn(
        { plantId: plant_id },
        'Dropping task job without user id',
      );
      return { created_count: 0 };
    }
    this.logger.info(
      { plantId: plant_id, species, lifecycleStage: lifecycle_stage },
      'Generating perennial tasks',
    );

    const now = this.clock.now();
    const draft = (type: TaskType, dueDate: Date): TaskDraft => ({
      type,
      priority: TaskPriority.MEDIUM,
      source: TaskSource.SYSTEM,
      sourceKey: `lifecycle:${plant_id}:${lifecycle_stage}:${type}`,
      dueDate,
    });

    const drafts = species.toLowerCase().includes('mango')
      ? [
          draft(TaskType.FEED, addMonths(now, 6)), // next deep feed
          draft(TaskType.PRUNE, addMonths(now, 3)), // pruning window
        ]
      : [draft(TaskType.WATER, addDays(now, 3))];

    const results = await this.tasks.createTasks(user_id, plant_id, drafts);
    return {
      created_count: results.filter((r) => r.status === 'created').length,
    };
  }
}
