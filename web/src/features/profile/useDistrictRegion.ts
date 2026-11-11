import { useState } from 'react';
import type { RegionCluster } from '../auth';
import { useDistricts } from './api';
import { knownRegion, regionById } from './regions';

/**
 * The district → region rule both Region onboarding and Profile use: a district we
 * know decides the region; for one we don't, the gardener picks.
 */
export function useDistrictRegion(initialDistrict: string, initialRegion: RegionCluster | null) {
  const districts = useDistricts();
  const [district, setDistrict] = useState(initialDistrict);
  const [picked, setPicked] = useState<RegionCluster | null>(initialRegion);
  const known = knownRegion(district, districts.data ?? []);
  return {
    districts,
    district,
    setDistrict,
    picked,
    setPicked,
    /** The region a known district decides, or null. */
    known,
    knownLabel: regionById(known),
    /** What will be saved: the known district's region, else the gardener's pick. */
    region: known ?? picked,
  };
}
