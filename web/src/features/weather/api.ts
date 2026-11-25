import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';

export const CONDITIONS = [
  'CLEAR',
  'PARTLY_CLOUDY',
  'CLOUDY',
  'FOG',
  'DRIZZLE',
  'RAIN',
  'HEAVY_RAIN',
  'THUNDERSTORM',
  'SNOW',
] as const;

export const weatherSchema = z.object({
  /** Null when the server has no weather for this user (no place, or no provider answered): hide the card. */
  weather: z
    .object({
      now: z.object({ temp_c: z.number(), condition: z.enum(CONDITIONS).catch('CLOUDY') }),
      today: z.object({
        max_c: z.number(),
        min_c: z.number(),
        rain_chance: z.number(),
        rain_mm: z.number(),
      }),
    })
    .nullable(),
  /** One gardening line for heavy rain, a very hot day or a cold night (missing from older servers). */
  tip: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  /** The provider's name, shown as the credit its licence requires. */
  source: z.string().nullable(),
});
export type WeatherResponse = z.infer<typeof weatherSchema>;

export function useWeather() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.weather,
    queryFn: () => api.get('/weather', weatherSchema),
    // The server caches for an hour; a fresh look every half hour is plenty.
    staleTime: 30 * 60_000,
  });
}
