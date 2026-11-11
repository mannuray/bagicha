import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../lib/api';
import { useSessionOnce } from '../../lib/session-once';
import { materializeTasks } from './api';
import { invalidate, staleAfter } from '../../lib/stale';
import { useReport } from '../../lib/reporter';

export interface MaterializeState {
  /** Every request for the current plant set has finished. */
  settled: boolean;
  /** The last error, when at least one plant's season check failed. */
  error: unknown;
  /** Re-asks for the plants that failed. */
  retry: () => void;
}

/**
 * Requests this season's tasks once per plant per session (idempotent on the
 * server), then refreshes the task list.
 */
export function useSeasonTasksOnce(plantIds: string[] | undefined): MaterializeState {
  const api = useApi();
  const client = useQueryClient();
  const materialized = useSessionOnce();
  const report = useReport();
  // "Not loaded" and "no plants" must differ, or an empty garden never settles.
  const key = plantIds === undefined ? 'loading' : `[${plantIds.join(',')}]`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; error: unknown } | null>(null);
  const runKey = `${key}#${attempt}`;

  useEffect(() => {
    if (plantIds === undefined) return;
    const pending = plantIds.filter((id) => !materialized.has(id));
    pending.forEach((id) => materialized.add(id));
    if (pending.length === 0) {
      setResult((prev) => (prev?.key === runKey ? prev : { key: runKey, error: null }));
      return;
    }
    let cancelled = false;
    let failure: unknown = null;
    void Promise.allSettled(
      pending.map((id) =>
        materializeTasks(api, id).catch((err: unknown) => {
          materialized.delete(id);
          failure = err;
          report(err, { plantId: id, step: 'materialize' });
        }),
      ),
    ).then(() => {
      invalidate(client, staleAfter.taskChange(null));
      if (!cancelled) setResult({ key: runKey, error: failure });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `runKey` stands for plantIds + attempt
  }, [runKey, api, client, materialized]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const done = plantIds !== undefined && result?.key === runKey;
  return { settled: done, error: done ? result.error : null, retry };
}
