import { describe, expect, it } from 'vitest';
import { loginState, otpState } from './nav-state';

describe('navigation state is checked, not trusted', () => {
  it('login reads only a string reason', () => {
    expect(loginState({ reason: 'expired' })).toEqual({ reason: 'expired' });
    expect(loginState({ reason: 42 })).toEqual({});
    expect(loginState(null)).toEqual({});
  });

  it('the code screen needs a phone; the test code is optional', () => {
    expect(otpState({ phone: '+919000000001', devOtp: '123456' })).toEqual({ phone: '+919000000001', devOtp: '123456' });
    expect(otpState({ phone: '+919000000001' })).toEqual({ phone: '+919000000001' });
    expect(otpState({ devOtp: '1' })).toBeNull();
    expect(otpState('junk')).toBeNull();
  });
});
