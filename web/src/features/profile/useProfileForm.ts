import { useState, type FormEvent } from 'react';
import type { User } from '../auth';
import { useUpdateProfile } from './api';
import { useDistrictRegion } from './useDistrictRegion';

/** ViewModel for editing the profile: name, district → region, language; a district is required. */
export function useProfileForm(user: User | null) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [lang, setLang] = useState(user?.language_pref ?? 'en');
  const [needDistrict, setNeedDistrict] = useState(false);
  const choice = useDistrictRegion(user?.district ?? '', user?.region_cluster ?? null);
  const { district, setDistrict, region } = choice;

  const typeDistrict = (text: string) => {
    setDistrict(text);
    setNeedDistrict(false);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    // A profile without a district is incomplete and would bounce the user back to onboarding.
    if (!district.trim()) {
      setNeedDistrict(true);
      return;
    }
    update.mutate(
      { name: name.trim() || null, district: district.trim(), region_cluster: region, language_pref: lang },
      { onSuccess: () => setEditing(false) },
    );
  };

  return {
    ...choice,
    editing,
    open: () => setEditing(true),
    close: () => setEditing(false),
    name, setName,
    lang, setLang,
    needDistrict,
    typeDistrict,
    save,
    busy: update.isPending,
    error: update.isError ? update.error : null,
  };
}
