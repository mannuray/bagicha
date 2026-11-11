import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon } from '../../ui';
import { DistrictField } from './DistrictField';
import { OnboardingLayout } from './OnboardingLayout';
import { RegionChooser } from './RegionChooser';
import { regionById } from './regions';
import { useRegionForm } from './useRegionForm';

/**
 * Stitch "Locate Your Sanctuary", adapted: type the district (with suggestions from the full
 * list) or detect it from the location; a known one sets the region, otherwise pick the closest.
 */
export function RegionScreen({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation();
  const f = useRegionForm(onDone);

  return (
    <OnboardingLayout step={2} icon="location_on" title={t('onboarding.region.title')} subtitle={t('onboarding.region.subtitle')}>
      <DistrictField
        label={t('onboarding.region.district')}
        value={f.district}
        list={f.districts.data ?? []}
        onChange={f.typeDistrict}
        className="mb-3"
      />
      {f.districts.isError && (
        <p className="mb-3 flex items-center justify-between gap-2 font-body text-sm text-on-surface-variant">
          {t('onboarding.region.listFailed')}
          <Button variant="tertiary" onClick={() => void f.districts.refetch()}>
            {t('common.retry')}
          </Button>
        </p>
      )}
      <RegionChooser district={f.district} knownLabel={f.knownLabel} picked={f.picked} onPick={f.setPicked} variant="cards" />
      <div className="mb-4 flex flex-col items-center gap-2">
        <Button variant="tertiary" busy={f.geo === 'locating'} onClick={() => void f.locate()}>
          <Icon name="my_location" />
          {t('onboarding.region.useLocation')}
        </Button>
        {f.geo === 'detected' && f.detected && (
          <p className="text-center font-body text-sm text-primary">
            {t('onboarding.region.detected', {
              district: f.detected.district,
              state: f.detected.state,
              region: t(regionById(f.detected.region)?.labelKey ?? ''),
            })}
          </p>
        )}
        {f.geo === 'noDistrict' && (
          <p className="text-center font-body text-sm text-on-surface-variant">{t('onboarding.region.noDistrict')}</p>
        )}
        {f.geo === 'unavailable' && (
          <p className="font-body text-sm text-on-surface-variant">{t('onboarding.region.locationUnavailable')}</p>
        )}
      </div>
      {f.error && (
        <p role="alert" className="mb-4 text-center font-body text-sm text-error">
          {messageFor(f.error)}
        </p>
      )}
      <Button block busy={f.busy} disabled={!f.canSave} onClick={f.save}>
        {t('common.continue')}
      </Button>
    </OnboardingLayout>
  );
}
