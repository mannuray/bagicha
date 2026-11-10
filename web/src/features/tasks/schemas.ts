import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED']),
  source: z.string(),
  reason: z.string().nullable(),
  due_date: z.string(),
  completed_at: z.string().nullable(),
  plant_id: z.string().nullable(),
  tree_name: z.string().nullable(),
  record_kind: z.string().nullable(),
  plant_cycle_id: z.string().nullable(),
  cycle_year: z.number().nullable(),
  source_summary: z.string().nullable(),
});
export type Task = z.infer<typeof taskSchema>;

export const materializeSchema = z.object({
  results: z.array(z.object({ sourceKey: z.string(), status: z.string(), taskId: z.string().optional() })),
  created_count: z.number(),
});
