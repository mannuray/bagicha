import { AiJsonRequest, AiProvider } from '../../src/modules/ai';
import { ModuleOverrides } from './app';

export const FAKE_DIAGNOSIS = {
  primary_issue: 'PEST',
  secondary_issues: [],
  symptoms: ['curled leaves'],
  confidence: 'high',
  severity: 'MEDIUM',
  affected_part: 'leaves',
  reasoning_summary: 'Aphid colony on new flush.',
  recommended_actions: ['Spray neem oil in the evening'],
  needs_follow_up: true,
  follow_up_days: 4,
  related_event_type: 'PEST_DIAGNOSIS',
};

/** Stands in for the AI provider so e2e tests never reach the network. */
export class FakeAi extends AiProvider {
  generateJson(request: AiJsonRequest): Promise<Record<string, unknown>> {
    if (request.feature === 'ask_ai') {
      return Promise.resolve({ answer: 'ok', citations: [] });
    }
    return Promise.resolve({ ...FAKE_DIAGNOSIS });
  }
}

export const withFakeAi: ModuleOverrides = (builder) =>
  builder.overrideProvider(AiProvider).useValue(new FakeAi());
