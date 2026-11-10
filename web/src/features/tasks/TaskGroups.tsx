import { useTranslation } from 'react-i18next';
import { TaskCard } from './TaskCard';
import type { Task } from './schemas';
import { thisWeek } from './this-week';

/** Overdue / this week / later sections; renders nothing for empty sections. */
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
  const groups = thisWeek(tasks, now);
  const sections = limit
    ? [{ key: 'week', items: [...groups.overdue, ...groups.week].slice(0, limit) }]
    : [
        { key: 'overdue', items: groups.overdue },
        { key: 'week', items: groups.week },
        { key: 'later', items: groups.later },
      ];
  return (
    <div className="space-y-6">
      {sections
        .filter((s) => s.items.length > 0)
        .map((s) => (
          <section key={s.key} aria-label={t(`tasks.group.${s.key}`)}>
            {!limit && (
              <h2 className="mb-3 ml-2 font-label text-sm font-bold uppercase tracking-widest text-outline">
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

export function hasPendingSoon(tasks: Task[], now: Date): boolean {
  const g = thisWeek(tasks, now);
  return g.overdue.length + g.week.length > 0;
}
