import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';

export const journalEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  timestamp: z.string(),
  recorded_at: z.string(),
  plant_cycle_id: z.string().nullable(),
  diagnosis_outcome_id: z.string().nullable(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export interface NewMoment {
  type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  event_at?: string;
}

/** The plant's moments, newest first, one page at a time ("Show earlier moments"). */
export function useTimeline(plantId: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: queryKeys.plants.timelineAll(plantId),
    queryFn: ({ pageParam }) =>
      api.getPage(`/ledger/plants/${plantId}/timeline`, journalEntrySchema, { page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.page + 1 : undefined),
    select: (data) => ({ items: data.pages.flatMap((p) => p.items) }),
    enabled: Boolean(plantId),
  });
}

export function useAddJournalEntry(plantId: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (moment: NewMoment) => api.send('POST', `/ledger/plants/${plantId}/journal`, moment, journalEntrySchema),
    onSuccess: () => {
      for (const key of [
        queryKeys.plants.timelineAll(plantId),
        queryKeys.plants.cycles(plantId),
        queryKeys.plants.tasks(plantId),
        queryKeys.plants.detail(plantId),
        queryKeys.plants.mitigation(plantId),
        queryKeys.tasks.mineAll,
      ]) {
        void client.invalidateQueries({ queryKey: key });
      }
    },
  });
}
