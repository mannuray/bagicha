import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Icon } from '../../ui';
import { useImageCompressor, useMediaUrl, useUploadImage } from '../journal';
import { useUpdateProfile } from './api';

/** The profile picture: tap to pick a photo; it is compressed, uploaded privately and saved. */
export function ProfilePhoto({ avatarKey }: { avatarKey: string | null }) {
  const { t } = useTranslation();
  const compressor = useImageCompressor();
  const upload = useUploadImage('avatar');
  const update = useUpdateProfile();
  const photo = useMediaUrl(avatarKey);
  const [error, setError] = useState<string | null>(null);
  const busy = upload.isPending || update.isPending;

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setError(null);
    try {
      const compressed = await compressor.compress(file);
      const { key } = await upload.mutateAsync(compressed.blob);
      await update.mutateAsync({ avatar_key: key });
    } catch (err) {
      setError(messageFor(err));
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <label className="pebble-large relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden bg-primary-gradient text-on-primary shadow-xl focus-within:ring-2 focus-within:ring-secondary">
        {photo.data ? (
          <img src={photo.data} alt={t('profile.photo')} className="h-full w-full object-cover" />
        ) : (
          <Icon name="person" filled className="text-4xl" />
        )}
        <span className="absolute inset-x-0 bottom-0 flex justify-start bg-black/35 py-0.5 pl-5" aria-hidden>
          <Icon name={busy ? 'hourglass_top' : 'photo_camera'} className={busy ? 'animate-pulse text-sm' : 'text-sm'} />
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={t('profile.changePhoto')}
          disabled={busy}
          onChange={(e) => void pick(e)}
        />
      </label>
      {error && (
        <p role="alert" className="max-w-56 text-center font-label text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
