import { istMonth } from '../../../common/time';
import type { SeasonMonth } from '../../catalogue';

/** This month's home season tips from a region's twelve months (the month as seen in India). */
export function monthOf(months: SeasonMonth[], now: Date): SeasonMonth {
  return months[istMonth(now) - 1];
}
