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
  ACCOUNT_ERASURE_QUEUE,
  AccountErasureService,
  type ErasureRunSummary,
} from './account-erasure.service';

/** Night-time IST, away from the 05:00 weather run. */
export const ACCOUNT_ERASURE_SCHEDULE = {
  pattern: '30 3 * * *',
  tz: 'Asia/Kolkata',
} as const;
const SCHEDULER_ID = 'account-erasure-daily';

/** Upserts the daily schedule under a fixed id: one run a day across instances and deploys. */
@Injectable()
export class AccountErasureSchedule implements OnApplicationBootstrap {
  constructor(
    @InjectQueue(ACCOUNT_ERASURE_QUEUE) private readonly queue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { ...ACCOUNT_ERASURE_SCHEDULE },
      { name: 'run' },
    );
  }
}

@Processor(ACCOUNT_ERASURE_QUEUE)
export class AccountErasureProcessor extends WorkerHost {
  constructor(
    private readonly erasure: AccountErasureService,
    @InjectPinoLogger(AccountErasureProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  process(): Promise<ErasureRunSummary> {
    return this.erasure.run();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    logJobFailure(this.logger, job, err);
  }
}
