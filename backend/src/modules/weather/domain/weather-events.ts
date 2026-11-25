import type { Forecast } from './forecast';

export type WeatherEventKind = 'HEAVY_RAIN' | 'HEAT' | 'COLD_NIGHT';

/** A weather event worth a tip or a reminder, on one IST date. */
export interface WeatherEvent {
  kind: WeatherEventKind;
  /** YYYY-MM-DD (IST) of the weather itself, not of the run that saw it. */
  date: string;
  /** The forecast figure that triggered it: max °C, rain mm or min °C. */
  value: number;
}

/**
 * Owner approved 2026-11-25 (source check: IMD heatwave and cold-wave
 * definitions, IMD 24 h rainfall categories). A one-point forecast can't meet
 * IMD's two-station, two-day rule, so the app says "very hot day" and "cold
 * night", never "heatwave" or "cold wave". Coastal places use the plains values.
 */
export const WEATHER_LIMITS = {
  heatMaxC: { plains: 40, hills: 30 },
  heavyRainMm: 64.5,
  /** Not an IMD figure: the owner's choice. */
  heavyRainChance: 50,
  coldMinC: { plains: 4, hills: 0 },
} as const;

/** Today and tomorrow only: far enough ahead to act, near enough to trust. */
const DAYS_AHEAD = 2;

/** The events in today's and tomorrow's forecast, by date; heavy rain, then heat, then cold on one day. */
export function weatherEvents(
  forecast: Forecast,
  place: { hills: boolean },
): WeatherEvent[] {
  const zone = place.hills ? 'hills' : 'plains';
  return forecast.days.slice(0, DAYS_AHEAD).flatMap((d) => {
    const events: WeatherEvent[] = [];
    if (
      d.rainMm >= WEATHER_LIMITS.heavyRainMm &&
      d.rainChance >= WEATHER_LIMITS.heavyRainChance
    )
      events.push({ kind: 'HEAVY_RAIN', date: d.date, value: d.rainMm });
    if (d.maxC >= WEATHER_LIMITS.heatMaxC[zone])
      events.push({ kind: 'HEAT', date: d.date, value: d.maxC });
    if (d.minC <= WEATHER_LIMITS.coldMinC[zone])
      events.push({ kind: 'COLD_NIGHT', date: d.date, value: d.minC });
    return events;
  });
}
