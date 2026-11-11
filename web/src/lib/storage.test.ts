import { describe, expect, it } from 'vitest';
import { createSessionStore } from '../features/auth';
import { clearDraft, loadDraft, saveDraft } from '../features/journal/draft';
import { testUser } from '../test/render';
import { memoryKeyValueStore } from './storage';

const tokens = (token: string | null) => {
  let value = token;
  return { get: () => value, set: (t: string) => void (value = t), clear: () => void (value = null) };
};

describe('storage is injected, not global', () => {
  it('the session caches the signed-in user in the store it is given', () => {
    const kv = memoryKeyValueStore();
    const session = createSessionStore(tokens(null), kv);
    session.signIn('tok', testUser({ name: 'Asha' }));
    // A fresh store over the same storage restores the user.
    expect(createSessionStore(tokens('tok'), kv).get().user?.name).toBe('Asha');
    session.signOut();
    expect(createSessionStore(tokens('tok'), kv).get().user).toBeNull();
  });

  it('a moment draft round-trips through the store it is given', () => {
    const kv = memoryKeyValueStore();
    saveDraft('p1', { type: 'NOTE', content: 'hi' }, kv);
    expect(loadDraft('p1', kv)).toEqual({ type: 'NOTE', content: 'hi' });
    clearDraft('p1', kv);
    expect(loadDraft('p1', kv)).toBeNull();
  });
});
