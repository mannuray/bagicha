import { UpstreamError } from '../../common/errors';

const invalid = (why: string) =>
  new UpstreamError(
    'AI_RESPONSE_INVALID',
    'The AI returned an unusable response',
    {
      why,
    },
  );

/** Index just past the `}` that closes the `{` at `start`, ignoring braces inside strings. */
function balancedEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

/** Pulls the first JSON object out of a model response (fences and prose allowed). */
export function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```(?:json)?/g, '');
  const start = cleaned.indexOf('{');
  if (start === -1) throw invalid('no JSON object found');
  const end = balancedEnd(cleaned, start);
  if (end === -1) throw invalid('unbalanced JSON object');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end));
  } catch {
    throw invalid('malformed JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw invalid('JSON is not an object');
  }
  return parsed as Record<string, unknown>;
}
