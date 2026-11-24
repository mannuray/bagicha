import { z } from 'zod';
import { InvariantError } from '../../../common/errors';
import type { Lang } from '../../../common/http/lang';
import { hindiText } from './hindi-text';
import type { CatalogueStatus } from './types';

/**
 * One piece of advice text: rule code picks the key, the catalogue holds the
 * words. `{name}` slots are filled at render time; Hindi has the same slots.
 */
export interface AdviceSeed {
  key: string;
  en: string;
  hi?: string;
  status: CatalogueStatus;
  notes: string | null;
}

/** What rule code emits: a key and the values for its slots (a value may itself be a key). */
export interface AdviceRef {
  key: string;
  params?: Record<string, string | number | AdviceRef>;
}

export const adviceSeedSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_.]+$/, 'lower-case dotted key'),
    en: z.string().trim().min(1),
    hi: hindiText.optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'RETIRED']),
    notes: z.string().nullable(),
  })
  .strict();

const slotsOf = (text: string) =>
  [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

/** Each key once, and Hindi slots exactly the English ones. */
export function adviceIssues(advice: AdviceSeed[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const a of advice) {
    if (seen.has(a.key)) issues.push(`advice: ${a.key} listed twice`);
    seen.add(a.key);
    if (a.hi === undefined) continue;
    const [en, hi] = [slotsOf(a.en), slotsOf(a.hi)];
    if (en.join() !== hi.join())
      issues.push(
        `advice: ${a.key}: Hindi slots {${hi.join(',')}} differ from English {${en.join(',')}}`,
      );
  }
  return issues;
}

/** The advice in the gardener's language (English where no Hindi yet), slots filled. */
export function renderAdvice(
  texts: ReadonlyMap<string, Pick<AdviceSeed, 'en' | 'hi'>>,
  ref: AdviceRef,
  lang: Lang,
): string {
  const entry = texts.get(ref.key);
  if (!entry)
    throw new InvariantError(`advice ${ref.key} is not in the catalogue`, {
      key: ref.key,
    });
  const template = (lang === 'hi' && entry.hi) || entry.en;
  return template.replace(/\{(\w+)\}/g, (slot, name: string) => {
    const value = ref.params?.[name];
    if (value === undefined) return slot;
    return typeof value === 'object'
      ? renderAdvice(texts, value, lang)
      : String(value);
  });
}
