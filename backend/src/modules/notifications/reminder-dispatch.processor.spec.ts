import type { Job, Queue } from 'bullmq';
import type { PinoLogger } from 'nestjs-pino';
import {
  REMINDER_DISPATCH_SCHEDULE,
  ReminderDispatchProcessor,
  ReminderDispatchSchedule,
} from './reminder-dispatch.processor';
import type { ReminderDispatchService } from './reminder-dispatch.service';

describe('ReminderDispatchSchedule', () => {
  it('registers a quarter-hourly IST run with quick retries, under one fixed id', async () => {
    const queue = { upsertJobScheduler: jest.fn(() => Promise.resolve()) };
    await new ReminderDispatchSchedule(
      queue as unknown as Queue,
    ).onApplicationBootstrap();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'push-reminders-quarterly',
      { pattern: '*/15 * * * *', tz: 'Asia/Kolkata' },
      {
        name: 'run',
        opts: { attempts: 3, backoff: { type: 'fixed', delay: 60_000 } },
      },
    );
    expect(REMINDER_DISPATCH_SCHEDULE).toEqual({
      pattern: '*/15 * * * *',
      tz: 'Asia/Kolkata',
    });
  });
});

describe('ReminderDispatchProcessor', () => {
  const logger = () => ({ warn: jest.fn(), error: jest.fn() });

  it('runs the reminder dispatch', async () => {
    const summary = { slot: 'MORNING', users: 1, sent: 1 };
    const service = { run: jest.fn(() => Promise.resolve(summary)) };
    const processor = new ReminderDispatchProcessor(
      service as unknown as ReminderDispatchService,
      logger() as unknown as PinoLogger,
    );
    await expect(
      processor.process({ timestamp: 1_000, opts: {} } as unknown as Job),
    ).resolves.toEqual(summary);
  });

  it('passes the time the run was scheduled for, not when it started', async () => {
    const service = { run: jest.fn(() => Promise.resolve({})) };
    const processor = new ReminderDispatchProcessor(
      service as unknown as ReminderDispatchService,
      logger() as unknown as PinoLogger,
    );
    // The scheduler adds the next run at `timestamp` with a delay up to its due time.
    await processor.process({
      timestamp: Date.parse('2026-11-27T01:40:00Z'),
      opts: { delay: 5 * 60_000 },
    } as unknown as Job);
    expect(service.run).toHaveBeenCalledWith(new Date('2026-11-27T01:45:00Z'));
  });

  it('logs a failed run as an error after its last attempt', () => {
    const log = logger();
    new ReminderDispatchProcessor(
      { run: jest.fn() } as unknown as ReminderDispatchService,
      log as unknown as PinoLogger,
    ).onFailed(
      {
        id: 'x',
        queueName: 'push-reminders',
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job,
      new Error('db down'),
    );
    expect(log.error).toHaveBeenCalled();
  });
});
