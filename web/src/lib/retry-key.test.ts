import { describe, expect, it } from 'vitest';
import { createRetryKey } from './retry-key';

describe('retry key', () => {
  it('keeps one key while the same thing is sent again', () => {
    const k = createRetryKey();
    const a = k.keyFor({ type: 'NOTE', content: 'x' });
    expect(k.keyFor({ type: 'NOTE', content: 'x' })).toBe(a);
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('starts a new key when what is sent changes', () => {
    const k = createRetryKey();
    const a = k.keyFor({ content: 'x' });
    expect(k.keyFor({ content: 'y' })).not.toBe(a);
  });

  it('starts a new key after a save went through', () => {
    const k = createRetryKey();
    const a = k.keyFor({ content: 'x' });
    k.done();
    expect(k.keyFor({ content: 'x' })).not.toBe(a);
  });
});
