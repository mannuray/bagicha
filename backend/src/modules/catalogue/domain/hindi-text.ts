import { z } from 'zod';

/** A Hindi text: non-empty and written in Devanagari. */
export const hindiText = z
  .string()
  .min(1)
  .regex(/[\u0900-\u097F]/, 'needs Devanagari');

/** Optional Hindi versions of some of a record's texts; no other keys. */
export const hindi = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).strict().optional();
