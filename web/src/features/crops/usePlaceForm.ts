import { useState } from 'react';
import { useCreatePlace } from './api';
import type { Place } from './schemas';

/** ViewModel for "add a place": name, kind and sun; on save, picks the new place and closes. */
export function usePlaceForm(onAdded: (placeId: string) => void) {
  const create = useCreatePlace();
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
          onAdded(place.id);
          setAdding(false);
          setName('');
          setSun(null);
        },
      },
    );
  };

  return { adding, open: () => setAdding(true), name, setName, kind, setKind, sun, toggleSun: (s: NonNullable<Place['sun_hours']>) => setSun((cur) => (cur === s ? null : s)), add, busy: create.isPending };
}
