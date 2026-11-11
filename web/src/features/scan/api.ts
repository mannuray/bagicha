import { useApi } from '../../lib/api';
import { staleAfter, useInvalidate } from '../../lib/stale';
import { diagnoseResponseSchema, identifySchema } from './schemas';

export { diagnoseResponseSchema, diagnosisSchema, identifySchema } from './schemas';
export type { DiagnoseResponse, Identification } from './schemas';

export interface ScanPayload {
  image_base64: string;
  plant_id?: string;
  note?: string;
}

/**
 * The two vision calls as plain functions; the result screens own when they run.
 * A diagnosis can add tasks and journal entries, so it refreshes those views.
 */
export function useVisionApi() {
  const api = useApi();
  const invalidate = useInvalidate();
  return {
    identify: (req: ScanPayload) => api.send('POST', '/vision/identify', { image_base64: req.image_base64 }, identifySchema),
    diagnose: async (req: ScanPayload) => {
      const res = await api.send('POST', '/vision/diagnose', req, diagnoseResponseSchema);
      if (req.plant_id) invalidate(staleAfter.diagnosis(req.plant_id));
      return res;
    },
  };
}
