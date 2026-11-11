import { describe, expect, it } from 'vitest';
import { testUser } from '../../test/render';
import { isPremium } from './schemas';

const NOW = new Date('2026-11-12T00:00:00Z');

describe('isPremium', () => {
  it('is true only while premium has not expired', () => {
    expect(isPremium(testUser({ premium_expires_at: '2027-01-01T00:00:00Z' }), NOW)).toBe(true);
    expect(isPremium(testUser({ premium_expires_at: '2026-01-01T00:00:00Z' }), NOW)).toBe(false);
    expect(isPremium(testUser({ premium_expires_at: null }), NOW)).toBe(false);
  });
});
