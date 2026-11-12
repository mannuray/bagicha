import { UpstreamError } from '../../common/errors';

/**
 * AI replies are shaped field by field before they reach a client: only the fields
 * we promise, of the right type. Anything else the model adds is dropped; a reply
 * that is not usable at all is AI_RESPONSE_INVALID.
 */
function asObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new UpstreamError(
      'AI_RESPONSE_INVALID',
      'The AI returned an unusable response',
    );
  }
  return raw as Record<string, unknown>;
}

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

export interface Identification {
  common_name?: string;
  scientific_name?: string;
  description?: string;
  care_summary?: string | Record<string, unknown>;
}

export function toIdentification(raw: unknown): Identification {
  const o = asObject(raw);
  const care = o.care_summary;
  const out: Identification = {};
  if (str(o.common_name)) out.common_name = str(o.common_name);
  if (str(o.scientific_name)) out.scientific_name = str(o.scientific_name);
  if (str(o.description)) out.description = str(o.description);
  if (
    typeof care === 'string' ||
    (care && typeof care === 'object' && !Array.isArray(care))
  ) {
    out.care_summary = care as Identification['care_summary'];
  }
  return out;
}

export interface AskAiAnswer {
  answer: string;
  citations: string[];
}

export function toAskAiAnswer(raw: unknown): AskAiAnswer {
  const o = asObject(raw);
  const answer = str(o.answer);
  if (!answer)
    throw new UpstreamError(
      'AI_RESPONSE_INVALID',
      'The AI returned an unusable response',
    );
  const citations = Array.isArray(o.citations)
    ? o.citations.filter((c): c is string => typeof c === 'string')
    : [];
  return { answer, citations };
}
