import { trackerFor } from './user-or-ip.tracker';

describe('trackerFor', () => {
  it('tracks signed-in callers by user id', () => {
    expect(trackerFor({ user: { id: 'u1' }, ip: '10.0.0.1' })).toBe('user:u1');
  });

  it('tracks anonymous callers by ip', () => {
    expect(trackerFor({ ip: '10.0.0.1' })).toBe('ip:10.0.0.1');
  });

  it('ignores the client-controlled X-Forwarded-For list (uses req.ip, which honours trust proxy)', () => {
    expect(trackerFor({ ips: ['1.2.3.4', '10.0.0.1'], ip: '10.0.0.1' })).toBe(
      'ip:10.0.0.1',
    );
  });

  it('falls back to a fixed bucket when no address is known', () => {
    expect(trackerFor({})).toBe('ip:unknown');
  });
});
