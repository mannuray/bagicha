/**
 * Which fields of a log call reach the line (docs/coding-principles.md §4). An
 * allow-list: a new field is dropped until it is added here, so `logger.info({ phone })`
 * can never leak a phone. Secrets and personal fields are refused even if allowed.
 */
const ALLOWED = new Set([
  // the logger's own
  'err',
  'req',
  'res',
  'responseTime',
  'route',
  'reason',
  'status',
  'message',
  'context',
  // values in use
  'area',
  'bucket',
  'feature',
  'model',
  'species',
  'lifecycleStage',
  'sourceKey',
  'errorType',
  'alert',
  'paid',
  'expected',
  'kind',
  'step',
  'catalogueVersion',
]);

/** Internal ids and counts are fine to log; values about a person are not. */
const SAFE_SHAPE = /(Id|_id|Ids|Count|count|Length|Ms|_ms)$/;

const REFUSED =
  /^(otp|token|accessToken|access_token|password|secret|authorization|cookie|phone|phoneNumber|phone_number|name|email|latitude|longitude|lat|lng|pincode|address|prompt|completion|content|note|text)$/i;

/** Keeps the allowed fields of a log call's object; drops the rest. */
export function allowLogFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (REFUSED.test(key)) continue;
    if (ALLOWED.has(key) || SAFE_SHAPE.test(key)) out[key] = value;
  }
  return out;
}
