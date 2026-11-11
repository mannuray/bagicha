import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNow } from '../../lib/clock';
import { messageFor } from '../../lib/error-messages';
import { Button, EmptyState, Icon, QueryState, Screen, TopBar } from '../../ui';
import { useMaterializeTasks, useMyTasks, usePlantTasks } from './api';
import { ClosedHistory, TaskGroups } from './TaskGroups';
import type { Task } from './schemas';
import { NotInGarden, isPlantMissing } from '../plants';

/** Stitch "The Daily Path": every task, or one plant's tasks at /plants/:id/tasks. */
export function TasksScreen() {
  const { id } = useParams();
  return id ? <PlantTasks plantId={id} /> : <AllTasks />;
}

function AllTasks() {
  const { t } = useTranslation();
  const query = useMyTasks();
  return (
    <Frame subtitle={t('tasks.subtitleAll')}>
      {(onError) => (
        <QueryState query={{ ...query, data: query.data?.items }}>
          {(items) => <DailyPath tasks={items} emptyBody={t('tasks.emptyBody')} onError={onError} />}
        </QueryState>
      )}
    </Frame>
  );
}

function PlantTasks({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const query = usePlantTasks(plantId);
  const materialize = useMaterializeTasks();
  const treeName = query.data?.items[0]?.tree_name;
  const subtitle = treeName ? t('tasks.subtitlePlant', { name: treeName }) : t('tasks.plantTitle');
  if (query.isError && isPlantMissing(query.error)) {
    return <Frame subtitle={t('tasks.plantTitle')}>{() => <NotInGarden />}</Frame>;
  }
  return (
    <Frame subtitle={subtitle}>
      {(onError) => (
        <>
          <Button variant="tertiary" busy={materialize.isPending} onClick={() => materialize.mutate(plantId)} className="-ml-2 mb-2 self-start">
            <Icon name="autorenew" />
            {t('tasks.refreshSeason')}
          </Button>
          {materialize.isError && (
            <p role="alert" className="mb-4 font-body text-sm text-error">
              {messageFor(materialize.error)}
            </p>
          )}
          <QueryState query={{ ...query, data: query.data?.items }}>
            {(items) => <DailyPath tasks={items} showPlant={false} emptyBody={t('tasks.emptyPlantBody')} onError={onError} />}
          </QueryState>
        </>
      )}
    </Frame>
  );
}

function DailyPath({
  tasks,
  showPlant = true,
  emptyBody,
  onError,
}: {
  tasks: Task[];
  showPlant?: boolean;
  emptyBody: string;
  onError: (err: unknown) => void;
}) {
  const { t } = useTranslation();
  const now = useNow();
  const nothingDue = tasks.every((task) => task.status !== 'PENDING');
  return (
    <div className="space-y-8">
      {nothingDue ? (
        <EmptyState title={t('tasks.emptyTitle')} body={emptyBody} />
      ) : (
        <TaskGroups tasks={tasks} now={now} showPlant={showPlant} onError={onError} />
      )}
      <ClosedHistory tasks={tasks} now={now} showPlant={showPlant} />
    </div>
  );
}

function Frame({ subtitle, children }: { subtitle: string; children: (onError: (err: unknown) => void) => ReactNode }) {
  const { t } = useTranslation();
  const [problem, setProblem] = useState<unknown>(null);
  const onError = (err: unknown) => setProblem(err);
  return (
    <Screen>
      <div className="flex items-center gap-1">
        <TopBar />
        <span className="pt-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('tasks.title')}</span>
      </div>
      <header className="px-4 pb-4 pt-4">
        <h1 className="mb-1 font-headline text-2xl font-bold tracking-tight text-primary">{t('tasks.title')}</h1>
        <p className="font-label text-xs uppercase tracking-[0.1em] text-secondary">{subtitle}</p>
      </header>
      <main className="flex flex-col px-4 pb-10">
        {problem !== null && (
          <p role="alert" className="mb-4 rounded-xl bg-error-container px-4 py-3 font-body text-sm text-on-error-container">
            {messageFor(problem)}
          </p>
        )}
        {children(onError)}
      </main>
    </Screen>
  );
}
