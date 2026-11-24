import type { TFunction } from 'i18next';
import type { JournalEntry } from '../../journal';

export const humanize = (value: string) => value.replace(/_/g, ' ').toLowerCase();

const DRYNESS = '_with_dryness_attention';

/**
 * A season phase's name in the app's language: the care data sends a key
 * ("fruit_development"); a key with no string is humanised as before.
 */
export function phaseLabel(t: TFunction, key: string): string {
  if (key.endsWith(DRYNESS))
    return t('biography.phase.withDryness', { phase: phaseLabel(t, key.slice(0, -DRYNESS.length)) });
  return t(`biography.phase.${key}`, { defaultValue: humanize(key) });
}

export const photoKeyOf = (e: JournalEntry) => {
  const key = e.metadata?.photo_key;
  return typeof key === 'string' ? key : null;
};

export { monthYear, shortDate } from '../../../lib/format';
