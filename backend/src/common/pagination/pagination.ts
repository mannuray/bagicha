export interface PageQuery {
  page: number;
  page_size: number;
}

export interface PageMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/** The list shape TransformInterceptor unwraps into `data` + `pagination`. */
export interface Page<T> {
  items: T[];
  pagination: PageMeta;
}

export function toSkipTake(q: PageQuery): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.page_size, take: q.page_size };
}

export function toPage<T>(items: T[], total: number, q: PageQuery): Page<T> {
  return {
    items,
    pagination: {
      page: q.page,
      page_size: q.page_size,
      total_items: total,
      total_pages: Math.ceil(total / q.page_size),
      has_next: q.page * q.page_size < total,
      has_previous: q.page > 1,
    },
  };
}

/** The same page with each item mapped (e.g. to its response view). */
export function mapPage<T, U>(page: Page<T>, map: (item: T) => U): Page<U> {
  return { items: page.items.map(map), pagination: page.pagination };
}
