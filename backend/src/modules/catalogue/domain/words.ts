/** Whole-word matching: "ber" must not match inside "mulberry". */

/** Lower-case English letters and digits, single-spaced. */
export const latinWords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Any script, NFC (so ड़ typed either way reads the same), single-spaced. */
export const hindiWords = (text: string) =>
  text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}0-9]+/gu, ' ')
    .trim();

export const hasWords = (haystack: string, alias: string) =>
  ` ${haystack.trim()} `.includes(` ${alias} `);

/** Where `alias` starts as a whole word in `haystack`, or -1. */
export const wordAt = (haystack: string, alias: string): number =>
  ` ${haystack.trim()} `.indexOf(` ${alias} `);
