/** Reminder slots and the times they can be set to; the same ranges the server accepts. */
export const SLOTS = {
  morning: { field: 'reminder_morning_min', min: 360, max: 705 },
  evening: { field: 'reminder_evening_min', min: 900, max: 1305 },
} as const;
export type Slot = keyof typeof SLOTS;

const STEP = 15;

export function slotMinutes(slot: Slot): number[] {
  const { min, max } = SLOTS[slot];
  const out: number[] = [];
  for (let m = min; m <= max; m += STEP) out.push(m);
  return out;
}

/** "7:30 am" (or its Hindi form) for minutes after midnight. */
export function timeLabel(minutes: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2026, 0, 1, 0, minutes)));
}
