import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePlace } from './api';
import type { Place } from './schemas';

export type PlaceForm = ReturnType<typeof usePlaceForm>;

/**
 * ViewModel for "add a place": name, kind (Ground first) and sun. Open from the
 * start when the gardener has no places yet; a blank name takes the kind's name.
 */
export function usePlaceForm(onAdded: (placeId: string) => void, noPlacesYet: boolean) {
  const { t } = useTranslation();
  const create = useCreatePlace();
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Place['kind']>('GROUND');
  const [sun, setSun] = useState<Place['sun_hours']>(null);
  const adding = opened || noPlacesYet;

  /** Saves the place and picks it; resolves to its id (null if saving failed). */
  const add = async (): Promise<string | null> => {
    try {
      const place = await create.mutateAsync({
        name: name.trim() || t(`crops.place.kind.${kind}`),
        kind,
        ...(sun ? { sun_hours: sun } : {}),
      });
      onAdded(place.id);
      setOpened(false);
      setName('');
      setSun(null);
      return place.id;
    } catch {
      return null;
    }
  };

  return {
    adding,
    open: () => setOpened(true),
    name,
    setName,
    kind,
    setKind,
    sun,
    toggleSun: (s: NonNullable<Place['sun_hours']>) => setSun((cur) => (cur === s ? null : s)),
    add,
    busy: create.isPending,
    error: create.isError ? create.error : null,
  };
}
