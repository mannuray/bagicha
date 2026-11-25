import type { PinoLogger } from 'nestjs-pino';
import { FixedClock } from '../../common/time';
import { seededCatalogueStore } from '../catalogue/testing';
import type { TaskDraft, TaskService } from '../plant-ledger';
import { DistrictLocator } from '../regions';
import type { Forecast, ForecastDay } from './domain/forecast';
import type { GridCell } from './domain/grid-cell';
import type {
  AudienceUser,
  WeatherAudienceRepository,
} from './weather-audience.repository';
import type { WeatherForecasts } from './weather-forecasts';
import { WeatherReminderService } from './weather-reminder.service';

const day = (date: string, d: Partial<ForecastDay> = {}): ForecastDay => ({
  date,
  condition: 'CLEAR',
  maxC: 25,
  minC: 15,
  rainMm: 0,
  rainChance: 0,
  ...d,
});
const forecastOf = (...days: ForecastDay[]): Forecast => ({
  now: { tempC: 25, condition: 'CLEAR' },
  days,
});

const user = (id: string, d: Partial<AudienceUser> = {}): AudienceUser => ({
  id,
  latitude: null,
  longitude: null,
  district: 'Patna',
  region_cluster: null,
  plants: [
    {
      id: `${id}-tree`,
      record_kind: 'TREE',
      lifecycle_stage: 'MATURE_BEARING',
      crop_stage: null,
    },
  ],
  ...d,
});

// 06:00 IST on 10 May 2026.
const NOW = new Date('2026-05-10T00:30:00Z');

function build(users: AudienceUser[], forecast: Forecast | null) {
  const created: Array<{
    userId: string;
    plantId: string;
    drafts: TaskDraft[];
  }> = [];
  const tasks = {
    createTasks: jest.fn(
      (userId: string, plantId: string, drafts: TaskDraft[]) => {
        created.push({ userId, plantId, drafts });
        return Promise.resolve(
          drafts.map((d) => ({ sourceKey: d.sourceKey, status: 'created' })),
        );
      },
    ),
    expirePendingBefore: jest.fn(() => Promise.resolve(3)),
  };
  const cells: string[] = [];
  const forecasts = {
    forCell: jest.fn((cell: GridCell) => {
      cells.push(cell.key);
      return Promise.resolve(
        forecast ? { forecast, source: 'Open-Meteo' } : null,
      );
    }),
  };
  const audience = {
    batch: jest.fn((after: string | null, size: number) => {
      const start = after ? users.findIndex((u) => u.id === after) + 1 : 0;
      return Promise.resolve(users.slice(start, start + size));
    }),
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const service = new WeatherReminderService(
    audience as unknown as WeatherAudienceRepository,
    forecasts as unknown as WeatherForecasts,
    tasks as unknown as TaskService,
    seededCatalogueStore(),
    new DistrictLocator(),
    new FixedClock(NOW),
    logger as unknown as PinoLogger,
    2,
  );
  return { service, created, tasks, forecasts, cells, logger };
}

describe('WeatherReminderService', () => {
  it('first expires pending weather reminders from before today (IST)', async () => {
    const { service, tasks } = build([], null);
    await service.run();
    expect(tasks.expirePendingBefore).toHaveBeenCalledWith(
      'WEATHER',
      new Date('2026-05-10T00:00:00+05:30'),
    );
  });

  it("adds a reminder per growing plant for tomorrow's very hot day, with English text from the catalogue", async () => {
    const { service, created } = build(
      [user('u1')],
      forecastOf(day('2026-05-10'), day('2026-05-11', { maxC: 42 })),
    );
    const summary = await service.run();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ userId: 'u1', plantId: 'u1-tree' });
    expect(created[0].drafts[0]).toMatchObject({
      source: 'WEATHER',
      sourceKey: 'weather:HEAT:u1-tree:2026-05-11',
      title: 'Water the soil lightly in the early morning or evening',
      reason: 'Very hot day expected (42°C)',
    });
    expect(summary).toMatchObject({
      users: 1,
      created: 1,
      expired: 3,
      noWeather: 0,
    });
  });

  it('fetches each grid cell once per run, across batches', async () => {
    const users = [user('u1'), user('u2'), user('u3')];
    const { service, forecasts } = build(users, forecastOf(day('2026-05-10')));
    await service.run();
    expect(forecasts.forCell).toHaveBeenCalledTimes(1);
  });

  it('skips users whose weather is unavailable, and counts them', async () => {
    const { service, created } = build([user('u1')], null);
    expect(await service.run()).toMatchObject({ noWeather: 1, created: 0 });
    expect(created).toEqual([]);
  });

  it('skips users with no place without asking for weather', async () => {
    const { service, forecasts } = build(
      [user('u1', { district: null })],
      forecastOf(day('2026-05-10')),
    );
    expect(await service.run()).toMatchObject({ noPlace: 1 });
    expect(forecasts.forCell).not.toHaveBeenCalled();
  });

  it('logs a summary with counts only', async () => {
    const { service, logger } = build(
      [user('u1')],
      forecastOf(day('2026-05-10', { maxC: 41 })),
    );
    await service.run();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ users: 1, created: 1 }),
      'Weather reminders done',
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('Patna');
  });
});
