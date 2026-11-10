import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
import { toPage, toSkipTake } from './pagination';

describe('toPage', () => {
  it('builds pagination metadata for a middle page', () => {
    const page = toPage(['a', 'b'], 45, { page: 2, page_size: 20 });
    expect(page.items).toEqual(['a', 'b']);
    expect(page.pagination).toEqual({
      page: 2,
      page_size: 20,
      total_items: 45,
      total_pages: 3,
      has_next: true,
      has_previous: true,
    });
  });

  it('handles an empty result', () => {
    expect(toPage([], 0, { page: 1, page_size: 20 }).pagination).toMatchObject({
      total_pages: 0,
      has_next: false,
      has_previous: false,
    });
  });
});

describe('toSkipTake', () => {
  it('converts page/page_size to skip/take', () => {
    expect(toSkipTake({ page: 3, page_size: 10 })).toEqual({
      skip: 20,
      take: 10,
    });
  });
});

describe('PaginationQueryDto', () => {
  const check = (raw: Record<string, unknown>) => {
    const dto = plainToInstance(PaginationQueryDto, raw);
    return { dto, errors: validateSync(dto) };
  };

  it('defaults to page 1, size 20', () => {
    const { dto, errors } = check({});
    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject({ page: 1, page_size: 20 });
  });

  it('coerces numeric strings', () => {
    expect(check({ page: '2', page_size: '50' }).dto).toMatchObject({
      page: 2,
      page_size: 50,
    });
  });

  it.each([
    [{ page: '0' }],
    [{ page: '-3' }],
    [{ page: 'abc' }],
    [{ page_size: '10000' }],
    [{ page_size: '0' }],
    [{ page: '1e20' }],
    [{ page: '10001' }],
  ])('rejects %p', (raw) => {
    expect(check(raw).errors.length).toBeGreaterThan(0);
  });
});
