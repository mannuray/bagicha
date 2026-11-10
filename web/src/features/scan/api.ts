import { useMutation } from '@tanstack/react-query';
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

export interface ScanRequest {
  image_base64: string;
  plant_id?: string;
  note?: string;
}

export function useIdentify() {
  const api = useApi();
  return useMutation({
    mutationFn: (req: ScanRequest) => api.send('POST', '/vision/identify', { image_base64: req.image_base64 }, identifySchema),
  });
}

export function useDiagnose() {
  const api = useApi();
  return useMutation({
    mutationFn: (req: ScanRequest) => api.send('POST', '/vision/diagnose', req, diagnoseResponseSchema),
  });
}
