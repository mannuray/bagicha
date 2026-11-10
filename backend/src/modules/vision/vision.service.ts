import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisSubjectType,
  LogType,
} from '@prisma/client';
import { SeasonalIntelligenceService } from '../plant-ledger/services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from '../plant-ledger/services/species-normalization.service';
import { DiagnosisPipelineService } from '../diagnosis/services/diagnosis-pipeline.service';
import { VisionRequestDto } from './dto/vision-request.dto';
import { GeminiService } from './services/gemini.service';

@Injectable()
export class VisionService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly seasonalIntelligenceService: SeasonalIntelligenceService,
    private readonly speciesNormalizationService: SpeciesNormalizationService,
    private readonly diagnosisPipeline: DiagnosisPipelineService,
  ) {}

  async identifyPlant(dto: VisionRequestDto) {
    const prompt = `
      Identify this plant species.
      Be specific and provide results in a structured JSON format.
      Include: common_name, scientific_name, description, and care_summary (light, water, soil).
      Format: JSON only.
    `;

    const response = await this.geminiService.analyzeImage(
      this.toImagePart(dto.image_base64),
      prompt,
    );
    return this.geminiService.parseJsonResponse(response);
  }

  async diagnosePlant(dto: VisionRequestDto) {
    const treeContext = dto.plant_id
      ? await this.buildTreeContext(dto.plant_id)
      : null;
    const prompt = `
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
      ${treeContext ? JSON.stringify(treeContext) : 'No plant context provided'}

      User note:
      ${dto.note ?? 'No extra note provided'}
    `;

    const response = await this.geminiService.analyzeImage(
      this.toImagePart(dto.image_base64),
      prompt,
    );
    const parsed = this.geminiService.parseJsonResponse(response) as Record<
      string,
      unknown
    >;

    if (!dto.plant_id) {
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

  private async persistTreeDiagnosis(
    dto: VisionRequestDto,
    diagnosis: Record<string, unknown>,
  ) {
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
    const needsFollowUp =
      this.toBoolean(diagnosis.needs_follow_up) ?? actions.length > 0;
    const relatedEventType = this.mapRelatedLogType(
      this.toOptionalString(diagnosis.related_event_type),
      primaryIssue,
    );
    const attachments = [{ kind: 'image', source: 'vision_upload' }];

    const result = await this.diagnosisPipeline.finalize({
      subject_type: DiagnosisSubjectType.TREE,
      subject_id: dto.plant_id!,
      event_at: dto.event_at,
      primary_issue: primaryIssue,
      secondary_issues: secondaryIssues,
      symptoms,
      affected_part: affectedPart ?? undefined,
      severity,
      confidence: confidence ?? undefined,
      reasoning_summary: reasoningSummary,
      recommended_actions: actions,
      needs_follow_up: needsFollowUp,
      follow_up_days: followUpDays,
      user_note: dto.note,
      related_event_type: relatedEventType ?? undefined,
      attachments,
    });

    return {
      sessionId: result.session_id,
      outcomeId: result.outcome_id,
      logIds: result.log_ids,
      taskId: result.task_ids[0] ?? null,
      taskIds: result.task_ids,
    };
  }

  private async buildTreeContext(treeId: string) {
    const plant = await this.prisma.plant.findUnique({
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
        journal_entries: {
          where: {
            type: {
              in: [
                LogType.DIAGNOSIS,
                LogType.PEST_DIAGNOSIS,
                LogType.TREATMENT,
                LogType.WATERING_STRESS,
                LogType.HARVEST,
              ],
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

    if (!plant) return null;

    const seasonalState =
      this.seasonalIntelligenceService.inferTreeSeasonalState(
        plant,
        plant.user,
      );
    const speciesFamily =
      this.speciesNormalizationService.resolveSpeciesFamily(plant);

    return {
      plant: {
        id: plant.id,
        name: plant.name,
        species_family: speciesFamily,
        species: plant.species,
        variety: plant.variety,
        lifecycle_stage: plant.lifecycle_stage,
        health_status: plant.health_status,
      },
      location: {
        district: plant.user.district,
        latitude: plant.user.latitude,
        longitude: plant.user.longitude,
      },
      seasonal_state: seasonalState,
      recent_cycles: plant.cycles.map((cycle) => ({
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
      recent_logs: plant.journal_entries.map((log) => ({
        type: log.type,
        content: log.content,
        metadata: log.metadata,
        timestamp: log.timestamp,
      })),
      recent_diagnoses: plant.diagnosis_outcomes.map((outcome) => ({
        primary_issue: outcome.primary_issue,
        severity: outcome.severity,
        confidence: outcome.confidence,
        reasoning_summary: outcome.reasoning_summary,
        event_at: outcome.event_at,
      })),
      open_tasks: plant.tasks.map((task) => ({
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

  private mapRelatedLogType(
    value: string | null,
    primaryIssue: DiagnosisIssueType,
  ): LogType {
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

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  private toOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private toPositiveInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
      return Math.round(value);
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
