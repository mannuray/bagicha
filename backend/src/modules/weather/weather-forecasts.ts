import type { PinoLogger } from 'nestjs-pino';
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
      const raw = await this.redis.get(cacheKey(cell));
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<SourcedForecast>;
      return value.forecast && typeof value.source === 'string'
        ? (value as SourcedForecast)
        : null;
    } catch (err: unknown) {
      this.logger.warn({ err, cell: cell.key }, 'Weather cache unreadable');
      return null;
    }
  }

  private async writeCache(cell: GridCell, value: SourcedForecast) {
    try {
      await this.redis.set(
        cacheKey(cell),
        JSON.stringify(value),
        CACHE_TTL_SECONDS,
      );
    } catch (err: unknown) {
      this.logger.warn({ err, cell: cell.key }, 'Weather not cached');
    }
  }
}
