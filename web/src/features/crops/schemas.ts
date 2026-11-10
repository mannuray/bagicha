import { z } from 'zod';

export const cropItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  family: z.string(),
  method: z.enum(['NURSERY_TRANSPLANT', 'DIRECT_SOW', 'TUBER', 'CLOVE', 'RHIZOME']),
  tags: z.array(z.enum(['container', 'beginner', 'quick'])),
  days_to_first_harvest: z.tuple([z.number(), z.number()]),
  guide: z.object({ plants_for_family_of_4: z.string(), container: z.string(), spacing_cm: z.tuple([z.number(), z.number()]) }),
  status: z.enum(['open', 'soon', 'later', 'none']),
  opens_in_days: z.number().nullable(),
  next_month: z.number().nullable(),
  window_label: z.string().nullable(),
});
export type CropItem = z.infer<typeof cropItemSchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['BED', 'GROW_BAG', 'POT', 'CONTAINER', 'GROUND']),
  archived_at: z.string().nullable(),
});
export type Place = z.infer<typeof placeSchema>;

export const rotationSchema = z.object({
  conflict: z.boolean(),
  last: z.object({ crop_id: z.string(), crop_name: z.string(), family: z.string(), season_label: z.string() }).nullable(),
});
export type Rotation = z.infer<typeof rotationSchema>;
