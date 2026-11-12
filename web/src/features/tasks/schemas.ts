import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED', 'CANCELLED']),
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
  /** How to do a tree-care reminder; absent on other tasks (and from older servers). */
  care_how: z
    .object({
      organic: z.string(),
      chemical: z.string().nullable(),
      why: z.string(),
      amount: z.string().nullable(),
      window_end: z.string().nullable(),
    })
    .nullish()
    .transform((v) => v ?? null),
});
export type Task = z.infer<typeof taskSchema>;

