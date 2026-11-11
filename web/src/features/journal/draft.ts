import { localKeyValueStore, type KeyValueStore } from '../../lib/storage';
import { logTypeSchema, type LogType } from './log-types';

export interface MomentDraft {
  type: LogType;
  content: string;
  severity?: string;
  quantity?: string;
  unit?: string;
  quality?: string;
  date?: string;
}

const key = (plantId: string) => `bagicha.draft.moment.${plantId}`;

/** Typed text survives a session expiry or a reload (photos are not kept). */
export function saveDraft(plantId: string, draft: MomentDraft, storage: KeyValueStore = localKeyValueStore): void {
  storage.set(key(plantId), JSON.stringify(draft));
}

export function loadDraft(plantId: string, storage: KeyValueStore = localKeyValueStore): MomentDraft | null {
  try {
    const raw = storage.get(key(plantId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as MomentDraft;
    // A draft saved by an older app, or tampered with, must not reach the form.
    return logTypeSchema.safeParse(draft?.type).success && typeof draft.content === 'string' ? draft : null;
  } catch {
    return null;
  }
}

export function clearDraft(plantId: string, storage: KeyValueStore = localKeyValueStore): void {
  storage.remove(key(plantId));
}
