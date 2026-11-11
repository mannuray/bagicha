import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Icon } from '../../ui';
import { useMediaUrl } from '../journal';
import { useChangeAvatar } from './useChangeAvatar';

/** The profile picture: tap to pick a photo; it is compressed, uploaded privately and saved. */
export function ProfilePhoto({ avatarKey }: { avatarKey: string | null }) {
  const { t } = useTranslation();
  const photo = useMediaUrl(avatarKey);
  const { change, busy, problem } = useChangeAvatar();

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void change(file);
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
          onChange={pick}
        />
      </label>
      {problem !== null && (
        <p role="alert" className="max-w-56 text-center font-label text-xs text-error">
          {messageFor(problem, t)}
        </p>
      )}
    </div>
  );
}
