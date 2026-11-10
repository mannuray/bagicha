import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Pill, TextField } from '../../ui';
import { useCreatePlace, usePlaces, useRotation } from './api';

/** Where this crop will grow: pick a bed or bag (or add one), with a gentle rotation note. */
export function PlacePicker({ cropId, value, onChange }: { cropId: string; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useTranslation();
  const places = usePlaces();
  const create = useCreatePlace();
  const rotation = useRotation(value, cropId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const add = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), kind: 'GROW_BAG' },
      {
        onSuccess: (place) => {
          onChange(place.id);
          setAdding(false);
          setName('');
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
        <div className="flex items-end gap-2">
          <TextField label={t('crops.place.name')} value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button variant="tertiary" busy={create.isPending} onClick={add}>
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
