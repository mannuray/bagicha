import type { SourcedForecast } from './weather-forecasts';

export interface WeatherView {
  weather: {
    now: { temp_c: number; condition: string };
    today: {
      max_c: number;
      min_c: number;
      rain_chance: number;
      rain_mm: number;
    };
  } | null;
  /** Credit line for the card ("Open-Meteo"); required by the provider's licence. */
  source: string | null;
}

export const NO_WEATHER: WeatherView = { weather: null, source: null };

/** The home card's shape: now, plus today (the forecast's first IST day). */
export function toWeatherView(sourced: SourcedForecast | null): WeatherView {
  const today = sourced?.forecast.days[0];
  if (!sourced || !today) return NO_WEATHER;
  const { now } = sourced.forecast;
  return {
    weather: {
      now: { temp_c: now.tempC, condition: now.condition },
      today: {
        max_c: today.maxC,
        min_c: today.minC,
        rain_chance: today.rainChance,
        rain_mm: today.rainMm,
      },
    },
    source: sourced.source,
  };
}
