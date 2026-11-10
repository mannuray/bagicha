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
export function saveDraft(plantId: string, draft: MomentDraft): void {
  try {
    localStorage.setItem(key(plantId), JSON.stringify(draft));
  } catch {
    // Storage unavailable: the draft lives only in the form.
  }
}

export function loadDraft(plantId: string): MomentDraft | null {
  try {
    const raw = localStorage.getItem(key(plantId));
    return raw ? (JSON.parse(raw) as MomentDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(plantId: string): void {
  try {
    localStorage.removeItem(key(plantId));
  } catch {
    // Nothing to clear.
  }
}
