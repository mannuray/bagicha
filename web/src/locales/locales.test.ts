import { describe, expect, it } from 'vitest';
import en from './en.json';
import hi from './hi.json';

/** The owner approved the Hindi on 2026-11-15. */
const HINDI_READY = true;
/** Keys that stay English on purpose. */
const INTENTIONALLY_ENGLISH = new Set(['app.name', 'account.delete.word']);
/**
 * New English text whose Hindi is drafted but not yet approved by the owner:
 * it falls back to English until then. Remove a prefix once its Hindi is in.
 */
const HINDI_PENDING_REVIEW: string[] = [
  'reminders.',
  'auth.google.',
  'profile.signedInAs',
  'account.delete.goes.profile',
  'account.info.email',
  'tasks.done',
  'appUpdate.',
  'profile.screensVersion',
];

type Tree = { [key: string]: string | Tree };
const flat = (tree: Tree, prefix = ''): Array<[string, string]> =>
  Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [[prefix + k, v] as [string, string]] : flat(v, `${prefix}${k}.`)));
const placeholders = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe.runIf(HINDI_READY)('Hindi screen text', () => {
  const hiText = new Map(flat(hi as Tree));

  it('has every English key, in Devanagari', () => {
    const missing = flat(en as Tree)
      .filter(([k]) => !INTENTIONALLY_ENGLISH.has(k))
      .filter(([k]) => !HINDI_PENDING_REVIEW.some((p) => k.startsWith(p)))
      // Strings that are only {{placeholders}} and punctuation have no words to translate.
      .filter(([, v]) => /\p{L}/u.test(v.replace(/{{\s*\w+\s*}}/g, '')))
      .filter(([k]) => !/[ऀ-ॿ]/.test(hiText.get(k) ?? ''))
      .map(([k]) => k);
    expect(missing).toEqual([]);
  });

  it('keeps every {{placeholder}} of the English', () => {
    const wrong = flat(en as Tree)
      .filter(([k, v]) => hiText.has(k) && placeholders(v).join() !== placeholders(hiText.get(k)!).join())
      .map(([k]) => k);
    expect(wrong).toEqual([]);
  });

  // Hindi plural rules treat 0 as singular ("0 फ़सल उग रही है"); a _zero key gives it the plural.
  it('says zero in the plural wherever singular and plural differ', () => {
    const wrong = [...hiText.keys()]
      .filter((k) => k.endsWith('_one'))
      .map((k) => k.slice(0, -4))
      .filter((base) => hiText.get(`${base}_one`) !== hiText.get(`${base}_other`))
      .filter((base) => hiText.get(`${base}_zero`) !== hiText.get(`${base}_other`));
    expect(wrong).toEqual([]);
  });
});
