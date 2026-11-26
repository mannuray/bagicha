import { useTranslation } from 'react-i18next';
import { useSession } from '../auth';
import { usePushPermission, usePushPort, SLOTS, slotMinutes, timeLabel, type Slot } from '../reminders';
import { useUpdateProfile } from './api';
import { Icon } from '../../ui';

const OFF = 'off';

/** The profile's reminder times, on the phone only (the website gets no pushes). */
export function RemindersSection() {
  const { t, i18n } = useTranslation();
  const port = usePushPort();
  const { user } = useSession();
  const { permission } = usePushPermission(port);
  const update = useUpdateProfile();

  if (!port.native || !user) return null;

  const save = (slot: Slot, value: string) =>
    update.mutate({ [SLOTS[slot].field]: value === OFF ? null : Number(value) });

  return (
    <section aria-labelledby="reminders-title" className="space-y-0.5 rounded-xl bg-surface-container-low p-1.5">
      <h2 id="reminders-title" className="px-3 py-2 font-headline text-base font-bold text-primary/80">
        {t('reminders.section.title')}
      </h2>
      {permission === 'denied' && (
        <div className="space-y-1 px-3 pb-2">
          <p className="font-body text-sm font-bold text-on-surface">{t('reminders.section.blocked')}</p>
          <p className="font-body text-xs text-on-surface-variant">{t('reminders.section.howTo')}</p>
        </div>
      )}
      {(Object.keys(SLOTS) as Slot[]).map((slot) => {
        const id = `reminder-${slot}`;
        const current = user[SLOTS[slot].field];
        return (
          <div key={slot} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2">
            <span className="flex items-center gap-3">
              <Icon name={slot === 'morning' ? 'wb_twilight' : 'wb_sunny'} className="text-primary/60" />
              <label htmlFor={id} className="font-body text-sm font-bold tracking-tight text-on-surface">
                {t(`reminders.section.${slot}`)}
              </label>
            </span>
            <select
              id={id}
              value={current === null ? OFF : String(current)}
              disabled={update.isPending}
              onChange={(e) => save(slot, e.target.value)}
              className="min-h-11 rounded-lg bg-surface px-2 font-body text-sm text-on-surface"
            >
              <option value={OFF}>{t('reminders.section.off')}</option>
              {slotMinutes(slot).map((m) => (
                <option key={m} value={String(m)}>
                  {timeLabel(m, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </section>
  );
}
