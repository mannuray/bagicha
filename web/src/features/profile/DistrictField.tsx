import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../../ui';
import { regionById, suggestDistricts, type DistrictOption } from './regions';

/**
 * The district box with suggestions from the full list (onboarding and profile).
 * Picking a suggestion fills its label: "Gaya", or "Aurangabad, Bihar" for shared names.
 */
export function DistrictField({
  label,
  value,
  list,
  error,
  onChange,
  className,
}: {
  label: string;
  value: string;
  list: readonly DistrictOption[];
  error?: string | null;
  onChange: (text: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(false);
  // Nothing to suggest once the text is exactly a district on the list.
  const exact = list.some((d) => d.label.toLowerCase() === value.trim().toLowerCase());
  const suggestions = typing && !exact ? suggestDistricts(value, list) : [];
  return (
    <div className={className}>
      <TextField
        label={label}
        value={value}
        error={error}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setTyping(true);
        }}
      />
      {suggestions.length > 0 && (
        <ul role="listbox" aria-label={t('onboarding.region.suggestions')} className="mt-2 overflow-hidden rounded-xl bg-surface-container-low">
          {suggestions.map((d) => (
            <li key={`${d.name}|${d.state}`} role="none">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(d.label);
                  setTyping(false);
                }}
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
    </div>
  );
}
