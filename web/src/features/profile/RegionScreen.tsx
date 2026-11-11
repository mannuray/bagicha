import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, cx } from '../../ui';
import { isProfileComplete, useSession, type RegionCluster } from '../auth';
import { roundCoordinate, useDistricts, useLocateDistrict, useUpdateProfile, type ProfileChanges } from './api';
import { DistrictField } from './DistrictField';
import { useGeolocator, type Coordinates } from './geolocation';
import { OnboardingLayout } from './OnboardingLayout';
import { knownRegion, regionById, REGIONS } from './regions';

type GeoState = 'idle' | 'locating' | 'detected' | 'noDistrict' | 'unavailable';

/**
 * Stitch "Locate Your Sanctuary", adapted: type the district (with suggestions from the full
 * list) or detect it from the location; a known one sets the region, otherwise pick the closest.
 */
export function RegionScreen({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const geolocator = useGeolocator();
  const { user } = useSession();
  const update = useUpdateProfile();
  const [picked, setPicked] = useState<RegionCluster | null>(user?.region_cluster ?? null);
  const [district, setDistrict] = useState(user?.district ?? '');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geo, setGeo] = useState<GeoState>('idle');
  const [detected, setDetected] = useState<{ district: string; state: string; region: RegionCluster } | null>(null);
  const districts = useDistricts();
  const locateDistrict = useLocateDistrict();
  const list = districts.data ?? [];
  const known = knownRegion(district, list);
  const region = known ?? picked;
  const autoRegion = regionById(known);

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

  const save = () => {
    if (!region || !district.trim()) return;
    const changes: ProfileChanges = { region_cluster: region, district: district.trim() };
    if (coords) Object.assign(changes, coords);
    update.mutate(changes, {
      // A returning user only needed a region; their garden types are already set.
      onSuccess: onDone ?? ((saved) => navigate(isProfileComplete(saved) ? '/' : '/onboarding/garden')),
    });
  };

  return (
    <OnboardingLayout step={2} icon="location_on" title={t('onboarding.region.title')} subtitle={t('onboarding.region.subtitle')}>
      <DistrictField
        label={t('onboarding.region.district')}
        value={district}
        list={districts.data ?? []}
        onChange={(text) => {
          setDistrict(text);
          setGeo((g) => (g === 'detected' ? 'idle' : g));
        }}
        className="mb-3"
      />
      {districts.isError && (
        <p className="mb-3 flex items-center justify-between gap-2 font-body text-sm text-on-surface-variant">
          {t('onboarding.region.listFailed')}
          <Button variant="tertiary" onClick={() => void districts.refetch()}>
            {t('common.retry')}
          </Button>
        </p>
      )}
      {autoRegion ? (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-body text-sm text-on-primary">
          <Icon name="check_circle" filled />
          {t('onboarding.region.known', { district: district.trim(), region: t(autoRegion.labelKey) })}
        </p>
      ) : (
        district.trim() && (
          <fieldset className="mb-4 space-y-2">
            <legend className="mb-2 font-body text-sm text-on-surface-variant">
              {t('onboarding.region.unknown', { district: district.trim() })}
            </legend>
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={picked === r.id}
                onClick={() => setPicked(r.id)}
                className={cx(
                  'flex min-h-12 w-full flex-col items-start rounded-xl px-4 py-2.5 text-left transition-colors',
                  picked === r.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface',
                )}
              >
                <span className="font-headline text-base">{t(r.labelKey)}</span>
                <span className="font-body text-xs opacity-80">{t(r.examplesKey)}</span>
              </button>
            ))}
          </fieldset>
        )
      )}
      <div className="mb-4 flex flex-col items-center gap-2">
        <Button variant="tertiary" busy={geo === 'locating'} onClick={() => void locate()}>
          <Icon name="my_location" />
          {t('onboarding.region.useLocation')}
        </Button>
        {geo === 'detected' && detected && (
          <p className="text-center font-body text-sm text-primary">
            {t('onboarding.region.detected', {
              district: detected.district,
              state: detected.state,
              region: t(regionById(detected.region)?.labelKey ?? ''),
            })}
          </p>
        )}
        {geo === 'noDistrict' && (
          <p className="text-center font-body text-sm text-on-surface-variant">{t('onboarding.region.noDistrict')}</p>
        )}
        {geo === 'unavailable' && (
          <p className="font-body text-sm text-on-surface-variant">{t('onboarding.region.locationUnavailable')}</p>
        )}
      </div>
      {update.isError && (
        <p role="alert" className="mb-4 text-center font-body text-sm text-error">
          {messageFor(update.error)}
        </p>
      )}
      <Button block busy={update.isPending} disabled={!region || !district.trim()} onClick={save}>
        {t('common.continue')}
      </Button>
    </OnboardingLayout>
  );
}
