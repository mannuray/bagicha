import { DiagnosisIssueType, DiagnosisSeverity, LogType } from '@prisma/client';
import { mapAiDiagnosis } from './ai-diagnosis.mapper';

const base = { primary_issue: 'PEST', reasoning_summary: 'Aphids on flush' };

describe('mapAiDiagnosis (Review Focus #2: wrong-typed AI output)', () => {
  it('maps a well-formed diagnosis', () => {
    expect(
      mapAiDiagnosis({
        ...base,
        severity: 'high',
        recommended_actions: ['Spray neem', '  '],
        symptoms: ['curl'],
        needs_follow_up: 'true',
        follow_up_days: '4',
        related_event_type: 'pest_diagnosis',
      }),
    ).toMatchObject({
      primary_issue: DiagnosisIssueType.PEST,
      severity: DiagnosisSeverity.HIGH,
      recommended_actions: ['Spray neem'],
      symptoms: ['curl'],
      needs_follow_up: true,
      follow_up_days: 4,
      related_event_type: LogType.PEST_DIAGNOSIS,
      reasoning_summary: 'Aphids on flush',
    });
  });

  it('stringifies a numeric confidence', () => {
    expect(mapAiDiagnosis({ ...base, confidence: 87 }).confidence).toBe('87');
  });

  it('wraps a single action string in a list', () => {
    expect(
      mapAiDiagnosis({ ...base, recommended_actions: 'water it' })
        .recommended_actions,
    ).toEqual(['water it']);
  });

  it('maps an unknown issue to UNKNOWN when a summary is present', () => {
    expect(
      mapAiDiagnosis({
        primary_issue: 'ALIENS',
        reasoning_summary: 'odd spots',
      }).primary_issue,
    ).toBe(DiagnosisIssueType.UNKNOWN);
  });

  it('falls back to 5 follow-up days for a negative value', () => {
    expect(
      mapAiDiagnosis({ ...base, follow_up_days: '-3' }).follow_up_days,
    ).toBe(5);
  });

  it('caps follow_up_days at 60 like the finalize DTO', () => {
    expect(
      mapAiDiagnosis({ ...base, follow_up_days: 1e12 }).follow_up_days,
    ).toBe(60);
    expect(
      mapAiDiagnosis({ ...base, follow_up_days: '400' }).follow_up_days,
    ).toBe(60);
  });

  it('infers the related entry from the issue when the model omits it', () => {
    expect(mapAiDiagnosis({ ...base }).related_event_type).toBe(
      LogType.PEST_DIAGNOSIS,
    );
  });

  it('defaults needs_follow_up to whether there are actions', () => {
    expect(mapAiDiagnosis({ ...base }).needs_follow_up).toBe(false);
    expect(
      mapAiDiagnosis({ ...base, recommended_actions: ['x'] }).needs_follow_up,
    ).toBe(true);
  });

  it.each([[{}], [{ primary_issue: 'ALIENS' }], [{ severity: 'HIGH' }]])(
    'rejects output with no usable issue and no summary: %p',
    (raw) => {
      expect(() => mapAiDiagnosis(raw)).toThrow(
        expect.objectContaining({ reason: 'AI_RESPONSE_INVALID' }),
      );
    },
  );
});
