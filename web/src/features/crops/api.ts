import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';
import { reportError } from '../../lib/report-error';
import { useSessionStore } from '../auth';
import { cropItemSchema, placeSchema, rotationSchema } from './schemas';

/** Every calendar crop with its sowing status for the user's region. */
export function useCropCalendar() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.crops.calendar, queryFn: () => api.get('/crops/calendar', z.array(cropItemSchema)) });
}

function useInvalidateGarden() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: queryKeys.plants.all });
    void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
  };
}

/** Puts a crop on the Want to grow list (the server returns the existing record if it's already there). */
export function useAddToPlan() {
  const api = useApi();
  const invalidate = useInvalidateGarden();
  return useMutation({
    mutationFn: (cropId: string) => api.send('POST', '/crops/plan', { crop_id: cropId }, z.unknown()),
    onSuccess: invalidate,
  });
}

/** Removes a never-sown crop from Want to grow. */
export function useRemoveFromPlan() {
  const api = useApi();
  const invalidate = useInvalidateGarden();
  return useMutation({
    mutationFn: (plantId: string) => api.remove(`/crops/plan/${plantId}`),
    onSuccess: invalidate,
  });
}

const SYNC_KEY = 'crop-plan-sync';

/** Seed and sow reminders, synced once per session (like the season check). */
export function useCropSyncOnce() {
  const api = useApi();
  const { materialized } = useSessionStore();
  const invalidate = useInvalidateGarden();
  useEffect(() => {
    if (materialized.has(SYNC_KEY)) return;
    materialized.add(SYNC_KEY);
    api
      .send('POST', '/crops/plan/sync', {}, z.object({ created_count: z.number() }))
      .then((res) => {
        if (res.created_count > 0) invalidate();
      })
      .catch((err: unknown) => {
        materialized.delete(SYNC_KEY);
        reportError(err, { step: 'crop-sync' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per session
  }, [api, materialized]);
}

export function usePlaces() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.crops.places, queryFn: () => api.get('/garden/places', z.array(placeSchema)) });
}

export function useCreatePlace() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; kind: string }) => api.send('POST', '/garden/places', input, placeSchema),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.crops.places }),
  });
}

/** Whether the same family grew in this place within the last year. */
export function useRotation(placeId: string | null, cropId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.crops.rotation(placeId ?? '', cropId ?? ''),
    queryFn: () => api.get(`/garden/places/${placeId}/rotation?crop_id=${encodeURIComponent(cropId ?? '')}`, rotationSchema),
    enabled: Boolean(placeId && cropId),
  });
}
