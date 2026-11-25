import type { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import type { RedisService } from '../../common/redis/redis.service';
import type { Forecast } from './domain/forecast';
import type { GridCell } from './domain/grid-cell';
import type { WeatherProvider } from './providers/weather-provider';

export interface SourcedForecast {
  forecast: Forecast;
  /** The provider's name, shown as the credit on the card. */
  source: string;
}

const CACHE_TTL_SECONDS = 3600;
/** Redis queues commands while unreachable and never settles them: give up on the cache after this. */
const DEFAULT_CACHE_TIMEOUT_MS = 300;

const conditionSchema = z.enum([
  'CLEAR',
  'PARTLY_CLOUDY',
  'CLOUDY',
  'FOG',
  'DRIZZLE',
  'RAIN',
  'HEAVY_RAIN',
  'THUNDERSTORM',
  'SNOW',
]);
const num = z.number().finite();
/** A cache entry is checked like a provider answer: a bad one is ignored, never served. */
const cachedSchema = z.object({
  source: z.string(),
  forecast: z.object({
    now: z.object({ tempC: num, condition: conditionSchema }),
    days: z
      .array(
        z.object({
          date: z.string(),
          condition: conditionSchema,
          maxC: num,
          minC: num,
          rainMm: num,
          rainChance: num,
        }),
      )
      .min(1),
  }),
});
const cacheKey = (cell: GridCell) => `weather:v1:${cell.key}`;

/**
 * Forecasts per grid cell: the configured providers in order (each with a
 * timeout), cached in Redis for an hour. Null when no provider answers; a
 * made-up or stale forecast is never returned. Logs carry only the cell key.
 */
export class WeatherForecasts {
  constructor(
    private readonly providers: readonly WeatherProvider[],
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
    private readonly timeoutMs: number,
    private readonly cacheTimeoutMs = DEFAULT_CACHE_TIMEOUT_MS,
  ) {}

  async forCell(cell: GridCell): Promise<SourcedForecast | null> {
    if (this.providers.length === 0) return null;
    const cached = await this.readCache(cell);
    if (cached) return cached;
    for (const provider of this.providers) {
      const forecast = await this.tryProvider(provider, cell);
      if (forecast) {
        const result = { forecast, source: provider.name };
        await this.writeCache(cell, result);
        return result;
      }
    }
    return null;
  }

  private async tryProvider(
    provider: WeatherProvider,
    cell: GridCell,
  ): Promise<Forecast | null> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error(`timed out after ${this.timeoutMs} ms`));
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([
        provider.forecast(cell, controller.signal),
        timeout,
      ]);
    } catch (err: unknown) {
      this.logger.warn(
        { err, provider: provider.name, cell: cell.key },
        'Weather provider failed',
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async readCache(cell: GridCell): Promise<SourcedForecast | null> {
    try {
      const raw = await this.withinCacheTime(this.redis.get(cacheKey(cell)));
      if (!raw) return null;
      const parsed = cachedSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch (err: unknown) {
      this.logger.warn({ err, cell: cell.key }, 'Weather cache unreadable');
      return null;
    }
  }

  private async writeCache(cell: GridCell, value: SourcedForecast) {
    try {
      await this.withinCacheTime(
        this.redis.set(
          cacheKey(cell),
          JSON.stringify(value),
          CACHE_TTL_SECONDS,
        ),
      );
    } catch (err: unknown) {
      this.logger.warn({ err, cell: cell.key }, 'Weather not cached');
    }
  }

  private async withinCacheTime<T>(op: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(new Error(`cache timed out after ${this.cacheTimeoutMs} ms`)),
        this.cacheTimeoutMs,
      );
    });
    try {
      return await Promise.race([op, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
