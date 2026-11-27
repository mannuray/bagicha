import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Icon, cx } from '../../ui';
import type { Task } from './schemas';
import { closedLabel, dueLabel, taskBadge } from './this-week';
import { useTaskActions } from './useTaskActions';

/**
 * A task as one compact row: a check circle (Mark done), the title with its plant · due line and badge,
 * and Skip. Tapping the title unfolds how and why, so the list stays short.
 */
export function TaskCard({
  task,
  now,
  showPlant = true,
  onError,
}: {
  task: Task;
  now: Date;
  showPlant?: boolean;
  onError?: (err: unknown) => void;
}) {
  const { t } = useTranslation();
  const actions = useTaskActions(task, onError);
  const [open, setOpen] = useState(false);
  const due = dueLabel(task.due_date, now);
  const badge = taskBadge(task, now);
  const hasDetails = Boolean(task.care_how || task.source_summary);

  return (
    <article aria-label={task.title} className="rounded-2xl bg-surface-container-lowest py-1.5 pl-1 pr-1.5 shadow-[0_2px_12px_rgba(28,28,25,0.04)]">
      <div className="flex items-start">
        <button
          type="button"
          aria-label={t('tasks.complete')}
          aria-busy={actions.busy || undefined}
          disabled={actions.busy}
          onClick={actions.complete}
          className="group flex min-h-10 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl pt-1.5 disabled:opacity-60"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors group-enabled:group-active:bg-primary group-enabled:group-active:text-on-primary">
            {actions.busy ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            ) : (
              <Icon name="check" className="text-[18px] font-bold" />
            )}
          </span>
          {/* Spelled out so the circle reads as a button, not a status. */}
          <span aria-hidden className="font-label text-[9px] font-bold uppercase tracking-wider text-primary">
            {t('tasks.done')}
          </span>
        </button>
        <div className="min-w-0 flex-1 py-1.5">
          <h3 className="font-headline text-[15px] font-semibold leading-snug text-primary">
            <button
              type="button"
              aria-expanded={hasDetails ? open : undefined}
              disabled={!hasDetails}
              onClick={() => setOpen((o) => !o)}
              className="text-left disabled:cursor-default"
            >
              {task.title}
            </button>
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-label text-[11px] font-bold uppercase tracking-wider text-secondary">
            <span>{[showPlant ? task.tree_name : null, t(`tasks.due.${due.key}`, { count: due.count })].filter(Boolean).join(' · ')}</span>
            {badge && (
              <span
                className={cx(
                  'rounded-full px-2 py-px text-[9px] tracking-widest',
                  badge === 'urgent' ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed',
                )}
              >
                {t(`tasks.badge.${badge}`)}
              </span>
            )}
            {hasDetails && <Icon name={open ? 'expand_less' : 'expand_more'} className="text-[16px] text-outline" />}
          </p>
          {open &&
            (task.care_how ? (
              <CareHow how={task.care_how} />
            ) : (
              <p className="mt-2 font-body text-xs text-on-surface-variant">{task.source_summary}</p>
            ))}
          {!onError && actions.error && (
            <p role="alert" className="mt-2 font-body text-sm text-error">
              {messageFor(actions.error, t)}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={actions.busy}
          onClick={actions.skip}
          className="min-h-10 shrink-0 rounded-full px-2.5 font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant disabled:opacity-60"
        >
          {t('tasks.skip')}
        </button>
      </div>
    </article>
  );
}

/** How to do a care reminder: the organic way first, then the alternative, then why. */
function CareHow({ how }: { how: NonNullable<Task['care_how']> }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 space-y-1 font-body text-xs text-on-surface-variant">
      {how.organic && (
        <p>
          <span className="font-label font-bold uppercase tracking-wider text-primary">{t('tasks.care.organic')}</span> {how.organic}
        </p>
      )}
      {how.amount && (
        <p>
          <span className="font-label font-bold uppercase tracking-wider text-primary">{t('tasks.care.amount')}</span> {how.amount}
        </p>
      )}
      {how.chemical && (
        <p>
          <span className="font-label font-bold uppercase tracking-wider text-secondary">{t('tasks.care.alternative')}</span> {how.chemical}
        </p>
      )}
      <p className="italic">{how.why}</p>
    </div>
  );
}

/** A done or skipped task in the closed history: muted, struck through, no actions. */
export function ClosedTaskCard({ task, now, showPlant = true }: { task: Task; now: Date; showPlant?: boolean }) {
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
