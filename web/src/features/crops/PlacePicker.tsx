import { useTranslation } from 'react-i18next';
import { Button, Pill, TextField } from '../../ui';
import { usePlaces, useRotation } from './api';
import { usePlaceForm } from './usePlaceForm';
import type { Place } from './schemas';

const KINDS: Place['kind'][] = ['BED', 'GROW_BAG', 'POT', 'CONTAINER', 'GROUND'];
const SUN: Array<NonNullable<Place['sun_hours']>> = ['FULL', 'PARTIAL', 'SHADE'];

/** Where this crop will grow: pick a bed or bag (or add one with its kind and sun), with a gentle rotation note. */
export function PlacePicker({ cropId, value, onChange }: { cropId: string; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useTranslation();
  const places = usePlaces();
  const rotation = useRotation(value, cropId);
  const form = usePlaceForm(onChange);

  return (
    <div className="space-y-2">
      <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('crops.place.where')}</p>
      <div className="flex flex-wrap gap-2">
        {(places.data ?? []).map((p) => (
          <Pill key={p.id} selected={value === p.id} onClick={() => onChange(value === p.id ? null : p.id)} className="normal-case tracking-normal">
            {p.name}
          </Pill>
        ))}
        {!form.adding && (
          <Pill selected={false} onClick={form.open} className="normal-case tracking-normal">
            {t('crops.place.add')}
          </Pill>
        )}
      </div>
      {form.adding && (
        <div className="space-y-3 rounded-[1.5rem] bg-surface-container-low p-3">
          <TextField label={t('crops.place.name')} value={form.name} onChange={(e) => form.setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Pill key={k} selected={form.kind === k} onClick={() => form.setKind(k)} className="normal-case tracking-normal">
                {t(`crops.place.kind.${k}`)}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUN.map((s) => (
              <Pill key={s} selected={form.sun === s} onClick={() => form.toggleSun(s)} className="normal-case tracking-normal">
                {t(`crops.place.sun.${s}`)}
              </Pill>
            ))}
          </div>
          <Button variant="quiet" busy={form.busy} onClick={form.add}>
            {t('crops.place.save')}
          </Button>
        </div>
      )}
      {rotation.data?.conflict && rotation.data.last && (
        <p className="rounded-lg bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">
          {t('crops.place.rotation', { crop: rotation.data.last.crop_name, season: rotation.data.last.season_label })}
        </p>
      )}
    </div>
  );
}
