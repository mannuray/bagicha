import { UpstreamError } from '../../common/errors';
import { AiProvider } from '../ai';
import { DiagnosisPipelineService } from '../diagnosis';
import { PlantRecordService } from '../plant-ledger';
import { VisionService } from './vision.service';

function build(ai: Partial<AiProvider>) {
  const pipeline = {
    finalize: jest.fn(() =>
      Promise.resolve({
        session_id: 's',
        outcome_id: 'o',
        log_ids: [],
        tasks: [],
      }),
    ),
  };
  const plants = {
    getContextForAi: jest.fn(() => Promise.resolve({ plant: {} })),
    assertGrowing: jest.fn(() => Promise.resolve({})),
  };
  const service = new VisionService(
    ai as AiProvider,
    plants as unknown as PlantRecordService,
    pipeline as unknown as DiagnosisPipelineService,
  );
  return { service, pipeline, plants };
}

describe('VisionService.diagnosePlant', () => {
  it('saves nothing when the AI response is unusable', async () => {
    const { service, pipeline } = build({
      generateJson: () =>
        Promise.reject(new UpstreamError('AI_RESPONSE_INVALID', 'bad')),
    });
    await expect(
      service.diagnosePlant('u1', { image_base64: 'x', plant_id: 'p1' }),
    ).rejects.toMatchObject({ reason: 'AI_RESPONSE_INVALID' });
    expect(pipeline.finalize).not.toHaveBeenCalled();
  });

  it('saves nothing when the AI returns an empty object', async () => {
    const { service, pipeline } = build({
      generateJson: () => Promise.resolve({}),
    });
    await expect(
      service.diagnosePlant('u1', { image_base64: 'x', plant_id: 'p1' }),
    ).rejects.toMatchObject({ reason: 'AI_RESPONSE_INVALID' });
    expect(pipeline.finalize).not.toHaveBeenCalled();
  });

  it('persists a usable diagnosis for an owned plant through the pipeline', async () => {
    const { service, pipeline, plants } = build({
      generateJson: () =>
        Promise.resolve({ primary_issue: 'PEST', reasoning_summary: 'aphids' }),
    });
    const result = await service.diagnosePlant('u1', {
      image_base64: 'data:image/jpeg;base64,abc',
      plant_id: 'p1',
      note: 'leaves curling',
    });
    expect(plants.getContextForAi).toHaveBeenCalledWith('u1', 'p1');
    expect(pipeline.finalize).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        subject_type: 'TREE',
        subject_id: 'p1',
        primary_issue: 'PEST',
        user_note: 'leaves curling',
      }),
    );
    expect(result).toMatchObject({ persisted: true, session_id: 's' });
  });

  it('diagnoses without saving when no plant is given', async () => {
    const { service, pipeline, plants } = build({
      generateJson: () =>
        Promise.resolve({
          primary_issue: 'NUTRIENT',
          reasoning_summary: 'yellowing',
        }),
    });
    const result = await service.diagnosePlant('u1', { image_base64: 'abc' });
    expect(plants.getContextForAi).not.toHaveBeenCalled();
    expect(pipeline.finalize).not.toHaveBeenCalled();
    expect(result).toMatchObject({ persisted: false });
  });

  it('returns the cleaned-up diagnosis, not the raw model JSON', async () => {
    const { service } = build({
      generateJson: () =>
        Promise.resolve({
          primary_issue: 'pest',
          reasoning_summary: 'aphids',
          confidence: 87,
          recommended_actions: 'spray neem',
        }),
    });
    const result = await service.diagnosePlant('u1', { image_base64: 'abc' });
    expect(result.diagnosis).toMatchObject({
      primary_issue: 'PEST',
      confidence: '87',
      recommended_actions: ['spray neem'],
    });
  });
});
