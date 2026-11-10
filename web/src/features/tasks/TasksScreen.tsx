import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { systemClock } from '../../lib/clock';
import { messageFor } from '../../lib/error-messages';
import { Button, EmptyState, Icon, QueryState, Screen, TopBar } from '../../ui';
import { useMaterializeTasks, useMyTasks, usePlantTasks } from './api';
import { TaskGroups } from './TaskGroups';
import type { Task } from './schemas';

/** Stitch "The Daily Path": every task, or one plant's tasks at /plants/:id/tasks. */
export function TasksScreen() {
  const { id } = useParams();
  return id ? <PlantTasks plantId={id} /> : <AllTasks />;
}

function AllTasks() {
  const { t } = useTranslation();
  const query = useMyTasks();
  return (
    <Frame title={t('tasks.title')}>
      {(onError) => (
        <QueryState
          query={{ ...query, data: query.data?.items }}
          empty={(items: Task[]) => items.every((x) => x.status !== 'PENDING')}
          emptyView={<EmptyState title={t('tasks.emptyTitle')} body={t('tasks.emptyBody')} />}
        >
          {(items) => <TaskGroups tasks={items} now={systemClock.now()} onError={onError} />}
        </QueryState>
      )}
    </Frame>
  );
}

function PlantTasks({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const query = usePlantTasks(plantId);
  const materialize = useMaterializeTasks();
  return (
    <Frame title={t('tasks.plantTitle')}>
      {(onError) => (
        <>
          <Button variant="tertiary" busy={materialize.isPending} onClick={() => materialize.mutate(plantId)} className="mb-4">
            <Icon name="autorenew" />
            {t('tasks.refreshSeason')}
          </Button>
          {materialize.isError && (
            <p role="alert" className="mb-4 font-body text-sm text-error">
              {messageFor(materialize.error)}
            </p>
          )}
          <QueryState
            query={{ ...query, data: query.data?.items }}
            empty={(items: Task[]) => items.every((x) => x.status !== 'PENDING')}
            emptyView={<EmptyState title={t('tasks.emptyTitle')} body={t('tasks.emptyPlantBody')} />}
          >
            {(items) => <TaskGroups tasks={items} now={systemClock.now()} showPlant={false} onError={onError} />}
          </QueryState>
        </>
      )}
    </Frame>
  );
}

function Frame({ title, children }: { title: string; children: (onError: (err: unknown) => void) => ReactNode }) {
  const [problem, setProblem] = useState<unknown>(null);
  const onError = (err: unknown) => setProblem(err);
  return (
    <Screen>
      <TopBar title={title} />
      <main className="px-6 pb-16 pt-6">
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
