import { istMonth, istYear } from '../../../common/time';
import { speciesConfigFor } from './species-config';

/**
 * The fruiting cycle an event belongs to. A cycle is named after the IST
 * calendar year in which it started (e.g. mango cycles start in November).
 */
export function resolveCycleYear(speciesFamily: string, eventAt: Date): number {
  const month = istMonth(eventAt);
  const year = istYear(eventAt);
  const start = speciesConfigFor(speciesFamily).cycleStartMonth;
  return month >= start ? year : year - 1;
}
