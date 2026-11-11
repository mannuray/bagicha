import { istNoonIso } from '../../lib/ist';
import type { NewMoment } from './api';
import type { MomentDraft } from './draft';
import { DROP_TYPES } from './log-types';

/** Log a moment as data: a blank draft and the entry it becomes (no React). */


export const blankMoment = (): MomentDraft => ({ type: 'NOTE', content: '', unit: 'kg' });

export function toMoment(d: MomentDraft, photoKey: string | null): NewMoment {
  const metadata: Record<string, unknown> = {};
  if (photoKey) metadata.photo_key = photoKey;
  if (DROP_TYPES.has(d.type) && d.severity) metadata.severity = d.severity;
  if (d.type === 'HARVEST') {
    if (d.quantity && Number(d.quantity) > 0) metadata.quantity_value = Number(d.quantity);
    if (d.quantity && d.unit) metadata.quantity_unit = d.unit;
    if (d.quality) metadata.quality = d.quality;
  }
  const moment: NewMoment = { type: d.type };
  if (d.content.trim()) moment.content = d.content.trim();
  if (Object.keys(metadata).length > 0) moment.metadata = metadata;
  if (d.date) moment.event_at = istNoonIso(d.date);
  return moment;
}

