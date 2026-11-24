import { istMonth, istYear } from '../../../common/time';

/**
 * The fruiting cycle an event belongs to. A cycle is named after the IST
 * calendar year in which it started (e.g. mango cycles start in November);
 * the start month comes from the catalogue (`Catalogue.cycleStartMonth`).
 */
export function resolveCycleYear(startMonth: number, eventAt: Date): number {
  const month = istMonth(eventAt);
  const year = istYear(eventAt);
  return month >= startMonth ? year : year - 1;
}
