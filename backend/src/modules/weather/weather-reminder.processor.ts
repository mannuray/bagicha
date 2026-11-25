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
  WeatherReminderService,
  type ReminderRunSummary,
} from './weather-reminder.service';

export const WEATHER_REMINDER_QUEUE = 'weather-reminders';
/** Early morning IST: reminders are there when gardeners open the app. */
export const WEATHER_REMINDER_SCHEDULE = {
  pattern: '0 5 * * *',
  tz: 'Asia/Kolkata',
} as const;
const SCHEDULER_ID = 'weather-reminders-daily';

/**
 * The app's one repeating job. The schedule lives in Redis under a fixed id,
 * so every instance and every deploy upserts the same schedule and the run
 * happens once a day, picked up by whichever worker is free.
 */
@Injectable()
export class WeatherReminderSchedule implements OnApplicationBootstrap {
  constructor(
    @InjectQueue(WEATHER_REMINDER_QUEUE) private readonly queue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { ...WEATHER_REMINDER_SCHEDULE },
      { name: 'run' },
    );
  }
}

@Processor(WEATHER_REMINDER_QUEUE)
export class WeatherReminderProcessor extends WorkerHost {
  constructor(
    private readonly reminders: WeatherReminderService,
    @InjectPinoLogger(WeatherReminderProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  process(): Promise<ReminderRunSummary> {
    return this.reminders.run();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    logJobFailure(this.logger, job, err);
  }
}
