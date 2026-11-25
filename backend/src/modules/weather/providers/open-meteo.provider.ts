import { z } from 'zod';
import { UpstreamError } from '../../../common/errors';
import { conditionFromWmo, type Forecast } from '../domain/forecast';
import type { GridCell } from '../domain/grid-cell';
import type { Fetch, WeatherProvider } from './weather-provider';

const FREE_HOST = 'https://api.open-meteo.com/v1/forecast';
/** Paid plan: required for commercial use. */
const COMMERCIAL_HOST = 'https://customer-api.open-meteo.com/v1/forecast';

const num = z.number().finite();
const responseSchema = z.object({
  current: z.object({ temperature_2m: num, weather_code: num }),
  daily: z.object({
    time: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
    weather_code: z.array(num),
    temperature_2m_max: z.array(num),
    temperature_2m_min: z.array(num),
    precipitation_sum: z.array(num),
    precipitation_probability_max: z.array(num),
  }),
});

/** Open-Meteo (open-meteo.com, CC BY 4.0). The free API is non-commercial; a key switches to the paid one. */
export class OpenMeteoProvider implements WeatherProvider {
  readonly name = 'Open-Meteo';

  constructor(
    private readonly fetch: Fetch,
    private readonly apiKey: string | undefined,
  ) {}

  async forecast(cell: GridCell, signal: AbortSignal): Promise<Forecast> {
    const res = await this.fetch(this.url(cell), { signal });
    if (!res.ok) {
      throw new UpstreamError('WEATHER_UPSTREAM', 'Weather provider failed', {
        provider: this.name,
        status: res.status,
      });
    }
    const parsed = responseSchema.safeParse(await res.json());
    if (!parsed.success) throw this.malformed();
    const { current, daily } = parsed.data;
    const n = daily.time.length;
    const series = [
      daily.weather_code,
      daily.temperature_2m_max,
      daily.temperature_2m_min,
      daily.precipitation_sum,
      daily.precipitation_probability_max,
    ];
    if (series.some((s) => s.length !== n)) throw this.malformed();
    return {
      now: {
        tempC: current.temperature_2m,
        condition: conditionFromWmo(current.weather_code),
      },
      days: daily.time.map((date, i) => ({
        date,
        condition: conditionFromWmo(daily.weather_code[i]),
        maxC: daily.temperature_2m_max[i],
        minC: daily.temperature_2m_min[i],
        rainMm: daily.precipitation_sum[i],
        rainChance: daily.precipitation_probability_max[i],
      })),
    };
  }

  private url(cell: GridCell): string {
    const url = new URL(this.apiKey ? COMMERCIAL_HOST : FREE_HOST);
    const params = url.searchParams;
    params.set('latitude', String(cell.lat));
    params.set('longitude', String(cell.lng));
    params.set('current', 'temperature_2m,weather_code');
    params.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    );
    params.set('timezone', 'Asia/Kolkata');
    params.set('forecast_days', '3');
    if (this.apiKey) params.set('apikey', this.apiKey);
    return url.toString();
  }

  private malformed(): UpstreamError {
    return new UpstreamError(
      'WEATHER_MALFORMED',
      'Weather provider sent an unexpected response',
      {
        provider: this.name,
      },
    );
  }
}
