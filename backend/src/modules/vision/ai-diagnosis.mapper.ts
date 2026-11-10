import { DiagnosisIssueType, DiagnosisSeverity, LogType } from '@prisma/client';
import { UpstreamError } from '../../common/errors';
import { FinalizeDiagnosisInput } from '../diagnosis';

export type AiDiagnosis = Omit<
  FinalizeDiagnosisInput,
  | 'subject_type'
  | 'subject_id'
  | 'session_id'
  | 'event_at'
  | 'user_note'
  | 'attachments'
  | 'messages'
>;

const DEFAULT_FOLLOW_UP_DAYS = 5;

const ISSUES = new Set<string>(Object.values(DiagnosisIssueType));
const SEVERITIES = new Set<string>(Object.values(DiagnosisSeverity));
const RELATED_TYPES = new Set<string>([
  LogType.PEST_DIAGNOSIS,
  LogType.FRUIT_DROP,
  LogType.FLOWER_DROP,
  LogType.WATERING_STRESS,
  LogType.WEATHER_DAMAGE,
  LogType.DIAGNOSIS,
]);
const RELATED_BY_ISSUE: Partial<Record<DiagnosisIssueType, LogType>> = {
  [DiagnosisIssueType.PEST]: LogType.PEST_DIAGNOSIS,
  [DiagnosisIssueType.FRUIT_DROP]: LogType.FRUIT_DROP,
  [DiagnosisIssueType.FLOWER_DROP]: LogType.FLOWER_DROP,
  [DiagnosisIssueType.WATER_STRESS]: LogType.WATERING_STRESS,
  [DiagnosisIssueType.WEATHER_DAMAGE]: LogType.WEATHER_DAMAGE,
};

function text(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function textList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function positiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return null;
}

function issue(value: unknown): DiagnosisIssueType | null {
  const upper = text(value)?.toUpperCase();
  return upper && ISSUES.has(upper) ? (upper as DiagnosisIssueType) : null;
}

function severity(value: unknown): DiagnosisSeverity {
  const upper = text(value)?.toUpperCase();
  return upper && SEVERITIES.has(upper)
    ? (upper as DiagnosisSeverity)
    : DiagnosisSeverity.UNKNOWN;
}

function relatedType(value: unknown, primary: DiagnosisIssueType): LogType {
  const upper = text(value)?.toUpperCase();
  if (upper && RELATED_TYPES.has(upper)) return upper as LogType;
  return RELATED_BY_ISSUE[primary] ?? LogType.DIAGNOSIS;
}

/**
 * Turns whatever JSON the model produced into a diagnosis we can save. Coerces
 * wrong-but-recoverable types; rejects output with neither a recognised issue
 * nor any explanation.
 */
export function mapAiDiagnosis(raw: Record<string, unknown>): AiDiagnosis {
  const primary = issue(raw.primary_issue);
  const summary = text(raw.reasoning_summary) ?? text(raw.identification);
  if (!primary && !summary) {
    throw new UpstreamError(
      'AI_RESPONSE_INVALID',
      'The AI did not return a usable diagnosis',
    );
  }
  const primaryIssue = primary ?? DiagnosisIssueType.UNKNOWN;
  const actions = textList(raw.recommended_actions);

  return {
    primary_issue: primaryIssue,
    secondary_issues: textList(raw.secondary_issues),
    symptoms: textList(raw.symptoms),
    confidence: text(raw.confidence) ?? undefined,
    severity: severity(raw.severity),
    affected_part: text(raw.affected_part) ?? undefined,
    reasoning_summary: summary ?? 'AI diagnosis recorded.',
    recommended_actions: actions,
    needs_follow_up: bool(raw.needs_follow_up) ?? actions.length > 0,
    follow_up_days: positiveInt(raw.follow_up_days) ?? DEFAULT_FOLLOW_UP_DAYS,
    related_event_type: relatedType(raw.related_event_type, primaryIssue),
  };
}
