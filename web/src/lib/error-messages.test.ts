import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';
import { messageFor } from './error-messages';
import i18n from './i18n';

const t = i18n.t.bind(i18n);

describe('messageFor', () => {
  it('uses a specific message for known backend codes', () => {
    expect(messageFor(new ApiError(429, 'RATE_LIMITED', 'x'), t)).toMatch(/too many/i);
    expect(messageFor(new ApiError(404, 'PLANT_NOT_FOUND', 'x'), t)).toMatch(/isn't in your garden/i);
  });

  it('falls back to a generic message for unknown codes and non-API errors', () => {
    const generic = messageFor(new ApiError(500, 'SOMETHING_NEW', 'x'), t);
    expect(generic).toMatch(/something went wrong/i);
    expect(messageFor('boom', t)).toBe(generic);
  });
});

describe('old tree since-year', () => {
  it('has its own message', () => {
    expect(messageFor(new ApiError(422, 'BEARING_SINCE_YEAR_INVALID', 'x'), t)).toMatch(/planted.*this year/i);
  });
});

describe('the translator is injected', () => {
  it('uses the one it is given', () => {
    const fake = ((key: string, opts?: { defaultValue?: string }) => (key === 'errors.RATE_LIMITED' ? 'slow down' : opts?.defaultValue ?? `[${key}]`)) as unknown as typeof t;
    expect(messageFor(new ApiError(429, 'RATE_LIMITED', 'x'), fake)).toBe('slow down');
    expect(messageFor('boom', fake)).toBe('[errors.generic]');
  });
});
