import { useTranslation } from 'react-i18next';
import { Chip, cx, Icon } from '../../ui';
import type { RegionCluster } from '../auth';
import { REGIONS, type Region } from './regions';

/**
 * The region for a typed district: a known district shows its region; for one we
 * don't know, the gardener picks the closest. Onboarding shows big cards, Profile chips.
 */
export function RegionChooser({
  district,
  knownLabel,
  picked,
  onPick,
  variant,
}: {
  district: string;
  knownLabel: Region | null | undefined;
  picked: RegionCluster | null;
  onPick: (region: RegionCluster) => void;
  variant: 'cards' | 'chips';
}) {
  const { t } = useTranslation();
  const name = district.trim();
  if (knownLabel) {
    const text = t('onboarding.region.known', { district: name, region: t(knownLabel.labelKey) });
    return variant === 'cards' ? (
      <p className="mb-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-body text-sm text-on-primary">
        <Icon name="check_circle" filled />
        {text}
      </p>
    ) : (
      <p className="flex items-center gap-2 font-body text-sm text-primary">
        <Icon name="check_circle" filled className="text-base" />
        {text}
      </p>
    );
  }
  if (!name) return null;
  return (
    <fieldset className={variant === 'cards' ? 'mb-4 space-y-2' : 'space-y-2'}>
      <legend className="mb-2 font-body text-sm text-on-surface-variant">{t('onboarding.region.unknown', { district: name })}</legend>
      {variant === 'cards' ? (
        REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={picked === r.id}
            onClick={() => onPick(r.id)}
            className={cx(
              'flex min-h-12 w-full flex-col items-start rounded-xl px-4 py-2.5 text-left transition-colors',
              picked === r.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface',
            )}
          >
            <span className="font-headline text-base">{t(r.labelKey)}</span>
            <span className="font-body text-xs opacity-80">{t(r.examplesKey)}</span>
          </button>
        ))
      ) : (
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Chip key={r.id} selected={picked === r.id} onClick={() => onPick(r.id)}>
              {t(r.labelKey)}
            </Chip>
          ))}
        </div>
      )}
    </fieldset>
  );
}
