import { useTranslation } from 'react-i18next';
import { messageFor } from '../../../lib/error-messages';
import { Button, Pill, TextField } from '../../../ui';
import type { JournalEntry } from '../../journal';
import type { PlantEndReason } from '../../plants';
import { useEndPlantForm } from '../useEndPlantForm';
import { humanize, shortDate } from './format';

const REASONS: PlantEndReason[] = ['DISEASE_OR_PEST', 'WEATHER', 'WATER', 'OLD_AGE', 'UNKNOWN_CAUSE', 'REMOVED', 'REPLACED'];

/** Record that a tree died or was removed. Calm by design: its history stays. */
export function EndSheet({ plantId, entries, now, crop = false, onClose }: { plantId: string; entries: JournalEntry[]; now: Date; crop?: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { diagnosis, today, reason, setReason, date, setDate, note, setNote, linked, toggleLinked, save, busy, error } = useEndPlantForm(plantId, entries, now, onClose);

  return (
    <section role="dialog" aria-label={t(crop ? 'biography.end.openCrop' : 'biography.end.title')} className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
      <div>
        <h2 className="font-headline text-xl text-primary">{t(crop ? 'biography.end.openCrop' : 'biography.end.title')}</h2>
        <p className="mt-1 font-body text-sm text-on-surface-variant">{t('biography.end.intro')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <Pill key={r} selected={reason === r} onClick={() => setReason(r)}>
            {t(`biography.end.reason.${r}`)}
          </Pill>
        ))}
      </div>
      {diagnosis && (
        <Pill selected={linked} onClick={toggleLinked} className="normal-case tracking-normal">
          {t('biography.end.linked', {
            what: diagnosis.content ?? humanize(diagnosis.type),
            date: shortDate(diagnosis.timestamp, i18n.language),
          })}
        </Pill>
      )}
      <TextField label={t('biography.end.date')} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} hint={t('biography.end.dateHint')} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="end-note" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {t('biography.end.note')}
        </label>
        <textarea
          id="end-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="ghost-border resize-none rounded-lg bg-surface-container px-3.5 py-2.5 font-body text-base text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {error && (
        <p role="alert" className="font-body text-sm text-error">
          {messageFor(error)}
        </p>
      )}
      <div className="flex gap-3">
        <Button disabled={!reason} busy={busy} onClick={save}>
          {t('biography.end.save')}
        </Button>
        <Button variant="tertiary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </section>
  );
}
