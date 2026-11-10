import { Injectable } from '@nestjs/common';
import { AiJsonRequest, AiProvider } from './ai-provider';

const RESPONSES: Record<AiJsonRequest['feature'], Record<string, unknown>> = {
  identify: {
    common_name: 'Mango',
    scientific_name: 'Mangifera indica',
    description: 'A long-lived evergreen fruit tree.',
    care_summary: {
      light: 'Full sun',
      water: 'Deep watering every 7–10 days in summer',
      soil: 'Well-drained loam',
    },
  },
  diagnose: {
    primary_issue: 'PEST',
    secondary_issues: [],
    symptoms: ['White cottony clusters on new shoots'],
    confidence: 'high',
    severity: 'MEDIUM',
    affected_part: 'leaves',
    reasoning_summary: 'Mealybugs on new flush.',
    recommended_actions: ['Spray neem oil in the evening'],
    needs_follow_up: true,
    follow_up_days: 3,
    related_event_type: 'PEST_DIAGNOSIS',
  },
  ask_ai: {
    answer: 'Water deeply in the evening and mulch the base.',
    citations: [],
  },
};

/**
 * Deterministic AI for end-to-end runs (AI_PROVIDER=fake). Env validation
 * refuses it in production, so it can never answer a real user.
 */
@Injectable()
export class FakeAiProvider extends AiProvider {
  generateJson(request: AiJsonRequest): Promise<Record<string, unknown>> {
    return Promise.resolve(structuredClone(RESPONSES[request.feature]));
  }
}
