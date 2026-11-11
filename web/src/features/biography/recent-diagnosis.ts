import type { JournalEntry } from '../journal';
import { isDiagnosis, withinIstDays } from './diagnosis';
const LINK_WINDOW_DAYS = 90;

/** The newest diagnosis in the last 90 days (entries are newest first): the likely story behind a loss. */
export function recentDiagnosis(entries: JournalEntry[], now: Date): JournalEntry | null {
  return entries.find((e) => isDiagnosis(e) && withinIstDays(e, LINK_WINDOW_DAYS, now)) ?? null;
}
