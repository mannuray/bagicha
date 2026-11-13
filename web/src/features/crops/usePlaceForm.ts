import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePlace } from './api';
import type { Place } from './schemas';

export type PlaceForm = ReturnType<typeof usePlaceForm>;

/**
 * ViewModel for the always-open "new place": kind (Ground first), an optional
 * name and sun. A blank name takes the kind's name; a place with the same name
 * and kind is reused, not made again.
 */
export function usePlaceForm(onAdded: (placeId: string) => void, places: Place[]) {
  const { t } = useTranslation();
  const create = useCreatePlace();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Place['kind']>('GROUND');
  const [sun, setSun] = useState<Place['sun_hours']>(null);

  /** Saves the place and picks it; resolves to its id (null if saving failed). */
  const add = async (): Promise<string | null> => {
    const placeName = name.trim() || t(`crops.place.kind.${kind}`);
    // Pressing Start with the defaults again must not pile up places called "Ground".
    const same = places.find((p) => p.kind === kind && p.name.trim().toLowerCase() === placeName.toLowerCase());
    if (same) {
      onAdded(same.id);
      return same.id;
    }
    try {
      const place = await create.mutateAsync({
        name: placeName,
        kind,
        ...(sun ? { sun_hours: sun } : {}),
      });
      onAdded(place.id);
      return place.id;
    } catch {
      return null;
    }
  };

  return {
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
