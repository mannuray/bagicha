import type { KeyValueStore } from '../../lib/storage';
import { z } from 'zod';
import { DROP_SEVERITIES, HARVEST_QUALITIES, HARVEST_UNITS, logTypeSchema } from './log-types';

/** What Log a moment keeps between visits; checked field by field when read back. */
const draftCore = z.object({ type: logTypeSchema, content: z.string() });
const draftOptional = {
  severity: z.enum(DROP_SEVERITIES),
  quantity: z.string(),
  unit: z.enum(HARVEST_UNITS),
  quality: z.enum(HARVEST_QUALITIES),
  date: z.string(),
};
export type MomentDraft = z.infer<typeof draftCore> & Partial<{ [K in keyof typeof draftOptional]: z.infer<(typeof draftOptional)[K]> }>;

/** The type and note must be valid; a bad optional field is dropped, not the whole draft. */
function parseDraft(raw: unknown): MomentDraft | null {
  const core = draftCore.safeParse(raw);
  if (!core.success) return null;
  const draft: MomentDraft = { ...core.data };
  const fields = raw as Record<string, unknown>;
  for (const key of Object.keys(draftOptional) as Array<keyof typeof draftOptional>) {
    const parsed = draftOptional[key].safeParse(fields[key]);
    if (parsed.success) Object.assign(draft, { [key]: parsed.data });
  }
  return draft;
}

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
    return parseDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearDraft(plantId: string, storage: KeyValueStore): void {
  storage.remove(key(plantId));
}
