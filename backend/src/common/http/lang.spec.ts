import { langOf } from './lang';

describe('langOf: the language a request asks for', () => {
  it.each([
    ['hi', 'hi'],
    ['hi-IN,hi;q=0.9,en;q=0.8', 'hi'],
    ['HI', 'hi'],
    ['en-US', 'en'],
    ['en;q=0.9,hi;q=0.8', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    ['*', 'en'],
    ['xx-garbage', 'en'],
  ])('%s → %s', (header, want) => {
    expect(langOf(header)).toBe(want);
  });
});
