import { istNoonIso } from '../../lib/ist';
import type { EndPlantInput, PlantEndReason } from '../plants';

export interface EndForm {
  reason: PlantEndReason;
  /** "YYYY-MM-DD" from the date input, or blank. */
  date: string;
  note: string;
  /** Keep the recent diagnosis linked as the cause. */
  linked: boolean;
}

/**
 * What "mark as ended" sends: today (or blank) means "now" on the server; an
 * earlier day is pinned to its IST noon; the diagnosis only while it stays linked.
 */
export function toEndPayload(form: EndForm, today: string, diagnosis: { id: string } | null): EndPlantInput {
  return {
    reason: form.reason,
    ...(form.date && form.date !== today ? { ended_at: istNoonIso(form.date) } : {}),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
    ...(diagnosis && form.linked ? { entry_id: diagnosis.id } : {}),
  };
}
