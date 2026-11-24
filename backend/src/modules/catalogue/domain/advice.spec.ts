import {
  adviceIssues,
  adviceSeedSchema,
  renderAdvice,
  type AdviceSeed,
} from './advice';

const seed = (
  entries: Array<Partial<AdviceSeed> & { key: string; en: string }>,
) => entries.map((e) => ({ status: 'APPROVED' as const, notes: null, ...e }));

const texts = new Map(
  seed([
    { key: 'drop.level.high', en: 'high', hi: 'ज़्यादा' },
    {
      key: 'flower.drop',
      en: 'Flower drop was {level}.',
      hi: 'फूल {level} गिरे।',
    },
    { key: 'skipped', en: '{count} cycle task(s) were skipped.' },
  ]).map((e) => [e.key, e]),
);

describe('renderAdvice', () => {
  it('fills numbers and nested keys into the English text', () => {
    expect(
      renderAdvice(
        texts,
        { key: 'flower.drop', params: { level: { key: 'drop.level.high' } } },
        'en',
      ),
    ).toBe('Flower drop was high.');
    expect(
      renderAdvice(texts, { key: 'skipped', params: { count: 2 } }, 'en'),
    ).toBe('2 cycle task(s) were skipped.');
  });

  it('uses Hindi where it exists, nested keys too, and English otherwise', () => {
    expect(
      renderAdvice(
        texts,
        { key: 'flower.drop', params: { level: { key: 'drop.level.high' } } },
        'hi',
      ),
    ).toBe('फूल ज़्यादा गिरे।');
    expect(
      renderAdvice(texts, { key: 'skipped', params: { count: 3 } }, 'hi'),
    ).toBe('3 cycle task(s) were skipped.');
  });

  it('throws an invariant error for a key the catalogue lacks', () => {
    expect(() => renderAdvice(texts, { key: 'missing' }, 'en')).toThrow(
      /missing/,
    );
  });
});

describe('advice seed validation', () => {
  it('accepts a keyed English text with optional Hindi', () => {
    expect(
      adviceSeedSchema.safeParse({
        key: 'a.b',
        en: 'x {n}',
        hi: 'क {n}',
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('rejects Hindi without Devanagari and unknown fields', () => {
    expect(
      adviceSeedSchema.safeParse({
        key: 'a',
        en: 'x',
        hi: 'latin',
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(false);
    expect(
      adviceSeedSchema.safeParse({
        key: 'a',
        en: 'x',
        extra: 1,
        status: 'APPROVED',
        notes: null,
      }).success,
    ).toBe(false);
  });

  it('flags duplicate keys and Hindi whose slots differ from the English', () => {
    expect(
      adviceIssues(
        seed([
          { key: 'a', en: 'x' },
          { key: 'a', en: 'y' },
        ]),
      ),
    ).toEqual(['advice: a listed twice']);
    expect(
      adviceIssues(seed([{ key: 'b', en: '{n} items', hi: 'चीज़ें' }])),
    ).toEqual(['advice: b: Hindi slots {} differ from English {n}']);
  });
});
