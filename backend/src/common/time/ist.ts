const IST_PARTS = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'numeric',
});

function istPart(date: Date, type: 'year' | 'month'): number {
  const part = IST_PARTS.formatToParts(date).find((p) => p.type === type);
  return Number(part?.value);
}

/** Calendar month (1–12) of `date` as seen in India. */
export function istMonth(date: Date): number {
  return istPart(date, 'month');
}

/** Calendar year of `date` as seen in India. */
export function istYear(date: Date): number {
  return istPart(date, 'year');
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Calendar months in UTC (day-of-month overflow rolls forward, like Date#setMonth). */
export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
