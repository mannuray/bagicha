import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';
import { reportError } from '../../lib/report-error';
import { useSessionStore } from '../auth';

/**
 * Requests this season's tasks once per plant per session (idempotent on the
 * server), then refreshes the task list. Returns true once every call settled.
 */
export function useSessionMaterialize(plantIds: string[] | undefined): boolean {
  const api = useApi();
  const client = useQueryClient();
  const { materialized } = useSessionStore();
  const key = plantIds?.join(',') ?? '';
  const [settledKey, setSettledKey] = useState<string | null>(null);

  useEffect(() => {
    if (plantIds === undefined) return;
    const pending = plantIds.filter((id) => !materialized.has(id));
    pending.forEach((id) => materialized.add(id));
    if (pending.length === 0) {
      setSettledKey(key);
      return;
    }
    let cancelled = false;
    void Promise.allSettled(
      pending.map((id) =>
        api.send('POST', `/seasonal/plant/${id}/materialize-tasks`, {}, z.unknown()).catch((err: unknown) => {
          materialized.delete(id);
          reportError(err, { plantId: id, step: 'materialize' });
        }),
      ),
    ).then(() => {
      void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
      if (!cancelled) setSettledKey(key);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for plantIds
  }, [key, api, client, materialized]);

  return plantIds !== undefined && settledKey === key;
}
