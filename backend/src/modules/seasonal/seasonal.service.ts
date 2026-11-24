import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '@prisma/client';
import { Queue } from 'bullmq';
import { Metrics } from '../../common/observability';
import { RedisService } from '../../common/redis/redis.service';
import { Clock } from '../../common/time';
import { climateGroupFor, windowStatus } from '../plant-ledger';
import { CatalogueStore, CatalogueUnavailableError } from '../catalogue';
import { regionFor } from '../regions';
import type { Lang } from '../../common/http/lang';
import { monthOf } from './domain/season-guide';
import { WeatherService } from './services/weather.service';

export const WEATHER_QUEUE = 'weather-checks';

@Injectable()
export class SeasonalService implements OnModuleInit {
  constructor(
    @InjectQueue(WEATHER_QUEUE) private readonly weatherQueue: Queue,
    private readonly weatherService: WeatherService,
    private readonly redis: RedisService,
    private readonly clock: Clock,
    private readonly metrics: Metrics,
    @InjectPinoLogger(SeasonalService.name)
    private readonly logger: PinoLogger,
    private readonly catalogue: CatalogueStore,
  ) {}

  onModuleInit(): void {
    this.metrics.registerQueueDepth(WEATHER_QUEUE, async () => {
      const counts = await this.weatherQueue.getJobCounts(
        'waiting',
        'active',
        'delayed',
      );
      return (
        (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0)
      );
    });
  }

  async getLocalizedWeather(pincode: string) {
    const cached = await this.redis.get(`weather:${pincode}`);
    if (cached) return JSON.parse(cached) as unknown;
    // One pending check per pincode; a queue hiccup still shows the weather.
    void this.weatherQueue
      .add('check', { pincode }, { jobId: `weather-${pincode}` })
      .catch((err: unknown) =>
        this.logger.warn({ err }, 'Weather check not queued'),
      );
    return this.weatherService.getWeather(pincode);
  }

  /** Season advice, with "good to sow now" from the crop calendar for the user's region. */
  async getSeasonalGuide(
    user: Pick<User, 'district' | 'region_cluster'>,
    lang: Lang = 'en',
  ) {
    const region = regionFor(user);
    const group = climateGroupFor(region);
    const now = this.clock.now();
    const catalogue = await this.catalogue.snapshot();
    // The store refuses a catalogue without every region's guide.
    const months = catalogue.seasonGuide(region);
    if (!months)
      throw new CatalogueUnavailableError(
        'CATALOGUE_REGION_MISSING',
        `No season guide for ${region}`,
      );
    const { season, headline, points } = monthOf(months, now, lang);
    const listed = catalogue.listedCrops();
    const crops = listed
      .filter(
        (c) =>
          c.kind === 'CROP' && windowStatus(c, group, now).status === 'open',
      )
      .map((c) => c.name);
    return { season, advice: headline, points, crops };
  }
}
