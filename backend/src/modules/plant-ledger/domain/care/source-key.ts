import type { RegionCluster } from '@prisma/client';
import {
  kindCare,
  type Catalogue,
  type FamilyCare,
  type TreeCareItem,
} from '../../../catalogue';
import { resolveRegionCare } from './region-care';

/** Where a reminder's window starts: days after planting, or a calendar day. */
type Start = { days: number } | { month: number; day: number };

/**
 * A tree-care reminder's task key (`family:key:YYYY-MM-DD` or
 * `family:key:d<days>`), read from the right: a citrus kind adds a colon to
 * the family (`citrus:lime`). Null for any other kind of key.
 */
export function parseCareKey(
  sourceKey: string,
): { family: string; key: string; start: Start } | null {
  const parts = sourceKey.split(':');
  if (parts.length < 3) return null;
  const last = parts[parts.length - 1];
  const key = parts[parts.length - 2];
  const family = parts.slice(0, -2).join(':');
  const days = /^d(\d+)$/.exec(last);
  const date = /^\d{4}-(\d{2})-(\d{2})$/.exec(last);
  if (!days && !date) return null;
  return {
    family,
    key,
    start: days
      ? { days: Number(days[1]) }
      : { month: Number(date![1]), day: Number(date![2]) },
  };
}

/** A family's care, or one of its kinds' (`citrus:lime`) as the engine sees it. */
function careOfFamily(
  catalogue: Pick<Catalogue, 'treeCare'>,
  family: string,
): FamilyCare | null {
  const [base, kindKey] = family.split(':');
  const care = catalogue.treeCare(base);
  if (!care) return null;
  // A family split by kind has no care of its own: only a kind key finds one.
  if (!kindKey) return care.kinds ? null : care;
  const kind = care.kinds?.find((k) => k.key === kindKey);
  return kind ? kindCare(care, kind) : null;
}

/**
 * The care item a saved reminder came from, in the gardener's region (keys
 * repeat across regions with different doses). Null when it no longer exists.
 */
export function careItemForKey(
  catalogue: Pick<Catalogue, 'treeCare'>,
  sourceKey: string,
  region: RegionCluster,
): TreeCareItem | null {
  const parsed = parseCareKey(sourceKey);
  if (!parsed) return null;
  const care = careOfFamily(catalogue, parsed.family);
  const resolved = care && resolveRegionCare(care, region);
  if (!resolved) return null;
  const starts = (item: TreeCareItem) =>
    'days' in parsed.start
      ? item.when.kind === 'FROM_PLANTING' &&
        item.when.fromDays === parsed.start.days
      : item.when.kind === 'CALENDAR' &&
        item.when.from[0] === parsed.start.month &&
        (item.when.from[1] === parsed.start.day ||
          // Feb 29 is shown as Feb 28 in a normal year.
          (parsed.start.month === 2 &&
            item.when.from[1] === 29 &&
            parsed.start.day === 28));
  // A window edited since the reminder was saved: the item's other window shows.
  const sameKey = resolved.care.items.filter((i) => i.key === parsed.key);
  return sameKey.find(starts) ?? sameKey[0] ?? null;
}
