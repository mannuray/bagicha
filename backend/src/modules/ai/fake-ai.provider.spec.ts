import { FakeAiProvider } from './fake-ai.provider';

describe('FakeAiProvider', () => {
  const ai = new FakeAiProvider();

  it('returns a fixed, saveable pest diagnosis', async () => {
    await expect(
      ai.generateJson({ feature: 'diagnose', prompt: 'p' }),
    ).resolves.toMatchObject({
      primary_issue: 'PEST',
      severity: 'MEDIUM',
      reasoning_summary: 'Mealybugs on new flush.',
      recommended_actions: ['Spray neem oil in the evening'],
      needs_follow_up: true,
      follow_up_days: 3,
    });
  });

  it('identifies a mango', async () => {
    await expect(
      ai.generateJson({ feature: 'identify', prompt: 'p' }),
    ).resolves.toMatchObject({
      common_name: 'Mango',
      scientific_name: 'Mangifera indica',
    });
  });

  it('answers ask-AI questions', async () => {
    await expect(
      ai.generateJson({ feature: 'ask_ai', prompt: 'p' }),
    ).resolves.toMatchObject({
      citations: [],
    });
  });
});
