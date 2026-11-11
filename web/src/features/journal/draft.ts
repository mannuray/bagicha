import type { KeyValueStore } from '../../lib/storage';
import { z } from 'zod';
import { DROP_SEVERITIES, HARVEST_QUALITIES, HARVEST_UNITS, logTypeSchema } from './log-types';

/** What Log a moment keeps between visits; checked field by field when read back. */
const momentDraftSchema = z.object({
  type: logTypeSchema,
  content: z.string(),
  severity: z.enum(DROP_SEVERITIES).optional(),
  quantity: z.string().optional(),
  unit: z.enum(HARVEST_UNITS).optional(),
  quality: z.enum(HARVEST_QUALITIES).optional(),
  date: z.string().optional(),
});
export type MomentDraft = z.infer<typeof momentDraftSchema>;

const key = (plantId: string) => `bagicha.draft.moment.${plantId}`;

/** Typed text survives a session expiry or a reload (photos are not kept). */
export function saveDraft(plantId: string, draft: MomentDraft, storage: KeyValueStore): void {
  storage.set(key(plantId), JSON.stringify(draft));
}

export function loadDraft(plantId: string, storage: KeyValueStore): MomentDraft | null {
  try {
    const raw = storage.get(key(plantId));
    if (!raw) return null;
    // A draft saved by an older app, or tampered with, must not reach the form.
    const parsed = momentDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearDraft(plantId: string, storage: KeyValueStore): void {
  storage.remove(key(plantId));
}
