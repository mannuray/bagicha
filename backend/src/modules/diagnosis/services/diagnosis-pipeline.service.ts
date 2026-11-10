import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisStatus,
  DiagnosisSubjectType,
  LogType,
  Prisma,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskType,
  Plant,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SpeciesNormalizationService } from '../../plant-ledger/services/species-normalization.service';
import {
  FinalizeDiagnosisDto,
  FinalizeDiagnosisResult,
} from '../dto/finalize-diagnosis.dto';

const MAX_TASKS_FROM_DIAGNOSIS = 5;

@Injectable()
export class DiagnosisPipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly speciesNormalization: SpeciesNormalizationService,
  ) {}

  async finalize(
    userId: string,
    input: FinalizeDiagnosisDto,
  ): Promise<FinalizeDiagnosisResult> {
    if (input.subject_type !== DiagnosisSubjectType.TREE) {
      throw new NotFoundException(
        `Subject type ${input.subject_type} not supported yet.`,
      );
    }

    const plant = await this.prisma.plant.findFirst({
      where: { id: input.subject_id, user_id: userId },
    });
    if (!plant) {
      throw new NotFoundException(`Plant ${input.subject_id} not found.`);
    }
    if (input.session_id) {
      const ownedSession = await this.prisma.diagnosisSession.findFirst({
        where: { id: input.session_id, plant_id: plant.id },
        select: { id: true },
      });
      if (!ownedSession) {
        throw new NotFoundException(
          `Diagnosis session ${input.session_id} not found.`,
        );
      }
    }

    const eventAt = input.event_at ? new Date(input.event_at) : new Date();
    const recordedAt = new Date();
    const cycleYear = this.resolveCycleYear(plant, eventAt);
    const reasoningSummary =
      input.reasoning_summary?.trim() || 'Diagnosis recorded.';
    const actions = (input.recommended_actions ?? [])
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
      .slice(0, MAX_TASKS_FROM_DIAGNOSIS);
    const needsFollowUp = input.needs_follow_up ?? actions.length > 0;
    const followUpDays = needsFollowUp ? (input.follow_up_days ?? 5) : null;
    const relatedEventType = this.resolveRelatedEventType(
      input.related_event_type,
      input.primary_issue,
    );
    const attachments = input.attachments ?? [];
    const symptoms = input.symptoms ?? [];

    return this.prisma.$transaction(async (tx) => {
      const cycle = await tx.plantCycle.upsert({
        where: {
          plant_cycle_year: { plant_id: plant.id, cycle_year: cycleYear },
        },
        create: { plant_id: plant.id, cycle_year: cycleYear },
        update: {},
      });

      // Reuse an OPEN session if a session_id was provided.
      const session = input.session_id
        ? await tx.diagnosisSession.update({
            where: { id: input.session_id },
            data: {
              status: DiagnosisStatus.RESOLVED,
              closed_at: recordedAt,
              messages: input.messages
                ? (input.messages as Prisma.InputJsonValue)
                : undefined,
            },
          })
        : await tx.diagnosisSession.create({
            data: {
              subject_type: input.subject_type,
              subject_id: input.subject_id,
              plant_id: plant.id,
              status: DiagnosisStatus.RESOLVED,
              messages: (input.messages ??
                this.synthesizeMessages(input)) as Prisma.InputJsonValue,
              attachments: attachments as Prisma.InputJsonValue,
              started_at: recordedAt,
              closed_at: recordedAt,
            },
          });

      const outcome = await tx.diagnosisOutcome.create({
        data: {
          session_id: session.id,
          plant_id: plant.id,
          event_at: eventAt,
          primary_issue: input.primary_issue,
          secondary_issues: input.secondary_issues ?? [],
          symptoms: symptoms as Prisma.InputJsonValue,
          confidence: input.confidence ?? null,
          severity: input.severity,
          affected_part: input.affected_part ?? null,
          reasoning_summary: reasoningSummary,
          recommended_actions: actions as Prisma.InputJsonValue,
          needs_follow_up: needsFollowUp,
          follow_up_days: followUpDays,
          attachments: attachments as Prisma.InputJsonValue,
        },
      });

      const logIds: string[] = [];

      const diagnosisLog = await tx.journalEntry.create({
        data: {
          plant_id: plant.id,
          plant_cycle_id: cycle.id,
          diagnosis_outcome_id: outcome.id,
          type: LogType.DIAGNOSIS,
          content: input.user_note ?? reasoningSummary,
          metadata: {
            diagnosis_session_id: session.id,
            primary_issue: input.primary_issue,
            symptoms,
            confidence: input.confidence ?? null,
            severity: input.severity,
            affected_part: input.affected_part ?? null,
            recommended_actions: actions,
            attachments,
          } as Prisma.InputJsonValue,
          timestamp: eventAt,
          recorded_at: recordedAt,
        },
      });
      logIds.push(diagnosisLog.id);

      if (relatedEventType && relatedEventType !== LogType.DIAGNOSIS) {
        const relatedLog = await tx.journalEntry.create({
          data: {
            plant_id: plant.id,
            plant_cycle_id: cycle.id,
            diagnosis_outcome_id: outcome.id,
            type: relatedEventType,
            content: reasoningSummary,
            metadata: {
              diagnosis_session_id: session.id,
              diagnosis_outcome_id: outcome.id,
              inferred_from_diagnosis: true,
              primary_issue: input.primary_issue,
              confidence: input.confidence ?? null,
              severity: input.severity,
            } as Prisma.InputJsonValue,
            timestamp: eventAt,
            recorded_at: recordedAt,
          },
        });
        logIds.push(relatedLog.id);
      }

      const taskIds: string[] = [];
      if (needsFollowUp && actions.length > 0) {
        for (let index = 0; index < actions.length; index++) {
          const action = actions[index];
          const dueOffsetDays =
            index === 0 ? (followUpDays ?? 5) : (followUpDays ?? 5) + index * 2;
          const task = await tx.task.create({
            data: {
              plant_id: plant.id,
              plant_cycle_id: cycle.id,
              diagnosis_outcome_id: outcome.id,
              type: this.mapTaskType(input.primary_issue),
              title: this.formatTaskTitle(action, plant.name),
              category: this.mapTaskCategory(input.primary_issue),
              priority: this.mapTaskPriority(input.severity, index),
              source: TaskSource.AI_DIAGNOSIS,
              source_key: `diagnosis:${outcome.id}:${index}`,
              reason: reasoningSummary,
              metadata: {
                diagnosis_session_id: session.id,
                diagnosis_outcome_id: outcome.id,
                action_index: index,
                primary_issue: input.primary_issue,
              } as Prisma.InputJsonValue,
              due_date: new Date(
                eventAt.getTime() + dueOffsetDays * 24 * 60 * 60 * 1000,
              ),
            },
          });
          taskIds.push(task.id);
        }
      }

      return {
        session_id: session.id,
        outcome_id: outcome.id,
        log_ids: logIds,
        task_ids: taskIds,
      };
    });
  }

  private synthesizeMessages(input: FinalizeDiagnosisDto): unknown[] {
    return [
      {
        role: 'user',
        note: input.user_note ?? null,
      },
      {
        role: 'assistant',
        summary: input.reasoning_summary,
        primary_issue: input.primary_issue,
        confidence: input.confidence ?? null,
        severity: input.severity,
      },
    ];
  }

  private resolveRelatedEventType(
    explicit: LogType | undefined,
    primaryIssue: DiagnosisIssueType,
  ): LogType | null {
    if (explicit) return explicit;
    switch (primaryIssue) {
      case DiagnosisIssueType.PEST:
        return LogType.PEST_DIAGNOSIS;
      case DiagnosisIssueType.FRUIT_DROP:
        return LogType.FRUIT_DROP;
      case DiagnosisIssueType.FLOWER_DROP:
        return LogType.FLOWER_DROP;
      case DiagnosisIssueType.WATER_STRESS:
        return LogType.WATERING_STRESS;
      case DiagnosisIssueType.WEATHER_DAMAGE:
        return LogType.WEATHER_DAMAGE;
      default:
        return null;
    }
  }

  private mapTaskType(issue: DiagnosisIssueType): TaskType {
    switch (issue) {
      case DiagnosisIssueType.PEST:
      case DiagnosisIssueType.DISEASE:
        return TaskType.TREAT;
      case DiagnosisIssueType.WATER_STRESS:
        return TaskType.WATER;
      default:
        return TaskType.INSPECT;
    }
  }

  private mapTaskCategory(issue: DiagnosisIssueType): TaskCategory {
    switch (issue) {
      case DiagnosisIssueType.PEST:
      case DiagnosisIssueType.DISEASE:
        return TaskCategory.TREATMENT;
      case DiagnosisIssueType.WATER_STRESS:
        return TaskCategory.WATERING;
      default:
        return TaskCategory.INSPECTION;
    }
  }

  private mapTaskPriority(
    severity: DiagnosisSeverity,
    index: number,
  ): TaskPriority {
    if (index === 0) {
      switch (severity) {
        case DiagnosisSeverity.HIGH:
          return TaskPriority.HIGH;
        case DiagnosisSeverity.MEDIUM:
          return TaskPriority.MEDIUM;
        default:
          return TaskPriority.LOW;
      }
    }
    return TaskPriority.MEDIUM;
  }

  private formatTaskTitle(action: string, treeName: string): string {
    const trimmed = action.trim().replace(/[.!?]+$/g, '');
    if (!trimmed) return `Follow up on ${treeName}`;
    const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return sentence.length > 80 ? `${sentence.slice(0, 77)}...` : sentence;
  }

  private resolveCycleYear(plant: Plant, eventAt: Date): number {
    const family = this.speciesNormalization.resolveSpeciesFamily(plant);
    const month = eventAt.getMonth() + 1; // 1-12
    const cycleStartMonth = this.cycleStartMonth(family);
    const year = eventAt.getFullYear();
    return month >= cycleStartMonth ? year : year - 1;
  }

  private cycleStartMonth(family: string): number {
    switch (family) {
      case 'mango':
      case 'litchi':
        return 11;
      case 'citrus':
        return 7;
      case 'guava':
      case 'pomegranate':
        return 6;
      case 'banana':
        return 1;
      default:
        return 1;
    }
  }
}
