import { describe, expect, it } from 'vitest';
import en from './en.json';
import hi from './hi.json';

/** The owner approved the Hindi on 2026-11-15. */
const HINDI_READY = true;
/** Keys that stay English on purpose. */
const INTENTIONALLY_ENGLISH = new Set(['app.name']);

type Tree = { [key: string]: string | Tree };
const flat = (tree: Tree, prefix = ''): Array<[string, string]> =>
  Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [[prefix + k, v] as [string, string]] : flat(v, `${prefix}${k}.`)));
const placeholders = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe.runIf(HINDI_READY)('Hindi screen text', () => {
  const hiText = new Map(flat(hi as Tree));

  it('has every English key, in Devanagari', () => {
    const missing = flat(en as Tree)
      .filter(([k]) => !INTENTIONALLY_ENGLISH.has(k))
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
});
