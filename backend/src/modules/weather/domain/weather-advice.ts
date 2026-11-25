import type { WeatherEventKind } from './weather-events';

const SLUG: Record<WeatherEventKind, string> = {
  HEAVY_RAIN: 'heavy_rain',
  HEAT: 'heat',
  COLD_NIGHT: 'cold_night',
};

/** The catalogue advice keys for an event's card tip and reminder. */
export const weatherAdviceKeys = (kind: WeatherEventKind) => ({
  tip: `weather.tip.${SLUG[kind]}`,
  title: `weather.task.${SLUG[kind]}.title`,
  reason: `weather.task.${SLUG[kind]}.reason`,
});
