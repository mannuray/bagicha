import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import type { ApiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';

export const guideSchema = z.object({
  season: z.string(),
  crops: z.array(z.string()),
  advice: z.string(),
  /** This month's few practical points for the user's region. */
  points: z.array(z.string()).optional().transform((v) => v ?? []),
});
export type SeasonalGuide = z.infer<typeof guideSchema>;

const stringList = z.array(z.string());

export const intelligenceSchema = z.object({
  seasonal_pack: z.object({
    id: z.string(),
    current_phase: z.string(),
    upcoming_phase: z.string(),
    confidence: z.string(),
    do_now: stringList,
    avoid_now: stringList,
    watch_for: stringList,
  }),
  personalized_overlay: z
    .object({
      adjusted_phase: z.string().nullable(),
      priority_actions: stringList.nullable(),
      reasoning_summary: z.string().nullable(),
    })
    .nullable(),
  /** This month's care for a tree with reviewed care (empty otherwise or from older servers). */
  care_this_month: z
    .array(
      z.object({
        title: z.string(),
        organic: z.string(),
        chemical: z.string().nullable(),
        why: z.string(),
        amount: z.string().nullable(),
        if_you_see: z.string().nullable(),
      }),
    )
    .nullish()
    .transform((v) => v ?? []),
  /** Set when the tree isn't usually grown in the gardener's region. */
  care_note: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  is_paid_user: z.boolean(),
});
export type PlantIntelligence = z.infer<typeof intelligenceSchema>;

export function useSeasonalGuide() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.guide,
    queryFn: () => api.get('/seasonal/guide', guideSchema),
    staleTime: 60 * 60_000,
  });
}

export function usePlantIntelligence(plantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.intelligence(plantId),
    queryFn: () => api.get(`/seasonal/plant/${plantId}/intelligence`, intelligenceSchema),
    enabled: Boolean(plantId),
  });
}

export const materializeSchema = z.object({
  results: z.array(z.object({ sourceKey: z.string(), status: z.string(), taskId: z.string().optional() })),
  created_count: z.number(),
});

/**
 * The one call that asks the backend for a plant's tasks this season. Idempotent:
 * existing ones come back skipped. Used by tasks (useMaterializeTasks), plant
 * creation and the dashboard's once-per-session check.
 */
export function materializeTasks(api: ApiClient, plantId: string) {
  return api.send('POST', `/seasonal/plant/${plantId}/materialize-tasks`, {}, materializeSchema);
}
