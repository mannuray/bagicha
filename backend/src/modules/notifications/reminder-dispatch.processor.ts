import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { logJobFailure } from '../../common/redis/job-failure';
import {
  ReminderDispatchService,
  type ReminderRunSummary,
} from './reminder-dispatch.service';

export const REMINDER_DISPATCH_QUEUE = 'push-reminders';
/** Every quarter-hour IST: reminder times are picked in 15-minute steps. */
export const REMINDER_DISPATCH_SCHEDULE = {
  pattern: '*/15 * * * *',
  tz: 'Asia/Kolkata',
} as const;
const SCHEDULER_ID = 'push-reminders-quarterly';
/** Retries land inside the same quarter-hour, so a reminder is late by minutes, never by a slot. */
const RETRY = { attempts: 3, backoff: { type: 'fixed', delay: 60_000 } };

/**
 * The schedule lives in Redis under a fixed id, so every instance and every
 * deploy upserts the same one and each quarter-hour runs once.
 */
@Injectable()
export class ReminderDispatchSchedule implements OnApplicationBootstrap {
  constructor(
    @InjectQueue(REMINDER_DISPATCH_QUEUE) private readonly queue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { ...REMINDER_DISPATCH_SCHEDULE },
      { name: 'run', opts: RETRY },
    );
  }
}

@Processor(REMINDER_DISPATCH_QUEUE)
export class ReminderDispatchProcessor extends WorkerHost {
  constructor(
    private readonly dispatch: ReminderDispatchService,
    @InjectPinoLogger(ReminderDispatchProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  /** The scheduler adds each run ahead of time with a delay up to its due time; a retry keeps both. */
  process(job: Job): Promise<ReminderRunSummary> {
    return this.dispatch.run(new Date(job.timestamp + (job.opts.delay ?? 0)));
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    logJobFailure(this.logger, job, err);
  }
}
