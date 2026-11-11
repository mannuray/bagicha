import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { REGION_CLUSTERS, useSession, userSchema, type RegionCluster } from '../auth';
import type { DistrictOption } from './regions';

export interface ProfileChanges {
  name?: string | null;
  district?: string | null;
  region_cluster?: RegionCluster | null;
  latitude?: number;
  longitude?: number;
  garden_types?: string[];
  language_pref?: string;
}

/** Saves profile fields and refreshes the signed-in user from the response. */
export function useUpdateProfile() {
  const api = useApi();
  const { updateUser } = useSession();
  return useMutation({
    mutationFn: (changes: ProfileChanges) =>
      api.send('PUT', '/user/profile/update', changes, userSchema),
    onSuccess: (user) => updateUser(user),
  });
}

const districtSchema = z.object({
  name: z.string(),
  state: z.string(),
  region: z.enum(REGION_CLUSTERS),
  label: z.string(),
  aliases: z.array(z.string()),
});
const located = z.object({ district: z.string(), state: z.string(), region: z.enum(REGION_CLUSTERS), label: z.string() }).nullable();

/** Every district with its region: fixed reference data, fetched once a session. */
export function useDistricts() {
  const api = useApi();
  return useQuery({
    queryKey: ['regions', 'districts'],
    queryFn: () => api.get('/regions/districts', z.array(districtSchema)) as Promise<DistrictOption[]>,
    staleTime: Infinity,
  });
}

/** The district at a point (looked up on our server only), or null. */
export function useLocateDistrict() {
  const api = useApi();
  return (latitude: number, longitude: number) =>
    api.get(`/regions/locate?lat=${latitude}&lng=${longitude}`, located);
}
