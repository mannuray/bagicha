import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../lib/api';
import { useSession, userSchema, type RegionCluster } from '../auth';

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
