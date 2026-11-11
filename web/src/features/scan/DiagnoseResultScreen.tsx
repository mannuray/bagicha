import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { Icon, Surface } from '../../ui';
import { TaskCard, usePlantTasks } from '../tasks';
import { ResultFrame } from './ResultFrame';
import { useDiagnoseResult } from './useScanResult';
import { useNow } from '../../lib/clock';

export function DiagnoseResultScreen() {
  const now = useNow();
  const { t } = useTranslation();
  const { scan, ...diagnose } = useDiagnoseResult();
  if (!scan) return <Navigate to="/scan" replace />;

  const result = diagnose.data;
  return (
    <ResultFrame title={t('scan.diagnoseTitle')} previewUrl={scan.previewUrl} pending={diagnose.pending} error={diagnose.error} onRetry={diagnose.retry}>
      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              {t('scan.severity', { level: t(`scan.levels.${result.diagnosis.severity}`, { defaultValue: result.diagnosis.severity }) })}
            </p>
            <h2 className="font-headline text-2xl text-primary">
              {t(`scan.issues.${result.diagnosis.primary_issue}`, { defaultValue: result.diagnosis.primary_issue })}
            </h2>
          </div>
          <Surface className="p-4 font-body text-base text-on-surface">{result.diagnosis.reasoning_summary}</Surface>
          {result.diagnosis.recommended_actions.length > 0 && (
            <Surface className="p-4">
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
              {result.task_id && <FollowUp plantId={scan.plantId} taskId={result.task_id} now={now} />}
            </>
          )}
        </div>
      )}
    </ResultFrame>
  );
}

function FollowUp({ plantId, taskId, now }: { plantId: string; taskId: string; now: Date }) {
  const tasks = usePlantTasks(plantId);
  const task = tasks.data?.items.find((x) => x.id === taskId);
  return task ? <TaskCard task={task} now={now} showPlant={false} /> : null;
}
