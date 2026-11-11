import { useState } from 'react';
import { useNavigate } from 'react-router';
import { nextOnboardingStep, useSession, type RegionCluster } from '../auth';
import { roundCoordinate, useLocateDistrict, useUpdateProfile, type ProfileChanges } from './api';
import { useGeolocator, type Coordinates } from './geolocation';
import { useDistrictRegion } from './useDistrictRegion';

export type GeoState = 'idle' | 'locating' | 'detected' | 'noDistrict' | 'unavailable';

/**
 * ViewModel for Region onboarding: the district and region, "Use my location"
 * (coordinates kept at ~100 m; the server's district decides), and save.
 */
export function useRegionForm(onDone?: () => void) {
  const navigate = useNavigate();
  const geolocator = useGeolocator();
  const { user } = useSession();
  const update = useUpdateProfile();
  const locateDistrict = useLocateDistrict();
  const choice = useDistrictRegion(user?.district ?? '', user?.region_cluster ?? null);
  const { district, setDistrict, setPicked, region } = choice;
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geo, setGeo] = useState<GeoState>('idle');
  const [detected, setDetected] = useState<{ district: string; state: string; region: RegionCluster } | null>(null);

  const locate = async () => {
    setGeo('locating');
    const found = await geolocator.current();
    if (!found) return setGeo('unavailable');
    // Stored and sent at about 100 m, never the exact spot.
    setCoords({ latitude: roundCoordinate(found.latitude), longitude: roundCoordinate(found.longitude) });
    const hit = await locateDistrict(found.latitude, found.longitude).catch(() => null);
    if (!hit) return setGeo('noDistrict');
    setDistrict(hit.label);
    // The server's region decides, even if the district list hasn't loaded.
    setPicked(hit.region);
    setDetected({ district: hit.district, state: hit.state, region: hit.region });
    setGeo('detected');
  };

  /** Typing a district drops the "detected" note. */
  const typeDistrict = (text: string) => {
    setDistrict(text);
    setGeo((g) => (g === 'detected' ? 'idle' : g));
  };

  const save = () => {
    if (!region || !district.trim()) return;
    const changes: ProfileChanges = { region_cluster: region, district: district.trim() };
    if (coords) Object.assign(changes, coords);
    update.mutate(changes, {
      // A returning user only needed a region; their garden types are already set.
      onSuccess: onDone ?? ((saved) => navigate(nextOnboardingStep(saved, 'region'))),
    });
  };

  return {
    ...choice,
    typeDistrict,
    geo,
    detected,
    locate,
    save,
    canSave: Boolean(region && district.trim()),
    busy: update.isPending,
    error: update.isError ? update.error : null,
  };
}
