import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Clock } from '../../common/time';
import { CatalogueStore } from '../catalogue';
import { TaskService } from '../plant-ledger';
import { DistrictLocator, regionFor } from '../regions';
import { istDate, weatherEvents } from './domain/weather-events';
import { weatherPlace } from './domain/weather-place';
import { istDayStart, reminderDrafts } from './domain/weather-reminders';
import {
  WeatherAudienceRepository,
  type AudienceUser,
} from './weather-audience.repository';
import { WeatherForecasts, type SourcedForecast } from './weather-forecasts';

export interface ReminderRunSummary {
  users: number;
  noPlace: number;
  noWeather: number;
  created: number;
  expired: number;
}

const BATCH_SIZE = 200;
/** Overrides the users-per-query batch size (tests). */
export const WEATHER_REMINDER_BATCH = Symbol('WEATHER_REMINDER_BATCH');

/**
 * The daily weather run: expire yesterday's unfinished weather reminders, then
 * add reminders for heavy rain, very hot days and cold nights today or
 * tomorrow, for every gardener with living plants. Each grid cell's forecast
 * is fetched once per run. Logs hold counts only.
 */
@Injectable()
export class WeatherReminderService {
  constructor(
    private readonly audience: WeatherAudienceRepository,
    private readonly forecasts: WeatherForecasts,
    private readonly tasks: TaskService,
    private readonly catalogue: CatalogueStore,
    private readonly locator: DistrictLocator,
    private readonly clock: Clock,
    @InjectPinoLogger(WeatherReminderService.name)
    private readonly logger: PinoLogger,
    @Optional()
    @Inject(WEATHER_REMINDER_BATCH)
    private readonly batchSize: number = BATCH_SIZE,
  ) {}

  async run(): Promise<ReminderRunSummary> {
    const today = istDate(this.clock.now());
    const summary: ReminderRunSummary = {
      users: 0,
      noPlace: 0,
      noWeather: 0,
      created: 0,
      expired: await this.tasks.expirePendingBefore(
        'WEATHER',
        istDayStart(today),
      ),
    };
    const catalogue = await this.catalogue.snapshot();
    const en = (ref: Parameters<typeof catalogue.advice>[0]) =>
      catalogue.advice(ref, 'en');
    const byCell = new Map<string, SourcedForecast | null>();

    let after: string | null = null;
    for (;;) {
      const users = await this.audience.batch(after, this.batchSize);
      if (users.length === 0) break;
      for (const user of users) {
        summary.users += 1;
        await this.remind(user, today, byCell, en, summary);
      }
      after = users[users.length - 1].id;
    }
    this.logger.info(
      { ...summary, cells: byCell.size },
      'Weather reminders done',
    );
    return summary;
  }

  private async remind(
    user: AudienceUser,
    today: string,
    byCell: Map<string, SourcedForecast | null>,
    en: Parameters<typeof reminderDrafts>[2],
    summary: ReminderRunSummary,
  ): Promise<void> {
    const cell = weatherPlace(user, this.locator);
    if (!cell) {
      summary.noPlace += 1;
      return;
    }
    if (!byCell.has(cell.key))
      byCell.set(cell.key, await this.forecasts.forCell(cell));
    const sourced = byCell.get(cell.key);
    if (!sourced) {
      summary.noWeather += 1;
      return;
    }
    const events = weatherEvents(
      sourced.forecast,
      { hills: regionFor(user) === 'HILLS_COOL' },
      today,
    );
    const drafts = reminderDrafts(events, user.plants, en);
    const byPlant = new Map<string, typeof drafts>();
    for (const d of drafts)
      byPlant.set(d.plantId, [...(byPlant.get(d.plantId) ?? []), d]);
    for (const [plantId, plantDrafts] of byPlant) {
      const results = await this.tasks.createTasks(
        user.id,
        plantId,
        plantDrafts.map((d) => d.draft),
      );
      summary.created += results.filter((r) => r.status === 'created').length;
    }
  }
}
