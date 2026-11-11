import { istDayDiff } from '../../lib/ist';

/** Journal entries that record a diagnosis (a disease scan or a pest one). */
const DIAGNOSIS_TYPES = new Set(['DIAGNOSIS', 'PEST_DIAGNOSIS']);

export const isDiagnosis = (entry: { type: string }) => DIAGNOSIS_TYPES.has(entry.type);

/** Whether an entry falls within the last `days` India calendar days. */
export const withinIstDays = (entry: { timestamp: string }, days: number, now: Date) =>
  -istDayDiff(now, new Date(entry.timestamp)) <= days;
