import { describe, expect, it } from 'vitest';
import { diagnosePayload, identifyPayload } from './scan-payload';

const scan = { mode: 'diagnose' as const, base64: 'b64', previewUrl: null, plantId: 'p1', plantName: 'Aam', note: 'spots' };

describe('scan payloads', () => {
  it('diagnose sends the photo, the plant and the note (when there is one)', () => {
    expect(diagnosePayload(scan)).toEqual({ image_base64: 'b64', plant_id: 'p1', note: 'spots' });
    expect(diagnosePayload({ ...scan, note: undefined })).toEqual({ image_base64: 'b64', plant_id: 'p1' });
  });
  it('identify sends only the photo', () => {
    expect(identifyPayload({ ...scan, mode: 'identify' })).toEqual({ image_base64: 'b64' });
  });
});
