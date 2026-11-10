import type { z } from 'zod';
import type { ApiClient } from './api-client';

/** The backend's largest page (MAX_PAGE_SIZE). */
export const FULL_PAGE = 100;
/** Stops a misbehaving server from looping us forever (100 × 100 items). */
const MAX_PAGES = 100;

/** Follows the backend's paging until has_next is false and returns every item. */
export async function fetchAllPages<T>(
  api: ApiClient,
  path: string,
  item: z.ZodType<T>,
  query: Record<string, string | number> = {},
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await api.getPage(path, item, { ...query, page, page_size: FULL_PAGE });
    items.push(...res.items);
    if (!res.pagination.has_next) break;
  }
  return items;
}
