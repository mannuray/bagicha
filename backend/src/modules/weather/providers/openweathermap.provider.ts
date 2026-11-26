import { z } from 'zod';
import { UpstreamError } from '../../../common/errors';
import type {
  Forecast,
  ForecastDay,
  WeatherCondition,
} from '../domain/forecast';
import type { GridCell } from '../domain/grid-cell';
import { istDate } from '../domain/weather-events';
import type { Fetch, WeatherProvider } from './weather-provider';

const HOST = 'https://api.openweathermap.org/data/2.5';
/** Today and the next two days, like every provider. */
const DAYS = 3;

const num = z.number().finite();
const condition = z.array(z.object({ id: num })).min(1);
const currentSchema = z.object({
  dt: num,
  main: z.object({ temp: num }),
  weather: condition,
});
const forecastSchema = z.object({
  list: z.array(
    z.object({
      dt: num,
      main: z.object({ temp_min: num, temp_max: num }),
      weather: condition,
      pop: num.min(0).max(1),
      rain: z
        .object({ '3h': num.min(0) })
        .partial()
        .optional(),
    }),
  ),
});

/** Worst first: a day takes the most severe condition of its 3-hour slots, as Open-Meteo's daily code does. */
const SEVERITY: WeatherCondition[] = [
  'THUNDERSTORM',
  'HEAVY_RAIN',
  'RAIN',
  'DRIZZLE',
  'SNOW',
  'FOG',
  'CLOUDY',
  'PARTLY_CLOUDY',
  'CLEAR',
];

/** OpenWeatherMap condition codes (openweathermap.org/weather-conditions) to ours. */
export function conditionFromOwm(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'THUNDERSTORM';
  if (id >= 300 && id < 400) return 'DRIZZLE';
  if ([502, 503, 504, 522].includes(id)) return 'HEAVY_RAIN';
  if (id >= 500 && id < 600) return 'RAIN';
  if (id >= 600 && id < 700) return 'SNOW';
  // Mist and fog; haze, smoke and dust read as an overcast sky.
  if (id === 701 || id === 741) return 'FOG';
  if (id === 800) return 'CLEAR';
  if (id === 801 || id === 802) return 'PARTLY_CLOUDY';
  return 'CLOUDY';
}

const worst = (conditions: WeatherCondition[]): WeatherCondition =>
  SEVERITY.find((c) => conditions.includes(c)) ?? 'CLEAR';

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * OpenWeatherMap's free API (openweathermap.org, CC BY-SA 4.0): current weather
 * plus the 5-day / 3-hour forecast, folded into IST days.
 */
export class OpenWeatherMapProvider implements WeatherProvider {
  readonly name = 'OpenWeather';

  constructor(
    private readonly fetch: Fetch,
    private readonly apiKey: string,
  ) {}

  async forecast(cell: GridCell, signal: AbortSignal): Promise<Forecast> {
    const [currentRaw, forecastRaw] = await Promise.all([
      this.get('weather', cell, signal),
      this.get('forecast', cell, signal),
    ]);
    const current = currentSchema.safeParse(currentRaw);
    const slots = forecastSchema.safeParse(forecastRaw);
    if (!current.success || !slots.success) throw this.malformed();

    const now = {
      tempC: current.data.main.temp,
      condition: conditionFromOwm(current.data.weather[0].id),
    };
    const today = istDate(new Date(current.data.dt * 1000));
    const byDate = new Map<string, ForecastDay>();
    // Today's reading counts towards today, so a late-evening call still has a today.
    byDate.set(today, {
      date: today,
      condition: now.condition,
      maxC: now.tempC,
      minC: now.tempC,
      rainMm: 0,
      rainChance: 0,
    });

    for (const s of slots.data.list) {
      const date = istDate(new Date(s.dt * 1000));
      if (date < today) continue;
      const day = byDate.get(date);
      const slotCondition = conditionFromOwm(s.weather[0].id);
      const rainMm = s.rain?.['3h'] ?? 0;
      const rainChance = Math.round(s.pop * 100);
      if (!day) {
        byDate.set(date, {
          date,
          condition: slotCondition,
          maxC: s.main.temp_max,
          minC: s.main.temp_min,
          rainMm,
          rainChance,
        });
        continue;
      }
      day.condition = worst([day.condition, slotCondition]);
      day.maxC = Math.max(day.maxC, s.main.temp_max);
      day.minC = Math.min(day.minC, s.main.temp_min);
      day.rainMm = round1(day.rainMm + rainMm);
      day.rainChance = Math.max(day.rainChance, rainChance);
    }

    const days = [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, DAYS);
    // The last day must come from slots, not just today's reading.
    if (days.length < DAYS) throw this.malformed();
    return { now, days };
  }

  private async get(
    path: 'weather' | 'forecast',
    cell: GridCell,
    signal: AbortSignal,
  ): Promise<unknown> {
    const url = new URL(`${HOST}/${path}`);
    url.searchParams.set('lat', String(cell.lat));
    url.searchParams.set('lon', String(cell.lng));
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', this.apiKey);
    const res = await this.fetch(url.toString(), { signal });
    if (!res.ok) {
      throw new UpstreamError('WEATHER_UPSTREAM', 'Weather provider failed', {
        provider: this.name,
        status: res.status,
      });
    }
    return res.json();
  }

  private malformed(): UpstreamError {
    return new UpstreamError(
      'WEATHER_MALFORMED',
      'Weather provider sent an unexpected response',
      { provider: this.name },
    );
  }
}
