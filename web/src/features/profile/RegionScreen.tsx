import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, TextField, cx } from '../../ui';
import { isProfileComplete, useSession, type RegionCluster } from '../auth';
import { useDistricts, useLocateDistrict, useUpdateProfile, type ProfileChanges } from './api';
import { useGeolocator, type Coordinates } from './geolocation';
import { OnboardingLayout } from './OnboardingLayout';
import { knownRegion, regionById, REGIONS, suggestDistricts, type DistrictOption } from './regions';

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
  const [detected, setDetected] = useState<{ label: string; state: string } | null>(null);
  const [typing, setTyping] = useState(false);
  const districts = useDistricts();
  const locateDistrict = useLocateDistrict();
  const list = districts.data ?? [];
  const known = knownRegion(district, list);
  const region = known ?? picked;
  const autoRegion = regionById(known);
  // Nothing to suggest once the text is exactly a district on the list.
  const exact = list.some((d) => d.label.toLowerCase() === district.trim().toLowerCase());
  const suggestions = typing && !exact ? suggestDistricts(district, list) : [];

  const choose = (d: DistrictOption) => {
    setDistrict(d.label);
    setTyping(false);
  };

  const locate = async () => {
    setGeo('locating');
    const found = await geolocator.current();
    setCoords(found);
    if (!found) return setGeo('unavailable');
    const hit = await locateDistrict(found.latitude, found.longitude).catch(() => null);
    if (!hit) return setGeo('noDistrict');
    setDistrict(hit.label);
    setTyping(false);
    setDetected({ label: hit.district, state: hit.state });
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
      <TextField
        label={t('onboarding.region.district')}
        value={district}
        onChange={(e) => {
          setDistrict(e.target.value);
          setTyping(true);
          setGeo((g) => (g === 'detected' ? 'idle' : g));
        }}
        autoComplete="off"
        className="mb-3"
      />
      {suggestions.length > 0 && (
        <ul role="listbox" aria-label={t('onboarding.region.suggestions')} className="mb-3 overflow-hidden rounded-xl bg-surface-container-low">
          {suggestions.map((d) => (
            <li key={`${d.name}|${d.state}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => choose(d)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left font-body text-sm text-on-surface hover:bg-surface-container"
              >
                <span>
                  {d.name} · {d.state}
                </span>
                <span className="font-label text-[11px] text-on-surface-variant">{t(regionById(d.region)?.labelKey ?? '')}</span>
              </button>
            </li>
          ))}
        </ul>
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
        {geo === 'detected' && detected && autoRegion && (
          <p className="text-center font-body text-sm text-primary">
            {t('onboarding.region.detected', { district: detected.label, state: detected.state, region: t(autoRegion.labelKey) })}
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
