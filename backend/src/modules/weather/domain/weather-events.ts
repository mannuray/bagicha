import type { Forecast } from './forecast';

export type WeatherEventKind = 'HEAVY_RAIN' | 'HEAT' | 'COLD_NIGHT';

/** A weather event worth a tip or a reminder, on one IST date. */
export interface WeatherEvent {
  kind: WeatherEventKind;
  /** YYYY-MM-DD (IST) of the weather itself (for a cold night, the evening it starts), not of the run that saw it. */
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

const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD of `now` in India. */
export const istDate = (now: Date): string => IST_DATE.format(now);

/** Today and tomorrow only: far enough ahead to act, near enough to trust. */
const DAYS_AHEAD = 2;

const ORDER: Record<WeatherEventKind, number> = {
  HEAVY_RAIN: 0,
  HEAT: 1,
  COLD_NIGHT: 2,
};

/**
 * The events in today's and tomorrow's forecast, by date (heavy rain, then
 * heat, then cold on one date). A day's low comes around dawn, so a cold low
 * on day D is the night before D: the event is dated D-1, the evening to act.
 * Today's own low has already passed and is ignored. Events dated before
 * `from` (IST today) are dropped: a cached forecast can start a day early.
 */
export function weatherEvents(
  forecast: Forecast,
  place: { hills: boolean },
  from?: string,
): WeatherEvent[] {
  const zone = place.hills ? 'hills' : 'plains';
  const days = forecast.days.slice(0, DAYS_AHEAD);
  const events = days.flatMap((d, i) => {
    const found: WeatherEvent[] = [];
    if (
      d.rainMm >= WEATHER_LIMITS.heavyRainMm &&
      d.rainChance >= WEATHER_LIMITS.heavyRainChance
    )
      found.push({ kind: 'HEAVY_RAIN', date: d.date, value: d.rainMm });
    if (d.maxC >= WEATHER_LIMITS.heatMaxC[zone])
      found.push({ kind: 'HEAT', date: d.date, value: d.maxC });
    if (i > 0 && d.minC <= WEATHER_LIMITS.coldMinC[zone])
      found.push({ kind: 'COLD_NIGHT', date: days[i - 1].date, value: d.minC });
    return found;
  });
  return events
    .filter((e) => !from || e.date >= from)
    .sort(
      (a, b) => a.date.localeCompare(b.date) || ORDER[a.kind] - ORDER[b.kind],
    );
}
