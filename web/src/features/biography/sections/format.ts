import type { JournalEntry } from '../../journal';

export const humanize = (value: string) => value.replace(/_/g, ' ').toLowerCase();

export const photoKeyOf = (e: JournalEntry) => {
  const key = e.metadata?.photo_key;
  return typeof key === 'string' ? key : null;
};

export { monthYear, shortDate } from '../../../lib/format';
