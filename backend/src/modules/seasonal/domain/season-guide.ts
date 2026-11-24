import type { Lang } from '../../../common/http/lang';
import { istMonth } from '../../../common/time';
import type { SeasonMonth } from '../../catalogue';

/**
 * This month's home season tips from a region's twelve months (the month as
 * seen in India), in Hindi where it is written and English otherwise.
 */
export function monthOf(
  months: SeasonMonth[],
  now: Date,
  lang: Lang = 'en',
): Omit<SeasonMonth, 'hi'> {
  const { hi, ...month } = months[istMonth(now) - 1];
  if (lang !== 'hi' || !hi) return month;
  return {
    season: hi.season ?? month.season,
    headline: hi.headline ?? month.headline,
    points: hi.points ?? month.points,
  };
}
