import { describe, expect, it } from 'vitest';
import { createSessionStore } from '../features/auth';
import { testUser } from '../test/render';
import { createSessionOnce, clearOnUserChange } from './session-once';
import { memoryKeyValueStore } from './storage';

describe('things asked once per sign-in', () => {
  it('forgets them when the signed-in user changes', () => {
    const tokens = { get: () => null, set: () => undefined, clear: () => undefined };
    const session = createSessionStore(tokens, memoryKeyValueStore());
    const once = createSessionOnce();
    clearOnUserChange(session, once);
    session.signIn('t', testUser({ id: 'u1' }));
    once.add('p1');
    session.updateUser(testUser({ id: 'u1', name: 'New name' }));
    expect(once.has('p1')).toBe(true);
    session.signOut();
    expect(once.has('p1')).toBe(false);
  });

  it('also forgets them when the same user signs in again', () => {
    const tokens = { get: () => null, set: () => undefined, clear: () => undefined };
    const session = createSessionStore(tokens, memoryKeyValueStore());
    const once = createSessionOnce();
    clearOnUserChange(session, once);
    session.signIn('t1', testUser({ id: 'u1' }));
    once.add('p1');
    session.signIn('t2', testUser({ id: 'u1' }));
    expect(once.has('p1')).toBe(false);
  });
});
