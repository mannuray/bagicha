import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';
import {
  catalogueItemSchema,
  cycleSchema,
  mitigationSchema,
  seasonalStateSchema,
  plantDetailSchema,
  plantSchema,
  resolveSchema,
  type PlantInput,
} from './schemas';

const PAGE_SIZE = 20;

export function usePlants(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.list(page),
    queryFn: () => api.getPage('/ledger/plants', plantSchema, { page, page_size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export function usePlant(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.detail(id ?? ''),
    queryFn: () => api.get(`/ledger/plants/${id}`, plantDetailSchema),
    enabled: Boolean(id),
  });
}

/** Creates the plant, then asks for this season's tasks so "this week" isn't empty. */
export function useCreatePlant() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlantInput) => {
      const plant = await api.send('POST', '/ledger/plants', input, plantSchema);
      // Best effort: a failure here must not lose the new plant; the dashboard retries.
      await api
        .send('POST', `/seasonal/plant/${plant.id}/materialize-tasks`, {}, z.unknown())
        .catch(() => undefined);
      return plant;
    },
    onSuccess: (plant) => {
      void client.invalidateQueries({ queryKey: queryKeys.plants.all });
      void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
      void client.invalidateQueries({ queryKey: queryKeys.plants.tasks(plant.id) });
    },
  });
}

export function useUpdatePlant(id: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (changes: Partial<PlantInput>) => api.send('PUT', `/ledger/plants/${id}`, changes, plantSchema),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.plants.all }),
  });
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function useCatalogueSearch(query: string) {
  const api = useApi();
  const q = useDebounced(query.trim(), 250);
  return useQuery({
    queryKey: queryKeys.catalogue.search(q),
    queryFn: () => api.getPage('/plants/search', catalogueItemSchema, { q, page_size: 8 }),
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
  });
}

export function useResolvePlant(query: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ['catalogue', 'resolve', query],
    queryFn: () => api.send('POST', '/plants/resolve', { query }, resolveSchema),
    enabled: Boolean(query && query.trim()),
    staleTime: Infinity,
  });
}

export function useSeasonalState(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.seasonalState(id),
    queryFn: () => api.get(`/ledger/plants/${id}/seasonal-state`, seasonalStateSchema),
    enabled: Boolean(id),
  });
}

export function useCycles(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.cycles(id),
    queryFn: () => api.getPage(`/ledger/plants/${id}/cycles`, cycleSchema, { page: 1, page_size: 2 }),
    enabled: Boolean(id),
  });
}

export function useMitigationPlan(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.mitigation(id),
    queryFn: () => api.get(`/ledger/plants/${id}/mitigation-plan`, mitigationSchema),
    enabled: Boolean(id),
  });
}
