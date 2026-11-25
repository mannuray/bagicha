import type { Job, Queue } from 'bullmq';
import type { PinoLogger } from 'nestjs-pino';
import {
  WEATHER_REMINDER_SCHEDULE,
  WeatherReminderProcessor,
  WeatherReminderSchedule,
} from './weather-reminder.processor';
import type { WeatherReminderService } from './weather-reminder.service';

describe('WeatherReminderSchedule', () => {
  it('registers one daily run at 05:00 IST under a fixed id (one schedule however many instances)', async () => {
    const queue = { upsertJobScheduler: jest.fn(() => Promise.resolve()) };
    await new WeatherReminderSchedule(
      queue as unknown as Queue,
    ).onApplicationBootstrap();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'weather-reminders-daily',
      { pattern: '0 5 * * *', tz: 'Asia/Kolkata' },
      { name: 'run' },
    );
    expect(WEATHER_REMINDER_SCHEDULE).toEqual({
      pattern: '0 5 * * *',
      tz: 'Asia/Kolkata',
    });
  });
});

describe('WeatherReminderProcessor', () => {
  const logger = () => ({ warn: jest.fn(), error: jest.fn() });

  it('runs the daily weather reminders', async () => {
    const summary = {
      users: 1,
      noPlace: 0,
      noWeather: 0,
      created: 2,
      expired: 0,
    };
    const service = { run: jest.fn(() => Promise.resolve(summary)) };
    const processor = new WeatherReminderProcessor(
      service as unknown as WeatherReminderService,
      logger() as unknown as PinoLogger,
    );
    await expect(processor.process()).resolves.toEqual(summary);
  });

  it('logs a failed run as an error after its last attempt', () => {
    const log = logger();
    const processor = new WeatherReminderProcessor(
      { run: jest.fn() } as unknown as WeatherReminderService,
      log as unknown as PinoLogger,
    );
    processor.onFailed(
      {
        id: 'x',
        queueName: 'weather-reminders',
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job,
      new Error('db down'),
    );
    expect(log.error).toHaveBeenCalled();
  });
});
