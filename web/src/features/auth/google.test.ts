import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  initialize: vi.fn(() => Promise.resolve()),
  login: vi.fn(),
}));
vi.mock('@capgo/capacitor-social-login', () => ({ SocialLogin: plugin }));

import { CANCELLED, nativeGoogle } from './google';

describe('Google sign-in on the phone', () => {
  beforeEach(() => {
    plugin.initialize.mockClear();
    plugin.login.mockReset();
  });

  it("native sign-in returns the plugin's ID token", async () => {
    plugin.login.mockResolvedValue({ provider: 'google', result: { responseType: 'online', idToken: 'phone-tok' } });
    await expect(nativeGoogle('web-client-id').signIn()).resolves.toBe('phone-tok');
    expect(plugin.login).toHaveBeenCalledWith({ provider: 'google', options: {} });
  });

  it('a dismissed account sheet returns cancelled', async () => {
    plugin.login.mockRejectedValue(Object.assign(new Error('Google Sign-In cancelled by user'), { code: 'USER_CANCELLED' }));
    await expect(nativeGoogle('web-client-id').signIn()).resolves.toBe(CANCELLED);
  });

  it('any other plugin failure is an error, not a silent cancel', async () => {
    plugin.login.mockRejectedValue(new Error('Developer console is not set up correctly'));
    await expect(nativeGoogle('web-client-id').signIn()).rejects.toThrow(/developer console/i);
  });

  it('a sign-in with no ID token counts as cancelled', async () => {
    plugin.login.mockResolvedValue({ provider: 'google', result: { responseType: 'online', idToken: null } });
    await expect(nativeGoogle('web-client-id').signIn()).resolves.toBe(CANCELLED);
  });

  it('initialises once with the web client id', async () => {
    plugin.login.mockResolvedValue({ provider: 'google', result: { responseType: 'online', idToken: 't' } });
    const port = nativeGoogle('web-client-id');
    await port.signIn();
    await port.signIn();
    expect(plugin.initialize).toHaveBeenCalledTimes(1);
    expect(plugin.initialize).toHaveBeenCalledWith({ google: { webClientId: 'web-client-id' } });
  });

  it('without a client id it never opens the sheet', async () => {
    await expect(nativeGoogle('').signIn()).rejects.toThrow(/not set up/i);
    expect(plugin.login).not.toHaveBeenCalled();
  });
});
