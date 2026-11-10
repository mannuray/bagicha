import { useTranslation } from 'react-i18next';
import { systemClock } from '../../lib/clock';
import { messageFor } from '../../lib/error-messages';
import { Button, cx } from '../../ui';
import { useUpdateTaskStatus } from './api';
import type { Task } from './schemas';
import { closedLabel, dueLabel } from './this-week';

/** Stitch Daily Path task card: title, urgency badge, due line, why it exists, Mark done / Skip. */
export function TaskCard({
  task,
  now = systemClock.now(),
  showPlant = true,
  onError,
}: {
  task: Task;
  now?: Date;
  showPlant?: boolean;
  onError?: (err: unknown) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateTaskStatus();
  const due = dueLabel(task.due_date, now);
  const act = (status: 'COMPLETED' | 'SKIPPED') => {
    if (update.isPending) return;
    update.mutate({ task, status }, { onError });
  };

  const overdue = due.key === 'overdue';
  const badge = overdue ? 'urgent' : task.priority === 'HIGH' ? 'high' : null;

  return (
    <article aria-label={task.title} className="rounded-[2rem_2.5rem_2rem_1.5rem] bg-surface-container-low p-5 shadow-[0_10px_40px_rgba(28,28,25,0.02)]">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-headline text-lg font-bold leading-snug text-primary">{task.title}</h3>
        {badge && (
          <span
            className={cx(
              'shrink-0 rounded-full px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest',
              badge === 'urgent' ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed',
            )}
          >
            {t(`tasks.badge.${badge}`)}
          </span>
        )}
      </div>
      <p className="font-label text-xs font-bold uppercase tracking-wider text-secondary">
        {[showPlant ? task.tree_name : null, t(`tasks.due.${due.key}`, { count: due.count })].filter(Boolean).join(' · ')}
      </p>
      {task.source_summary && <p className="mt-1 line-clamp-2 font-body text-xs text-on-surface-variant">{task.source_summary}</p>}
      {!onError && update.error && (
        <p role="alert" className="mt-2 font-body text-sm text-error">
          {messageFor(update.error)}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <Button variant="primary" busy={update.isPending} onClick={() => act('COMPLETED')} className="flex-1 uppercase tracking-wider">
          {t('tasks.complete')}
        </Button>
        <Button variant="quiet" disabled={update.isPending} onClick={() => act('SKIPPED')} className="bg-surface uppercase tracking-wider text-on-surface-variant">
          {t('tasks.skip')}
        </Button>
      </div>
    </article>
  );
}

/** A done or skipped task in the closed history: muted, struck through, no actions. */
export function ClosedTaskCard({ task, now = systemClock.now(), showPlant = true }: { task: Task; now?: Date; showPlant?: boolean }) {
  const { t } = useTranslation();
  const label = closedLabel(task, now);
  return (
    <article aria-label={task.title} className="rounded-[2rem_2.5rem_2rem_1.5rem] bg-surface px-5 py-4">
      <h3 className="font-headline text-lg font-bold text-on-surface-variant line-through decoration-1">{task.title}</h3>
      <p className="font-label text-xs font-bold uppercase tracking-wider text-outline">
        {[showPlant ? task.tree_name : null, t(`tasks.closed.${label.key}`, { count: label.count })].filter(Boolean).join(' · ')}
      </p>
    </article>
  );
}
