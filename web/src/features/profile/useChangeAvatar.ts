import { useState } from 'react';
import { usePhotoUpload } from '../journal';
import { useUpdateProfile } from './api';

/** ViewModel for the profile photo: compress, upload privately, save its key; one at a time. */
export function useChangeAvatar() {
  const photoUpload = usePhotoUpload('avatar');
  const update = useUpdateProfile();
  const [problem, setProblem] = useState<unknown>(null);
  const busy = photoUpload.isPending || update.isPending;

  const change = async (file: File) => {
    if (busy) return;
    setProblem(null);
    try {
      const key = await photoUpload.upload(file);
      await update.mutateAsync({ avatar_key: key });
    } catch (err) {
      setProblem(err);
    }
  };

  return { change, busy, problem };
}
