import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { queryKeys } from '../../lib/query-keys';
import { Icon, Surface } from '../../ui';
import { TaskCard, usePlantTasks } from '../tasks';
import { useDiagnose } from './api';
import { ResultFrame } from './ResultFrame';
import { useScanState } from './scan-state';
import { useRunOnce } from './use-run-once';

export function DiagnoseResultScreen() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { scan } = useScanState();
  const diagnose = useDiagnose();
  const send = () =>
    scan &&
    diagnose.mutate(
      { image_base64: scan.base64, plant_id: scan.plantId, ...(scan.note ? { note: scan.note } : {}) },
      {
        onSuccess: () => {
          if (!scan.plantId) return;
          for (const key of [queryKeys.plants.tasks(scan.plantId), queryKeys.plants.timelineAll(scan.plantId), queryKeys.tasks.mineAll]) {
            void client.invalidateQueries({ queryKey: key });
          }
        },
      },
    );
  useRunOnce(send);
  if (!scan || scan.mode !== 'diagnose') return <Navigate to="/scan" replace />;

  const result = diagnose.data;
  return (
    <ResultFrame title={t('scan.diagnoseTitle')} previewUrl={scan.previewUrl} pending={!result} error={diagnose.error} onRetry={send}>
      {result && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              {t('scan.severity', { level: t(`scan.levels.${result.diagnosis.severity}`, { defaultValue: result.diagnosis.severity }) })}
            </p>
            <h2 className="font-headline text-4xl text-primary">
              {t(`scan.issues.${result.diagnosis.primary_issue}`, { defaultValue: result.diagnosis.primary_issue })}
            </h2>
          </div>
          <Surface className="p-5 font-body text-base text-on-surface">{result.diagnosis.reasoning_summary}</Surface>
          {result.diagnosis.recommended_actions.length > 0 && (
            <Surface className="p-5">
              <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('scan.whatToDo')}</p>
              <ul className="space-y-1 font-body text-sm">
                {result.diagnosis.recommended_actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Surface>
          )}
          {result.persisted && scan.plantId && (
            <>
              <p className="flex items-center justify-center gap-2 font-body text-sm text-primary">
                <Icon name="check_circle" filled />
                {t('scan.savedTo', { name: scan.plantName ?? '' })}
              </p>
              {result.task_id && <FollowUp plantId={scan.plantId} taskId={result.task_id} />}
            </>
          )}
        </div>
      )}
    </ResultFrame>
  );
}

function FollowUp({ plantId, taskId }: { plantId: string; taskId: string }) {
  const tasks = usePlantTasks(plantId);
  const task = tasks.data?.items.find((x) => x.id === taskId);
  return task ? <TaskCard task={task} showPlant={false} /> : null;
}
