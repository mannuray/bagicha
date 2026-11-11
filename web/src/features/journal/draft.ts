import { localKeyValueStore, type KeyValueStore } from '../../lib/storage';

export interface MomentDraft {
  type: string;
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
    return raw ? (JSON.parse(raw) as MomentDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(plantId: string, storage: KeyValueStore = localKeyValueStore): void {
  storage.remove(key(plantId));
}
