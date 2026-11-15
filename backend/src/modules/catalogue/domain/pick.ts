import type { Lang } from '../../../common/http/lang';

/** The Hindi text when Hindi is asked for and there is one; else the English. */
export function pick<T>(english: T, hindi: T | undefined, lang: Lang): T {
  return lang === 'hi' && hindi ? hindi : english;
}
