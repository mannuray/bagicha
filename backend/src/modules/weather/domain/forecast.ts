/** Our own weather conditions: nothing outside a provider adapter sees a provider's codes. */
export type WeatherCondition =
  | 'CLEAR'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'DRIZZLE'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'THUNDERSTORM'
  | 'SNOW';

/** One day of the forecast, in the gardener's local (IST) calendar. */
export interface ForecastDay {
  /** YYYY-MM-DD in IST. */
  date: string;
  condition: WeatherCondition;
  maxC: number;
  minC: number;
  rainMm: number;
  /** 0–100. */
  rainChance: number;
}

/** What every provider adapter returns: now, then today and the next two days. */
export interface Forecast {
  now: { tempC: number; condition: WeatherCondition };
  days: ForecastDay[];
}

/** WMO weather interpretation codes (used by Open-Meteo and others) to our conditions. */
export function conditionFromWmo(code: number): WeatherCondition {
  if (code === 0) return 'CLEAR';
  if (code === 1 || code === 2) return 'PARTLY_CLOUDY';
  if (code === 3) return 'CLOUDY';
  if (code === 45 || code === 48) return 'FOG';
  if (code >= 51 && code <= 57) return 'DRIZZLE';
  if ([65, 67, 82].includes(code)) return 'HEAVY_RAIN';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 81)) return 'RAIN';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'SNOW';
  if (code >= 95 && code <= 99) return 'THUNDERSTORM';
  return 'CLOUDY';
}
