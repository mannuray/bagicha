import { Injectable } from '@nestjs/common';
import { DiagnosisSubjectType } from '@prisma/client';
import { AiImage, AiProvider } from '../ai';
import { DiagnosisPipelineService } from '../diagnosis';
import { PlantRecordService } from '../plant-ledger';
import { mapAiDiagnosis } from './ai-diagnosis.mapper';
import { buildDiagnosisPrompt, buildIdentifyPrompt } from './diagnosis-prompt';
import { VisionRequestDto } from './dto/vision-request.dto';

function toImage(imageBase64: string): AiImage {
  return {
    data: imageBase64.split(',')[1] || imageBase64,
    mimeType: 'image/jpeg',
  };
}

/** Photo → AI → (optionally) saved diagnosis on the plant record. */
@Injectable()
export class VisionService {
  constructor(
    private readonly ai: AiProvider,
    private readonly plants: PlantRecordService,
    private readonly diagnoses: DiagnosisPipelineService,
  ) {}

  identifyPlant(_userId: string, dto: VisionRequestDto) {
    return this.ai.generateJson({
      feature: 'identify',
      prompt: buildIdentifyPrompt(),
      image: toImage(dto.image_base64),
    });
  }

  async diagnosePlant(userId: string, dto: VisionRequestDto) {
    // A diagnosis is saved to the tree, so an ended tree can't take one.
    if (dto.plant_id) await this.plants.assertGrowing(userId, dto.plant_id);
    const context = dto.plant_id
      ? await this.plants.getContextForAi(userId, dto.plant_id)
      : null;
    const raw = await this.ai.generateJson({
      feature: 'diagnose',
      prompt: buildDiagnosisPrompt(context, dto.note ?? null),
      image: toImage(dto.image_base64),
    });
    const diagnosis = mapAiDiagnosis(raw);

    if (!dto.plant_id) {
      return { diagnosis, persisted: false };
    }

    const saved = await this.diagnoses.finalize(userId, {
      ...diagnosis,
      subject_type: DiagnosisSubjectType.TREE,
      subject_id: dto.plant_id,
      event_at: dto.event_at,
      user_note: dto.note,
      attachments: [{ kind: 'image', source: 'vision_upload' }],
    });
    return {
      diagnosis,
      persisted: true,
      session_id: saved.session_id,
      outcome_id: saved.outcome_id,
      log_ids: saved.log_ids,
      task_id: saved.tasks.find((t) => t.taskId)?.taskId ?? null,
    };
  }
}
