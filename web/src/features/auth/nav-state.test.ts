import { describe, expect, it } from 'vitest';
import { loginState } from './nav-state';

describe('navigation state is checked, not trusted', () => {
  it('login reads only a string reason', () => {
    expect(loginState({ reason: 'expired' })).toEqual({ reason: 'expired' });
    expect(loginState({ reason: 42 })).toEqual({});
    expect(loginState(null)).toEqual({});
  });
});
