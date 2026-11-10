import { corsOptionsFor, parseWebOrigins } from './web-origins';

describe('parseWebOrigins', () => {
  it('splits and trims a comma-separated list', () => {
    expect(parseWebOrigins('http://a.test, https://b.test ')).toEqual([
      'http://a.test',
      'https://b.test',
    ]);
  });

  it('is empty when unset or blank (nothing allowed)', () => {
    expect(parseWebOrigins(undefined)).toEqual([]);
    expect(parseWebOrigins('  ,  ')).toEqual([]);
  });
});

describe('corsOptionsFor', () => {
  it('turns CORS off when no origin is configured', () => {
    expect(corsOptionsFor([])).toBeNull();
  });

  it('allows exactly the listed origins with the auth header', () => {
    expect(corsOptionsFor(['http://localhost:5173'])).toMatchObject({
      origin: ['http://localhost:5173'],
      credentials: false,
      allowedHeaders: expect.arrayContaining(['Authorization']),
    });
  });
});
