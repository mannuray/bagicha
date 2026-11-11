import type { ScanPayload } from './api';
import type { PendingScan } from './scan-state';

/** What a diagnosis sends: the photo, the plant, and the note when there is one. */
export function diagnosePayload(scan: PendingScan): ScanPayload {
  return { image_base64: scan.base64, plant_id: scan.plantId, ...(scan.note ? { note: scan.note } : {}) };
}

/** What an identification sends: only the photo. */
export function identifyPayload(scan: PendingScan): ScanPayload {
  return { image_base64: scan.base64 };
}
