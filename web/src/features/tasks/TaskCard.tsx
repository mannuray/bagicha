import { useTranslation } from 'react-i18next';
import { systemClock } from '../../lib/clock';
import { messageFor } from '../../lib/error-messages';
import { Button, cx } from '../../ui';
import { useUpdateTaskStatus } from './api';
import type { Task } from './schemas';
import { dueLabel } from './this-week';

/** A task as a soft card with a pebble check, plant, due label and why it exists. */
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

  return (
    <article
      aria-label={task.title}
      className={cx(
        'rounded-xl bg-surface-container-low p-4',
        task.priority === 'HIGH' && 'shadow-[inset_4px_0_0_var(--color-secondary)]',
      )}
    >
      <div className="flex items-start gap-4">
        <span className="pebble-small mt-1 h-8 w-8 shrink-0 bg-surface-container-lowest" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-body text-base font-medium text-on-surface">{task.title}</p>
          <p className="font-body text-sm text-outline">
            {[showPlant ? task.tree_name : null, t(`tasks.due.${due.key}`, { count: due.count })].filter(Boolean).join(' • ')}
          </p>
          {task.source_summary && <p className="mt-1 font-body text-xs text-on-surface-variant">{task.source_summary}</p>}
        </div>
      </div>
      {!onError && update.error && (
        <p role="alert" className="mt-2 font-body text-sm text-error">
          {messageFor(update.error)}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="tertiary" disabled={update.isPending} onClick={() => act('SKIPPED')}>
          {t('tasks.skip')}
        </Button>
        <Button variant="primary" busy={update.isPending} onClick={() => act('COMPLETED')}>
          {t('tasks.complete')}
        </Button>
      </div>
    </article>
  );
}
