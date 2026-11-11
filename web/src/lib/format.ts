/** Date formats for the app's languages, always in India time. */
const locale = (lang: string) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

export const shortDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export const monthYear = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(locale(lang), { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** "November", the month name in India for an instant. */
export const monthName = (at: Date, lang: string) =>
  at.toLocaleString(locale(lang), { month: 'long', timeZone: 'Asia/Kolkata' });

/** The hour of day (0–23) in India, for greetings. */
export const istHour = (at: Date): number =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(at));

/** "Mar", a short month name in India time. */
export const monthShort = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(locale(lang), { month: 'short', timeZone: 'Asia/Kolkata' });
