import { useTranslation } from 'react-i18next';
import { ErrorState, LoadingState, SeeAllLink } from '../../../ui';
import { TaskCard, upcoming, usePlantTasks } from '../../tasks';

/** The next three pending tasks for this tree. */
export function UpcomingCare({ plantId, now }: { plantId: string; now: Date }) {
  const { t } = useTranslation();
  const tasks = usePlantTasks(plantId);
  const next = tasks.data ? upcoming(tasks.data.items, now, 3) : [];
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-headline text-xl text-primary">{t('biography.upcomingCare')}</h2>
        <SeeAllLink to={`/plants/${plantId}/tasks`} />
      </div>
      {tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : !tasks.data ? (
        <LoadingState />
      ) : next.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">{t('tasks.emptyPlantBody')}</p>
      ) : (
        <div className="space-y-3">
          {next.map((task) => (
            <TaskCard key={task.id} task={task} now={now} showPlant={false} />
          ))}
        </div>
      )}
    </section>
  );
}
