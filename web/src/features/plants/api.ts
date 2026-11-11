import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { fetchAllPages } from '../../lib/paging';
import { queryKeys } from '../../lib/query-keys';
import {
  catalogueItemSchema,
  cycleSchema,
  mitigationSchema,
  plantDetailSchema,
  plantSchema,
  resolveSchema,
  type PlantInput,
  type PlantEndReason,
} from './schemas';

const PAGE_SIZE = 20;

/** Growing plants by default; `ended` lists past trees. */
/** One page of plants; `kind` narrows to trees or calendar crops. */
export function usePlants(page: number, status: 'active' | 'planned' | 'ended' = 'active', kind?: 'tree' | 'crop' | 'flower') {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.list(status, page, kind ?? 'all'),
    queryFn: () => api.getPage('/ledger/plants', plantSchema, { page, page_size: PAGE_SIZE, status, ...(kind ? { kind } : {}) }),
    placeholderData: keepPreviousData,
  });
}

/** Every plant the user owns, across all pages (pickers and per-plant work). */
export function useAllPlants() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.everything,
    queryFn: () => fetchAllPages(api, '/ledger/plants', plantSchema),
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

export interface EndPlantInput {
  reason: PlantEndReason;
  ended_at?: string;
  note?: string;
  entry_id?: string;
}

/** Records that a tree died or was removed; its pending tasks are cancelled. */
export function useEndPlant(id: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EndPlantInput) => api.send('POST', `/ledger/plants/${id}/end`, input, plantSchema),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.plants.all });
      void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
    },
  });
}

/** Brings an ended tree back to the garden. */
export function useRestorePlant(id: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.send('POST', `/ledger/plants/${id}/restore`, {}, plantSchema),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.plants.all });
      void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
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

export function useCycles(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.cycles(id),
    queryFn: () => api.getPage(`/ledger/plants/${id}/cycles`, cycleSchema, { page: 1, page_size: 2 }),
    enabled: Boolean(id),
  });
}

/** Every cycle of a plant (all pages), for year-on-year comparison. */
export function useAllCycles(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.cyclesAll(id),
    queryFn: () => fetchAllPages(api, `/ledger/plants/${id}/cycles`, cycleSchema),
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
