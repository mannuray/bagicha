import type { JournalEntry } from '../../journal';

export const humanize = (value: string) => value.replace(/_/g, ' ').toLowerCase();

export const photoKeyOf = (e: JournalEntry) => {
  const key = e.metadata?.photo_key;
  return typeof key === 'string' ? key : null;
};

const locale = (lang: string) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

export const shortDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export const monthYear = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(locale(lang), { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
