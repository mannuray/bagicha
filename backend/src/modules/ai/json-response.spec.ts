import { UpstreamError } from '../../common/errors';
import { extractJsonObject } from './json-response';

describe('extractJsonObject', () => {
  it('parses plain JSON', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown code fences', () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('finds the object inside surrounding prose', () => {
    expect(
      extractJsonObject(
        'Here you go: {"answer":"water at dusk","n":{"x":2}} hope it helps',
      ),
    ).toEqual({ answer: 'water at dusk', n: { x: 2 } });
  });

  it('ignores braces inside strings when balancing', () => {
    expect(extractJsonObject('x {"t":"a } b"} y')).toEqual({ t: 'a } b' });
  });

  it.each([['not json'], ['[1,2]'], [''], ['{"a":']])(
    'throws AI_RESPONSE_INVALID for %p',
    (text) => {
      try {
        extractJsonObject(text);
        throw new Error('expected a throw');
      } catch (err) {
        expect(err).toBeInstanceOf(UpstreamError);
        expect((err as UpstreamError).reason).toBe('AI_RESPONSE_INVALID');
      }
    },
  );
});
