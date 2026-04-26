import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  Tree,
} from '@prisma/client';
import { SeasonalIntelligenceService } from '../tree-ledger/services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from '../tree-ledger/services/species-normalization.service';
import { VisionRequestDto } from './dto/vision-request.dto';
import { GeminiService } from './services/gemini.service';

@Injectable()
export class VisionService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly seasonalIntelligenceService: SeasonalIntelligenceService,
    private readonly speciesNormalizationService: SpeciesNormalizationService,
  ) {}

  async identifyPlant(dto: VisionRequestDto) {
    const prompt = `
      Identify this plant species.
      Be specific and provide results in a structured JSON format.
      Include: common_name, scientific_name, description, and care_summary (light, water, soil).
      Format: JSON only.
    `;

    const response = await this.geminiService.analyzeImage(this.toImagePart(dto.image_base64), prompt);
    return this.geminiService.parseJsonResponse(response);
  }

  async diagnosePlant(dto: VisionRequestDto) {
    const treeContext = dto.tree_id ? await this.buildTreeContext(dto.tree_id) : null;
    const prompt = `
      Analyze this plant image for horticultural diagnosis.
      Use the image as the main evidence, but also use the supplied tree history and seasonal context when available.
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

      Tree context:
      ${treeContext ? JSON.stringify(treeContext) : 'No tree context provided'}

      User note:
      ${dto.note ?? 'No extra note provided'}
    `;

    const response = await this.geminiService.analyzeImage(this.toImagePart(dto.image_base64), prompt);
    const parsed = this.geminiService.parseJsonResponse(response) as Record<string, unknown>;

    if (!dto.tree_id) {
      return {
        diagnosis: parsed,
        persisted: false,
      };
    }

    const persisted = await this.persistTreeDiagnosis(dto, parsed);
    return {
      diagnosis: parsed,
      persisted: true,
      session_id: persisted.sessionId,
      outcome_id: persisted.outcomeId,
      log_ids: persisted.logIds,
      task_id: persisted.taskId,
    };
  }

  private async persistTreeDiagnosis(dto: VisionRequestDto, diagnosis: Record<string, unknown>) {
    const tree = await this.prisma.tree.findUnique({
      where: { id: dto.tree_id },
      include: {
        user: {
          select: {
            district: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!tree) {
      throw new Error('Tree not found for diagnosis');
    }

    const eventAt = dto.event_at ? new Date(dto.event_at) : new Date();
    const recordedAt = new Date();
    const cycleYear = this.resolveCycleYear(tree, eventAt);
    const primaryIssue = this.mapDiagnosisIssue(diagnosis.primary_issue);
    const severity = this.mapDiagnosisSeverity(diagnosis.severity);
    const actions = this.toStringArray(diagnosis.recommended_actions);
    const symptoms = this.toStringArray(diagnosis.symptoms);
    const secondaryIssues = this.toStringArray(diagnosis.secondary_issues);
    const confidence = this.toOptionalString(diagnosis.confidence);
    const affectedPart = this.toOptionalString(diagnosis.affected_part);
    const reasoningSummary =
      this.toOptionalString(diagnosis.reasoning_summary) ??
      this.toOptionalString(diagnosis.identification) ??
      'AI diagnosis recorded.';
    const followUpDays = this.toPositiveInt(diagnosis.follow_up_days) ?? 5;
    const needsFollowUp = this.toBoolean(diagnosis.needs_follow_up) ?? actions.length > 0;
    const relatedEventType = this.mapRelatedLogType(
      this.toOptionalString(diagnosis.related_event_type),
      primaryIssue,
    );
    const attachmentSummary = [
      {
        kind: 'image',
        source: 'vision_upload',
      },
    ];

    return this.prisma.$transaction(async (tx) => {
      const cycle = await tx.treeCycle.upsert({
        where: {
          tree_cycle_year: {
            tree_id: tree.id,
            cycle_year: cycleYear,
          },
        },
        create: {
          tree_id: tree.id,
          cycle_year: cycleYear,
        },
        update: {},
      });

      const session = await tx.diagnosisSession.create({
        data: {
          subject_type: DiagnosisSubjectType.TREE,
          subject_id: tree.id,
          tree_id: tree.id,
          status: DiagnosisStatus.RESOLVED,
          messages: [
            {
              role: 'user',
              note: dto.note ?? null,
              image_provided: true,
            },
            {
              role: 'assistant',
              summary: reasoningSummary,
              primary_issue: primaryIssue,
              confidence,
              severity,
            },
          ] as Prisma.InputJsonValue,
          attachments: attachmentSummary as Prisma.InputJsonValue,
          started_at: recordedAt,
          closed_at: recordedAt,
        },
      });

      const outcome = await tx.diagnosisOutcome.create({
        data: {
          session_id: session.id,
          tree_id: tree.id,
          event_at: eventAt,
          primary_issue: primaryIssue,
          secondary_issues: secondaryIssues,
          symptoms: symptoms as Prisma.InputJsonValue,
          confidence,
          severity,
          affected_part: affectedPart,
          reasoning_summary: reasoningSummary,
          recommended_actions: actions as Prisma.InputJsonValue,
          needs_follow_up: needsFollowUp,
          follow_up_days: needsFollowUp ? followUpDays : null,
          attachments: attachmentSummary as Prisma.InputJsonValue,
        },
      });

      const diagnosisLog = await tx.log.create({
        data: {
          tree_id: tree.id,
          tree_cycle_id: cycle.id,
          diagnosis_outcome_id: outcome.id,
          type: LogType.DIAGNOSIS,
          content: dto.note ?? reasoningSummary,
          metadata: {
            diagnosis_session_id: session.id,
            primary_issue: primaryIssue,
            symptoms,
            confidence,
            severity,
            affected_part: affectedPart,
            recommended_actions: actions,
            attachments: attachmentSummary,
          } as Prisma.InputJsonValue,
          timestamp: eventAt,
          recorded_at: recordedAt,
        },
      });

      const logIds = [diagnosisLog.id];

      if (relatedEventType && relatedEventType !== LogType.DIAGNOSIS) {
        const relatedLog = await tx.log.create({
          data: {
            tree_id: tree.id,
            tree_cycle_id: cycle.id,
            diagnosis_outcome_id: outcome.id,
            type: relatedEventType,
            content: reasoningSummary,
            metadata: {
              diagnosis_session_id: session.id,
              diagnosis_outcome_id: outcome.id,
              inferred_from_diagnosis: true,
              primary_issue: primaryIssue,
              confidence,
              severity,
            } as Prisma.InputJsonValue,
            timestamp: eventAt,
            recorded_at: recordedAt,
          },
        });
        logIds.push(relatedLog.id);
      }

      const task = needsFollowUp
        ? await tx.task.create({
            data: {
              tree_id: tree.id,
              tree_cycle_id: cycle.id,
              diagnosis_outcome_id: outcome.id,
              type: this.mapTaskType(primaryIssue),
              title: this.buildTaskTitle(tree.name, primaryIssue),
              category: this.mapTaskCategory(primaryIssue),
              priority: this.mapTaskPriority(severity),
              source: TaskSource.MANUAL,
              source_key: `diagnosis:${outcome.id}`,
              reason: reasoningSummary,
              metadata: {
                diagnosis_session_id: session.id,
                diagnosis_outcome_id: outcome.id,
                recommended_actions: actions,
                primary_issue: primaryIssue,
              } as Prisma.InputJsonValue,
              due_date: new Date(eventAt.getTime() + followUpDays * 24 * 60 * 60 * 1000),
            },
          })
        : null;

      return {
        sessionId: session.id,
        outcomeId: outcome.id,
        logIds,
        taskId: task?.id ?? null,
      };
    });
  }

  private async buildTreeContext(treeId: string) {
    const tree = await this.prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        user: {
          select: {
            district: true,
            latitude: true,
            longitude: true,
          },
        },
        cycles: {
          orderBy: { cycle_year: 'desc' },
          take: 2,
        },
        logs: {
          where: {
            type: {
              in: [LogType.DIAGNOSIS, LogType.PEST_DIAGNOSIS, LogType.TREATMENT, LogType.WATERING_STRESS, LogType.HARVEST],
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 8,
        },
        tasks: {
          orderBy: { due_date: 'asc' },
          take: 6,
        },
        diagnosis_outcomes: {
          orderBy: { event_at: 'desc' },
          take: 3,
        },
      },
    });

    if (!tree) return null;

    const seasonalState = this.seasonalIntelligenceService.inferTreeSeasonalState(tree, tree.user);
    const speciesFamily = this.speciesNormalizationService.resolveSpeciesFamily(tree);

    return {
      tree: {
        id: tree.id,
        name: tree.name,
        species_family: speciesFamily,
        species: tree.species,
        variety: tree.variety,
        lifecycle_stage: tree.lifecycle_stage,
        health_status: tree.health_status,
      },
      location: {
        district: tree.user.district,
        latitude: tree.user.latitude,
        longitude: tree.user.longitude,
      },
      seasonal_state: seasonalState,
      recent_cycles: tree.cycles.map((cycle) => ({
        cycle_year: cycle.cycle_year,
        yield_quantity: cycle.yield_quantity,
        yield_unit: cycle.yield_unit,
        yield_quality: cycle.yield_quality,
        flower_drop_level: cycle.flower_drop_level,
        fruit_drop_level: cycle.fruit_drop_level,
        stress_score: cycle.stress_score,
        pest_pressure_score: cycle.pest_pressure_score,
        cycle_summary: cycle.cycle_summary,
      })),
      recent_logs: tree.logs.map((log) => ({
        type: log.type,
        content: log.content,
        metadata: log.metadata,
        timestamp: log.timestamp,
      })),
      recent_diagnoses: tree.diagnosis_outcomes.map((outcome) => ({
        primary_issue: outcome.primary_issue,
        severity: outcome.severity,
        confidence: outcome.confidence,
        reasoning_summary: outcome.reasoning_summary,
        event_at: outcome.event_at,
      })),
      open_tasks: tree.tasks.map((task) => ({
        title: task.title,
        type: task.type,
        status: task.status,
        due_date: task.due_date,
      })),
    };
  }

  private toImagePart(imageBase64: string) {
    return {
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: 'image/jpeg',
      },
    };
  }

  private resolveCycleYear(tree: Pick<Tree, 'name' | 'species' | 'variety'>, referenceDate = new Date()): number {
    const speciesFamily = this.speciesNormalizationService.resolveSpeciesFamily(tree);
    const cycleStartMonth = this.getCycleStartMonth(speciesFamily);
    const month = referenceDate.getUTCMonth() + 1;
    const year = referenceDate.getUTCFullYear();
    return month >= cycleStartMonth ? year : year - 1;
  }

  private getCycleStartMonth(speciesFamily: string): number {
    switch (speciesFamily) {
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

  private mapDiagnosisIssue(value: unknown): DiagnosisIssueType {
    const normalized = this.toOptionalString(value)?.toUpperCase();
    switch (normalized) {
      case 'PEST':
        return DiagnosisIssueType.PEST;
      case 'DISEASE':
        return DiagnosisIssueType.DISEASE;
      case 'NUTRIENT':
        return DiagnosisIssueType.NUTRIENT;
      case 'WATER_STRESS':
        return DiagnosisIssueType.WATER_STRESS;
      case 'WEATHER_DAMAGE':
        return DiagnosisIssueType.WEATHER_DAMAGE;
      case 'FRUIT_DROP':
        return DiagnosisIssueType.FRUIT_DROP;
      case 'FLOWER_DROP':
        return DiagnosisIssueType.FLOWER_DROP;
      default:
        return DiagnosisIssueType.UNKNOWN;
    }
  }

  private mapDiagnosisSeverity(value: unknown): DiagnosisSeverity {
    const normalized = this.toOptionalString(value)?.toUpperCase();
    switch (normalized) {
      case 'LOW':
        return DiagnosisSeverity.LOW;
      case 'MEDIUM':
        return DiagnosisSeverity.MEDIUM;
      case 'HIGH':
        return DiagnosisSeverity.HIGH;
      default:
        return DiagnosisSeverity.UNKNOWN;
    }
  }

  private mapRelatedLogType(value: string | null, primaryIssue: DiagnosisIssueType): LogType {
    const normalized = value?.toUpperCase();
    switch (normalized) {
      case 'PEST_DIAGNOSIS':
        return LogType.PEST_DIAGNOSIS;
      case 'FRUIT_DROP':
        return LogType.FRUIT_DROP;
      case 'FLOWER_DROP':
        return LogType.FLOWER_DROP;
      case 'WATERING_STRESS':
        return LogType.WATERING_STRESS;
      case 'WEATHER_DAMAGE':
        return LogType.WEATHER_DAMAGE;
      case 'DIAGNOSIS':
        return LogType.DIAGNOSIS;
      default:
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
            return LogType.DIAGNOSIS;
        }
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

  private mapTaskPriority(severity: DiagnosisSeverity): TaskPriority {
    switch (severity) {
      case DiagnosisSeverity.HIGH:
        return TaskPriority.HIGH;
      case DiagnosisSeverity.MEDIUM:
        return TaskPriority.MEDIUM;
      default:
        return TaskPriority.LOW;
    }
  }

  private buildTaskTitle(treeName: string, issue: DiagnosisIssueType): string {
    switch (issue) {
      case DiagnosisIssueType.PEST:
        return `Treat suspected pest issue on ${treeName}`;
      case DiagnosisIssueType.DISEASE:
        return `Follow up on disease symptoms for ${treeName}`;
      case DiagnosisIssueType.WATER_STRESS:
        return `Recheck watering stress on ${treeName}`;
      case DiagnosisIssueType.FRUIT_DROP:
        return `Inspect fruit drop on ${treeName}`;
      case DiagnosisIssueType.FLOWER_DROP:
        return `Inspect flower drop on ${treeName}`;
      default:
        return `Recheck diagnosis on ${treeName}`;
    }
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  private toOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private toPositiveInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value);
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return null;
  }

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return null;
  }
}
