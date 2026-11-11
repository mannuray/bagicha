import { describe, expect, it } from 'vitest';
import { toE164India } from './api';

describe('toE164India', () => {
  it('accepts a 10-digit mobile with or without +91, 91 or a leading 0', () => {
    expect(toE164India('9876543210')).toBe('+919876543210');
    expect(toE164India('+91 98765 43210')).toBe('+919876543210');
    expect(toE164India('919876543210')).toBe('+919876543210');
    expect(toE164India('09876543210')).toBe('+919876543210');
  });
  it('refuses landlines, short numbers and junk', () => {
    expect(toE164India('5876543210')).toBeNull();
    expect(toE164India('98765')).toBeNull();
    expect(toE164India('abc')).toBeNull();
  });
});
