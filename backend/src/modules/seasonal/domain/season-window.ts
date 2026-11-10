import { SeasonWindow } from '@prisma/client';
import { istMonth } from '../../../common/time';

/** Indian growing season for an instant, by IST calendar month. */
export function resolveSeasonWindow(now: Date): SeasonWindow {
  const month = istMonth(now);
  if (month === 1 || month === 2) return SeasonWindow.LATE_WINTER;
  if (month === 3 || month === 4) return SeasonWindow.SPRING;
  if (month === 5 || month === 6) return SeasonWindow.SUMMER;
  if (month >= 7 && month <= 9) return SeasonWindow.MONSOON;
  return SeasonWindow.POST_MONSOON;
}
