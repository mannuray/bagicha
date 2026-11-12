import { UpstreamError } from '../../common/errors';
import { toAskAiAnswer, toIdentification } from './ai-answers';

describe('AI answers are shaped before they reach a client', () => {
  it('an identification keeps its known fields only', () => {
    expect(
      toIdentification({
        common_name: 'Mango',
        scientific_name: 'Mangifera indica',
        description: 'A fruit tree',
        care_summary: { water: 'weekly' },
        internal_notes: 'x',
        confidence: 0.9,
      }),
    ).toEqual({
      common_name: 'Mango',
      scientific_name: 'Mangifera indica',
      description: 'A fruit tree',
      care_summary: { water: 'weekly' },
    });
    expect(toIdentification({ common_name: 42 })).toEqual({});
  });

  it('an ask-AI answer is a string with a list of string citations', () => {
    expect(
      toAskAiAnswer({
        answer: 'Water deeply.',
        citations: ['ICAR', 7],
        extra: true,
      }),
    ).toEqual({ answer: 'Water deeply.', citations: ['ICAR'] });
    expect(toAskAiAnswer({ answer: 'Ok.' })).toEqual({
      answer: 'Ok.',
      citations: [],
    });
  });

  it('a reply that is not an object (or has no answer) is a clear upstream error', () => {
    expect(() => toIdentification('nope')).toThrow(UpstreamError);
    expect(() => toAskAiAnswer({ citations: [] })).toThrow(UpstreamError);
  });
});
