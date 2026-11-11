import { useTranslation } from 'react-i18next';
import { ClosedTaskCard, TaskCard } from './TaskCard';
import type { Task } from './schemas';
import { closedTasks, taskSections } from './this-week';

/** Overdue actions / current plan (or one capped list with `limit`); empty sections are skipped. */
export function TaskGroups({
  tasks,
  now,
  showPlant = true,
  limit,
  onError,
}: {
  tasks: Task[];
  now: Date;
  showPlant?: boolean;
  limit?: number;
  onError?: (err: unknown) => void;
}) {
  const { t } = useTranslation();
  const sections = taskSections(tasks, now, limit);
  return (
    <div className="space-y-6">
      {sections.map((s) => (
          <section key={s.key} aria-label={t(`tasks.group.${s.key}`)}>
            {!limit && (
              <h2 className="mb-3 font-label text-sm font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                {t(`tasks.group.${s.key}`)}
              </h2>
            )}
            <div className="space-y-3">
              {s.items.map((task) => (
                <TaskCard key={task.id} task={task} now={now} showPlant={showPlant} onError={onError} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

/** Stitch "Closed history": recent done and skipped tasks, faded. */
export function ClosedHistory({ tasks, now, showPlant = true }: { tasks: Task[]; now: Date; showPlant?: boolean }) {
  const { t } = useTranslation();
  const closed = closedTasks(tasks);
  if (closed.length === 0) return null;
  return (
    <section aria-label={t('tasks.group.closed')} className="opacity-70">
      <h2 className="mb-3 font-label text-sm font-bold uppercase tracking-[0.1em] text-on-surface-variant">{t('tasks.group.closed')}</h2>
      <div className="space-y-3">
        {closed.map((task) => (
          <ClosedTaskCard key={task.id} task={task} now={now} showPlant={showPlant} />
        ))}
      </div>
    </section>
  );
}
