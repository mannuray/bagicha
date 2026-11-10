import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';
import { messageFor } from './error-messages';

describe('messageFor', () => {
  it('uses a specific message for known backend codes', () => {
    expect(messageFor(new ApiError(429, 'RATE_LIMITED', 'x'))).toMatch(/too many/i);
    expect(messageFor(new ApiError(404, 'PLANT_NOT_FOUND', 'x'))).toMatch(/isn't in your garden/i);
  });

  it('falls back to a generic message for unknown codes and non-API errors', () => {
    const generic = messageFor(new ApiError(500, 'SOMETHING_NEW', 'x'));
    expect(generic).toMatch(/something went wrong/i);
    expect(messageFor('boom')).toBe(generic);
  });
});
