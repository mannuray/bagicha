import { useTranslation } from 'react-i18next';
import { Pill, TextField } from '../../ui';
import { usePlaces, useRotation } from './api';
import type { PlaceForm } from './usePlaceForm';
import type { Place } from './schemas';

const KINDS: Place['kind'][] = ['GROUND', 'BED', 'GROW_BAG', 'POT', 'CONTAINER'];
const SUN: Array<NonNullable<Place['sun_hours']>> = ['FULL', 'PARTIAL', 'SHADE'];

/**
 * Where this crop will grow: one of the gardener's places, or a new one described
 * right here (no extra tap; Start saves it). A gentle rotation note for a chosen place.
 */
export function PlacePicker({ cropId, value, onChange, form }: { cropId: string; value: string | null; onChange: (id: string | null) => void; form: PlaceForm }) {
  const { t } = useTranslation();
  const places = usePlaces();
  const rotation = useRotation(value, cropId);
  const existing = places.data ?? [];
  const newPlace = value === null;

  return (
    <div className="space-y-3">
      {existing.length > 0 && (
        <div className="space-y-2">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('crops.place.where')}</p>
          <div className="flex flex-wrap gap-2">
            {existing.map((p) => (
              <Pill key={p.id} selected={value === p.id} onClick={() => onChange(value === p.id ? null : p.id)} className="normal-case tracking-normal">
                {p.name}
              </Pill>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3 rounded-[1.5rem] bg-surface-container-low p-3">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {existing.length > 0 ? t('crops.place.orNew') : t('crops.place.where')}
        </p>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Pill
              key={k}
              selected={newPlace && form.kind === k}
              onClick={() => {
                form.setKind(k);
                onChange(null);
              }}
              className="normal-case tracking-normal"
            >
              {t(`crops.place.kind.${k}`)}
            </Pill>
          ))}
        </div>
        <TextField label={t('crops.place.name')} value={form.name} onChange={(e) => form.setName(e.target.value)} onFocus={() => onChange(null)} />
        <div className="flex flex-wrap gap-2">
          {SUN.map((s) => (
            <Pill
              key={s}
              selected={newPlace && form.sun === s}
              onClick={() => {
                form.toggleSun(s);
                onChange(null);
              }}
              className="normal-case tracking-normal"
            >
              {t(`crops.place.sun.${s}`)}
            </Pill>
          ))}
        </div>
      </div>
      {rotation.data?.conflict && rotation.data.last && (
        <p className="rounded-lg bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">
          {t('crops.place.rotation', { crop: rotation.data.last.crop_name, season: rotation.data.last.season_label })}
        </p>
      )}
    </div>
  );
}
