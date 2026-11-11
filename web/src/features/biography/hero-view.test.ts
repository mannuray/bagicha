import { describe, expect, it } from 'vitest';
import { heroPhoto, ageUntil } from './hero-view';

describe('the plant hero', () => {
  const tree = { record_kind: 'TREE' as const, crop_id: null };
  it('shows the plant\'s own photo; the stock tree only for a tree without one (or whose photo failed)', () => {
    expect(heroPhoto(tree, { url: 'own.jpg', key: 'k', failed: false })).toEqual({ kind: 'own', url: 'own.jpg' });
    expect(heroPhoto(tree, { url: null, key: null, failed: false })).toEqual({ kind: 'stock' });
    expect(heroPhoto(tree, { url: null, key: 'k', failed: true })).toEqual({ kind: 'stock' });
    // Still loading its own photo: nothing yet, never a flash of the stock one.
    expect(heroPhoto(tree, { url: null, key: 'k', failed: false })).toEqual({ kind: 'none' });
    expect(heroPhoto({ record_kind: 'FLOWER', crop_id: null }, { url: null, key: null, failed: false })).toEqual({ kind: 'none' });
  });

  it('an ended plant\'s age stops at its end', () => {
    const now = new Date('2026-11-12T00:00:00Z');
    expect(ageUntil({ ended_at: null }, now)).toBe(now);
    expect(ageUntil({ ended_at: '2025-05-01T00:00:00Z' }, now)).toEqual(new Date('2025-05-01T00:00:00Z'));
  });
});
