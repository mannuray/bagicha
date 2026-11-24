import sharp from 'sharp';
import { UpstreamError } from '../../common/errors';
import { AiProvider } from '../ai';
import { DiagnosisPipelineService } from '../diagnosis';
import { PlantRecordService } from '../plant-ledger';
import { VisionService } from './vision.service';

/** A real 2×2 JPEG: photos are decoded before the AI sees them. */
const TINY_JPEG =
  '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAB//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJoAfi5//9k=';

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
      service.diagnosePlant('u1', { image_base64: TINY_JPEG, plant_id: 'p1' }),
    ).rejects.toMatchObject({ reason: 'AI_RESPONSE_INVALID' });
    expect(pipeline.finalize).not.toHaveBeenCalled();
  });

  it('saves nothing when the AI returns an empty object', async () => {
    const { service, pipeline } = build({
      generateJson: () => Promise.resolve({}),
    });
    await expect(
      service.diagnosePlant('u1', { image_base64: TINY_JPEG, plant_id: 'p1' }),
    ).rejects.toMatchObject({ reason: 'AI_RESPONSE_INVALID' });
    expect(pipeline.finalize).not.toHaveBeenCalled();
  });

  it('persists a usable diagnosis for an owned plant through the pipeline', async () => {
    const { service, pipeline, plants } = build({
      generateJson: () =>
        Promise.resolve({ primary_issue: 'PEST', reasoning_summary: 'aphids' }),
    });
    const result = await service.diagnosePlant('u1', {
      image_base64: `data:image/jpeg;base64,${TINY_JPEG}`,
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
    const result = await service.diagnosePlant('u1', {
      image_base64: TINY_JPEG,
    });
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
    const result = await service.diagnosePlant('u1', {
      image_base64: TINY_JPEG,
    });
    expect(result.diagnosis).toMatchObject({
      primary_issue: 'PEST',
      confidence: '87',
      recommended_actions: ['spray neem'],
    });
  });
});

const buildPhoto = () => {
  const ai = {
    generateJson: jest.fn().mockResolvedValue({ species: 'Mango' }),
  };
  const service = new VisionService(
    ai as unknown as AiProvider,
    {} as PlantRecordService,
    {} as DiagnosisPipelineService,
  );
  return { ai, service };
};

describe('VisionService photos', () => {
  it('refuses bytes that are not an image before any AI call', async () => {
    const { ai, service } = buildPhoto();
    await expect(
      service.identifyPlant('u', {
        image_base64: Buffer.from('not an image').toString('base64'),
      }),
    ).rejects.toMatchObject({ reason: 'MEDIA_TYPE_UNSUPPORTED' });
    expect(ai.generateJson).not.toHaveBeenCalled();
  });

  it('sends a re-encoded JPEG to the AI, also from a data URL', async () => {
    const { ai, service } = buildPhoto();
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#0a0' },
    })
      .png()
      .toBuffer();
    await service.identifyPlant('u', {
      image_base64: `data:image/png;base64,${png.toString('base64')}`,
    });
    const image = ai.generateJson.mock.calls[0][0].image;
    expect(image.mimeType).toBe('image/jpeg');
    const meta = await sharp(Buffer.from(image.data, 'base64')).metadata();
    expect(meta.format).toBe('jpeg');
  });
});
