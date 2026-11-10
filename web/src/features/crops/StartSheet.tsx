import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, Pill } from '../../ui';
import { useAddJournalEntry } from '../journal';
import { PlacePicker } from './PlacePicker';
import type { CropItem } from './schemas';

type Path = 'seeds' | 'seedlings' | 'transplant';

/**
 * Start a crop's season from wherever the gardener is: with seeds (sow now),
 * with bought seedlings (transplant now), or later (the reminders do the rest).
 * `transplant` is the follow-up step for a crop already in the nursery.
 */
export function StartSheet({ plantId, crop, path: initial, onClose }: { plantId: string; crop: CropItem; path?: Path; onClose: () => void }) {
  const { t } = useTranslation();
  const log = useAddJournalEntry(plantId);
  const [path, setPath] = useState<Path | null>(initial ?? null);
  const nurseryCrop = crop.method === 'NURSERY_TRANSPLANT';
  const [method, setMethod] = useState<'NURSERY' | 'DIRECT'>(nurseryCrop ? 'NURSERY' : 'DIRECT');
  const [place, setPlace] = useState<string | null>(null);
  const title = path === 'transplant' ? t('crops.start.transplantTitle', { crop: crop.name }) : t('crops.start.title', { crop: crop.name });

  const save = () => {
    const metadata = place ? { place_id: place } : {};
    const entry =
      path === 'seeds'
        ? { type: 'SOWING', metadata: { method, ...metadata } }
        : { type: 'TRANSPLANTING', metadata };
    log.mutate(entry, { onSuccess: onClose });
  };

  return (
    <section role="dialog" aria-label={title} className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
      <h2 className="font-headline text-xl text-primary">{title}</h2>
      {!path && (
        <div className="flex flex-col gap-2">
          <Button onClick={() => setPath('seeds')}>{t('crops.start.seeds')}</Button>
          <Button variant="quiet" onClick={() => setPath('seedlings')}>{t('crops.start.seedlings')}</Button>
          <Button variant="tertiary" onClick={onClose}>{t('crops.start.later')}</Button>
        </div>
      )}
      {path && (
        <>
          {path === 'seeds' && nurseryCrop && (
            <div className="flex flex-wrap gap-2">
              <Pill selected={method === 'NURSERY'} onClick={() => setMethod('NURSERY')}>{t('crops.start.nursery')}</Pill>
              <Pill selected={method === 'DIRECT'} onClick={() => setMethod('DIRECT')}>{t('crops.start.direct')}</Pill>
            </div>
          )}
          {!(path === 'seeds' && method === 'NURSERY') && <PlacePicker cropId={crop.id} value={place} onChange={setPlace} />}
          {log.isError && (
            <p role="alert" className="font-body text-sm text-error">
              {messageFor(log.error)}
            </p>
          )}
          <div className="flex gap-3">
            <Button busy={log.isPending} onClick={save}>{t('common.save')}</Button>
            <Button variant="tertiary" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </>
      )}
    </section>
  );
}
