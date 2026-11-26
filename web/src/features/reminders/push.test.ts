import { describe, expect, it } from 'vitest';
import { pushPortFor } from './push';

describe('which push service the app uses', () => {
  it('uses the phone’s push service on a phone build that has the Firebase config', () => {
    expect(pushPortFor({ native: true, firebaseConfigured: true }).native).toBe(true);
  });

  it('acts like the website on a phone build without the Firebase config (registering would crash it)', () => {
    expect(pushPortFor({ native: true, firebaseConfigured: false }).native).toBe(false);
  });

  it('has no push on the website', () => {
    expect(pushPortFor({ native: false, firebaseConfigured: true }).native).toBe(false);
  });
});
