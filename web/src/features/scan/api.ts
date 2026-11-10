import { z } from 'zod';
import { useApi } from '../../lib/api';

export const identifySchema = z
  .object({
    common_name: z.string().optional(),
    scientific_name: z.string().optional(),
    description: z.string().optional(),
    care_summary: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough();
export type Identification = z.infer<typeof identifySchema>;

export const diagnosisSchema = z.object({
  primary_issue: z.string(),
  severity: z.string(),
  confidence: z.string().optional(),
  reasoning_summary: z.string(),
  recommended_actions: z.array(z.string()),
  symptoms: z.array(z.string()),
  follow_up_days: z.number().optional(),
});

export const diagnoseResponseSchema = z.object({
  diagnosis: diagnosisSchema,
  persisted: z.boolean(),
  session_id: z.string().optional(),
  outcome_id: z.string().optional(),
  log_ids: z.array(z.string()).optional(),
  task_id: z.string().nullable().optional(),
});
export type DiagnoseResponse = z.infer<typeof diagnoseResponseSchema>;

export interface ScanPayload {
  image_base64: string;
  plant_id?: string;
  note?: string;
}

/** The two vision calls as plain functions; the result screens own when they run. */
export function useVisionApi() {
  const api = useApi();
  return {
    identify: (req: ScanPayload) => api.send('POST', '/vision/identify', { image_base64: req.image_base64 }, identifySchema),
    diagnose: (req: ScanPayload) => api.send('POST', '/vision/diagnose', req, diagnoseResponseSchema),
  };
}
