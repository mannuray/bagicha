import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Pill, TextField } from '../../ui';
import { useCreatePlace, usePlaces, useRotation } from './api';
import type { Place } from './schemas';

const KINDS: Place['kind'][] = ['BED', 'GROW_BAG', 'POT', 'CONTAINER', 'GROUND'];
const SUN: Array<NonNullable<Place['sun_hours']>> = ['FULL', 'PARTIAL', 'SHADE'];

/** Where this crop will grow: pick a bed or bag (or add one with its kind and sun), with a gentle rotation note. */
export function PlacePicker({ cropId, value, onChange }: { cropId: string; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useTranslation();
  const places = usePlaces();
  const create = useCreatePlace();
  const rotation = useRotation(value, cropId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Place['kind']>('GROW_BAG');
  const [sun, setSun] = useState<Place['sun_hours']>(null);

  const add = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), kind, ...(sun ? { sun_hours: sun } : {}) },
      {
        onSuccess: (place) => {
          onChange(place.id);
          setAdding(false);
          setName('');
          setSun(null);
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('crops.place.where')}</p>
      <div className="flex flex-wrap gap-2">
        {(places.data ?? []).map((p) => (
          <Pill key={p.id} selected={value === p.id} onClick={() => onChange(value === p.id ? null : p.id)} className="normal-case tracking-normal">
            {p.name}
          </Pill>
        ))}
        {!adding && (
          <Pill selected={false} onClick={() => setAdding(true)} className="normal-case tracking-normal">
            {t('crops.place.add')}
          </Pill>
        )}
      </div>
      {adding && (
        <div className="space-y-3 rounded-[1.5rem] bg-surface-container-low p-3">
          <TextField label={t('crops.place.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Pill key={k} selected={kind === k} onClick={() => setKind(k)} className="normal-case tracking-normal">
                {t(`crops.place.kind.${k}`)}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUN.map((s) => (
              <Pill key={s} selected={sun === s} onClick={() => setSun(sun === s ? null : s)} className="normal-case tracking-normal">
                {t(`crops.place.sun.${s}`)}
              </Pill>
            ))}
          </div>
          <Button variant="quiet" busy={create.isPending} onClick={add}>
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
