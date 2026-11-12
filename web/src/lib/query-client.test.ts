import { describe, expect, it } from 'vitest';
import { createQueryClient } from './query-client';

describe('query client', () => {
  it('keeps data fresh for two minutes: the user\'s own changes invalidate it sooner', () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(2 * 60_000);
  });
});
