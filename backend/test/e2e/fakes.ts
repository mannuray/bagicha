import { GeminiService } from '../../src/modules/vision/services/gemini.service';
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

/** Stands in for Gemini so e2e tests never reach the network. */
export class FakeGemini {
  analyzeImage(): Promise<string> {
    return Promise.resolve(JSON.stringify(FAKE_DIAGNOSIS));
  }
  generateText(): Promise<string> {
    return Promise.resolve(JSON.stringify({ answer: 'ok', citations: [] }));
  }
  parseJsonResponse(text: string): unknown {
    return JSON.parse(text);
  }
}

export const withFakeAi: ModuleOverrides = (builder) =>
  builder.overrideProvider(GeminiService).useValue(new FakeGemini());
