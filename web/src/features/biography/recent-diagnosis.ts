import { istDayDiff } from '../../lib/ist';
import type { JournalEntry } from '../journal';

const DIAGNOSIS_TYPES = new Set(['DIAGNOSIS', 'PEST_DIAGNOSIS']);
const LINK_WINDOW_DAYS = 90;

/** The newest diagnosis in the last 90 days (entries are newest first): the likely story behind a loss. */
export function recentDiagnosis(entries: JournalEntry[], now: Date): JournalEntry | null {
  return entries.find((e) => DIAGNOSIS_TYPES.has(e.type) && -istDayDiff(now, new Date(e.timestamp)) <= LINK_WINDOW_DAYS) ?? null;
}
