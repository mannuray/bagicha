import { Injectable } from '@nestjs/common';
import { DiagnosisSubjectType } from '@prisma/client';
import { AiImage, AiProvider } from '../ai';
import { decodeSafely } from '../media';
import { DiagnosisPipelineService } from '../diagnosis';
import { PlantRecordService } from '../plant-ledger';
import { mapAiDiagnosis } from './ai-diagnosis.mapper';
import { buildDiagnosisPrompt, buildIdentifyPrompt } from './diagnosis-prompt';
import { VisionRequestDto } from './dto/vision-request.dto';
import { toIdentification } from '../ai';

/**
 * The photo as the AI will see it: decoded and re-encoded like any upload, so
 * only a real JPEG/PNG/WebP within the pixel cap ever reaches the provider.
 */
async function toImage(imageBase64: string): Promise<AiImage> {
  const b64 = imageBase64.split(',')[1] || imageBase64;
  const { data } = await decodeSafely(Buffer.from(b64, 'base64'));
  return { data: data.toString('base64'), mimeType: 'image/jpeg' };
}

/** Photo → AI → (optionally) saved diagnosis on the plant record. */
@Injectable()
export class VisionService {
  constructor(
    private readonly ai: AiProvider,
    private readonly plants: PlantRecordService,
    private readonly diagnoses: DiagnosisPipelineService,
  ) {}

  async identifyPlant(_userId: string, dto: VisionRequestDto) {
    const raw = await this.ai.generateJson({
      feature: 'identify',
      prompt: buildIdentifyPrompt(),
      image: await toImage(dto.image_base64),
    });
    return toIdentification(raw);
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
      image: await toImage(dto.image_base64),
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
