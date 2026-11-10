import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, TextField, cx } from '../../ui';
import { isProfileComplete, useSession, type RegionCluster } from '../auth';
import { useUpdateProfile, type ProfileChanges } from './api';
import { useGeolocator, type Coordinates } from './geolocation';
import { OnboardingLayout } from './OnboardingLayout';
import { knownRegion, regionById, REGIONS } from './regions';

type GeoState = 'idle' | 'locating' | 'added' | 'unavailable';

/** Stitch "Locate Your Sanctuary", adapted: type the district; a known one sets the region, otherwise pick the closest. GPS optional. */
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
  const known = knownRegion(district);
  const region = known ?? picked;
  const autoRegion = regionById(known);

  const locate = async () => {
    setGeo('locating');
    const found = await geolocator.current();
    setCoords(found);
    setGeo(found ? 'added' : 'unavailable');
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
      <TextField
        label={t('onboarding.region.district')}
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        autoComplete="address-level2"
        className="mb-3"
      />
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
        {geo === 'added' && <p className="font-body text-sm text-primary">{t('onboarding.region.locationAdded')}</p>}
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
