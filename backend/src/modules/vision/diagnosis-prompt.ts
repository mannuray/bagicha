import { PlantAiContext } from '../plant-ledger';

export function buildIdentifyPrompt(): string {
  return `
      Identify this plant species.
      Be specific and provide results in a structured JSON format.
      Include: common_name, scientific_name, description, and care_summary (light, water, soil).
      Format: JSON only.
    `;
}

export function buildDiagnosisPrompt(
  context: PlantAiContext | null,
  note: string | null,
): string {
  return `
      Analyze this plant image for horticultural diagnosis.
      Use the image as the main evidence, but also use the supplied plant history and seasonal context when available.
      Focus on practical Indian gardening and orchard context.

      Return strict JSON only with these fields:
      {
        "primary_issue": "PEST|DISEASE|NUTRIENT|WATER_STRESS|WEATHER_DAMAGE|FRUIT_DROP|FLOWER_DROP|UNKNOWN",
        "secondary_issues": ["..."],
        "symptoms": ["..."],
        "confidence": "low|medium|high or percentage",
        "severity": "LOW|MEDIUM|HIGH|UNKNOWN",
        "affected_part": "fruit|flowers|leaves|stem|roots|whole_plant",
        "reasoning_summary": "short explanation",
        "recommended_actions": ["..."],
        "needs_follow_up": true,
        "follow_up_days": 5,
        "related_event_type": "PEST_DIAGNOSIS|FRUIT_DROP|FLOWER_DROP|WATERING_STRESS|WEATHER_DAMAGE|DIAGNOSIS"
      }

      Plant context:
      ${context ? JSON.stringify(context) : 'No plant context provided'}

      User note:
      ${note ?? 'No extra note provided'}
    `;
}
