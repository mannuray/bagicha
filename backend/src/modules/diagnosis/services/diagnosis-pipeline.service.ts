import { Injectable } from '@nestjs/common';
import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisStatus,
  DiagnosisSubjectType,
  LogType,
  Prisma,
  TaskSource,
} from '@prisma/client';
import {
  InvariantError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors';
import { Metrics } from '../../../common/observability';
import { Tx, TransactionRunner } from '../../../common/prisma/transaction';
import { addDays, Clock } from '../../../common/time';
import {
  CycleService,
  JournalService,
  PlantRecordService,
  TaskCreationResult,
  TaskDraft,
  TaskService,
  taskCategoryFromIssue,
  taskPriorityFromSeverity,
  taskTypeFromIssue,
} from '../../plant-ledger';
import { DiagnosisRepository } from '../repositories/diagnosis.repository';

export const MAX_TASKS_FROM_DIAGNOSIS = 5;
const DEFAULT_FOLLOW_UP_DAYS = 5;

/** What a finished diagnosis contains, whether it came from the AI or a human. */
export interface FinalizeDiagnosisInput {
  subject_type: DiagnosisSubjectType;
  subject_id: string;
  session_id?: string;
  event_at?: string;
  primary_issue: DiagnosisIssueType;
  secondary_issues?: string[];
  symptoms?: string[];
  affected_part?: string;
  severity: DiagnosisSeverity;
  confidence?: string;
  reasoning_summary: string;
  recommended_actions: string[];
  needs_follow_up?: boolean;
  follow_up_days?: number;
  user_note?: string;
  related_event_type?: LogType;
  attachments?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
}

export interface FinalizeDiagnosisResult {
  session_id: string;
  outcome_id: string;
  log_ids: string[];
  tasks: TaskCreationResult[];
}

const RELATED_EVENT_BY_ISSUE: Partial<Record<DiagnosisIssueType, LogType>> = {
  [DiagnosisIssueType.PEST]: LogType.PEST_DIAGNOSIS,
  [DiagnosisIssueType.FRUIT_DROP]: LogType.FRUIT_DROP,
  [DiagnosisIssueType.FLOWER_DROP]: LogType.FLOWER_DROP,
  [DiagnosisIssueType.WATER_STRESS]: LogType.WATERING_STRESS,
  [DiagnosisIssueType.WEATHER_DAMAGE]: LogType.WEATHER_DAMAGE,
};

function taskTitle(action: string, plantName: string): string {
  const trimmed = action.trim().replace(/[.!?]+$/g, '');
  if (!trimmed) return `Follow up on ${plantName}`;
  const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return sentence.length > 80 ? `${sentence.slice(0, 77)}...` : sentence;
}

const json = (value: unknown) => value as Prisma.InputJsonValue;

/** Saves a diagnosis to the plant record: session, outcome, journal entries and follow-up tasks. */
@Injectable()
export class DiagnosisPipelineService {
  constructor(
    private readonly diagnoses: DiagnosisRepository,
    private readonly plants: PlantRecordService,
    private readonly cycles: CycleService,
    private readonly journal: JournalService,
    private readonly tasks: TaskService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
    private readonly metrics: Metrics,
  ) {}

  async finalize(
    userId: string,
    input: FinalizeDiagnosisInput,
  ): Promise<FinalizeDiagnosisResult> {
    if (input.subject_type !== DiagnosisSubjectType.TREE) {
      throw new ValidationError(
        'DIAGNOSIS_SUBJECT_UNSUPPORTED',
        `Subject type ${input.subject_type} is not supported yet`,
      );
    }
    // A diagnosis grows the record, so an ended tree can't take one.
    const plant = await this.plants.assertGrowing(userId, input.subject_id);

    const recordedAt = this.clock.now();
    const eventAt = input.event_at ? new Date(input.event_at) : recordedAt;
    if (Number.isNaN(eventAt.getTime())) {
      throw new ValidationError(
        'DIAGNOSIS_EVENT_AT_INVALID',
        'event_at must be an ISO-8601 date',
      );
    }
    const reasoning = input.reasoning_summary?.trim() || 'Diagnosis recorded.';
    const actions = (input.recommended_actions ?? [])
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
      .slice(0, MAX_TASKS_FROM_DIAGNOSIS);
    const needsFollowUp = input.needs_follow_up ?? actions.length > 0;
    const followUpDays = needsFollowUp
      ? (input.follow_up_days ?? DEFAULT_FOLLOW_UP_DAYS)
      : null;
    const relatedType =
      input.related_event_type ??
      RELATED_EVENT_BY_ISSUE[input.primary_issue] ??
      null;
    const attachments = input.attachments ?? [];
    const symptoms = input.symptoms ?? [];

    const result = await this.transactions.run(async (tx) => {
      const cycle = await this.cycles.ensureCycle(userId, plant, eventAt, tx);
      const sessionId = await this.openOrResolveSession(
        tx,
        userId,
        plant.id,
        input,
        recordedAt,
        attachments,
      );

      const outcome = await this.diagnoses.createOutcome(
        userId,
        plant.id,
        {
          session_id: sessionId,
          event_at: eventAt,
          primary_issue: input.primary_issue,
          secondary_issues: input.secondary_issues ?? [],
          symptoms: json(symptoms),
          confidence: input.confidence ?? null,
          severity: input.severity,
          affected_part: input.affected_part ?? null,
          reasoning_summary: reasoning,
          recommended_actions: json(actions),
          needs_follow_up: needsFollowUp,
          follow_up_days: followUpDays,
          attachments: json(attachments),
        },
        tx,
      );
      if (!outcome)
        throw new InvariantError('Outcome write lost plant ownership');

      const logIds: string[] = [];
      const diagnosisLog = await this.journal.recordEntry(
        userId,
        plant.id,
        {
          type: LogType.DIAGNOSIS,
          content: input.user_note ?? reasoning,
          metadata: json({
            diagnosis_session_id: sessionId,
            primary_issue: input.primary_issue,
            symptoms,
            confidence: input.confidence ?? null,
            severity: input.severity,
            affected_part: input.affected_part ?? null,
            recommended_actions: actions,
            attachments,
          }),
          eventAt,
          recordedAt,
          plantCycleId: cycle.id,
          diagnosisOutcomeId: outcome.id,
        },
        tx,
      );
      logIds.push(diagnosisLog.id);

      if (relatedType && relatedType !== LogType.DIAGNOSIS) {
        const related = await this.journal.recordEntry(
          userId,
          plant.id,
          {
            type: relatedType,
            content: reasoning,
            metadata: json({
              diagnosis_session_id: sessionId,
              diagnosis_outcome_id: outcome.id,
              inferred_from_diagnosis: true,
              primary_issue: input.primary_issue,
              confidence: input.confidence ?? null,
              severity: input.severity,
            }),
            eventAt,
            recordedAt,
            plantCycleId: cycle.id,
            diagnosisOutcomeId: outcome.id,
          },
          tx,
        );
        logIds.push(related.id);
      }

      const drafts: TaskDraft[] =
        needsFollowUp && actions.length > 0
          ? actions.map((action, index) => {
              const base = followUpDays ?? DEFAULT_FOLLOW_UP_DAYS;
              return {
                type: taskTypeFromIssue(input.primary_issue),
                category: taskCategoryFromIssue(input.primary_issue),
                priority: taskPriorityFromSeverity(input.severity, index),
                title: taskTitle(action, plant.name),
                source: TaskSource.AI_DIAGNOSIS,
                sourceKey: `diagnosis:${outcome.id}:${index}`,
                reason: reasoning,
                metadata: json({
                  diagnosis_session_id: sessionId,
                  diagnosis_outcome_id: outcome.id,
                  action_index: index,
                  primary_issue: input.primary_issue,
                }),
                dueDate: addDays(
                  eventAt,
                  index === 0 ? base : base + index * 2,
                ),
                plantCycleId: cycle.id,
                diagnosisOutcomeId: outcome.id,
              };
            })
          : [];
      const tasks = await this.tasks.createTasks(userId, plant.id, drafts, tx);

      return {
        session_id: sessionId,
        outcome_id: outcome.id,
        log_ids: logIds,
        tasks,
      };
    });

    this.metrics.diagnosisRecorded(input.primary_issue);
    return result;
  }

  private async openOrResolveSession(
    tx: Tx,
    userId: string,
    plantId: string,
    input: FinalizeDiagnosisInput,
    recordedAt: Date,
    attachments: Array<Record<string, unknown>>,
  ): Promise<string> {
    if (input.session_id) {
      const owned = await this.diagnoses.findOwnedSession(
        userId,
        input.session_id,
        plantId,
        tx,
      );
      if (!owned) {
        throw new NotFoundError(
          'DIAGNOSIS_SESSION_NOT_FOUND',
          'Diagnosis session not found',
        );
      }
      await this.diagnoses.resolveSession(
        userId,
        input.session_id,
        {
          status: DiagnosisStatus.RESOLVED,
          closed_at: recordedAt,
          messages: input.messages ? json(input.messages) : undefined,
        },
        tx,
      );
      return input.session_id;
    }

    const session = await this.diagnoses.createSession(
      userId,
      plantId,
      {
        subject_type: input.subject_type,
        subject_id: input.subject_id,
        status: DiagnosisStatus.RESOLVED,
        messages: json(
          input.messages ?? [
            { role: 'user', note: input.user_note ?? null },
            {
              role: 'assistant',
              summary: input.reasoning_summary,
              primary_issue: input.primary_issue,
              confidence: input.confidence ?? null,
              severity: input.severity,
            },
          ],
        ),
        attachments: json(attachments),
        started_at: recordedAt,
        closed_at: recordedAt,
      },
      tx,
    );
    if (!session)
      throw new InvariantError('Session write lost plant ownership');
    return session.id;
  }
}
