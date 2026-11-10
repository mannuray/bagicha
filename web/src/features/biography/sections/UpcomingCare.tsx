import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorState, LoadingState } from '../../../ui';
import { TaskCard, thisWeek, usePlantTasks } from '../../tasks';

/** The next three pending tasks for this tree. */
export function UpcomingCare({ plantId, now }: { plantId: string; now: Date }) {
  const { t } = useTranslation();
  const tasks = usePlantTasks(plantId);
  const groups = tasks.data ? thisWeek(tasks.data.items, now) : null;
  const upcoming = groups ? [...groups.overdue, ...groups.week, ...groups.later].slice(0, 3) : [];
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-headline text-xl text-primary">{t('biography.upcomingCare')}</h2>
        <Link to={`/plants/${plantId}/tasks`} className="font-label text-sm font-bold text-secondary">
          {t('common.seeAll')}
        </Link>
      </div>
      {tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : !tasks.data ? (
        <LoadingState />
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">{t('tasks.emptyPlantBody')}</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((task) => (
            <TaskCard key={task.id} task={task} now={now} showPlant={false} />
          ))}
        </div>
      )}
    </section>
  );
}
