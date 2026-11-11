import { describe, expect, it } from 'vitest';
import { toEndPayload } from './end-payload';

const today = '2026-11-12';

describe('toEndPayload: marking a tree as ended', () => {
  it('today or blank sends no date (the server uses now)', () => {
    expect(toEndPayload({ reason: 'WEATHER', date: '', note: '', linked: true }, today, null)).toEqual({ reason: 'WEATHER' });
    expect(toEndPayload({ reason: 'WEATHER', date: today, note: '', linked: true }, today, null)).toEqual({ reason: 'WEATHER' });
  });

  it('an earlier day is pinned to its IST noon; a note is trimmed', () => {
    expect(toEndPayload({ reason: 'OLD_AGE', date: '2026-10-01', note: ' storm ', linked: true }, today, null)).toEqual({
      reason: 'OLD_AGE', ended_at: '2026-10-01T06:30:00.000Z', note: 'storm',
    });
  });

  it('links the recent diagnosis only while the gardener keeps it linked', () => {
    expect(toEndPayload({ reason: 'DISEASE_OR_PEST', date: '', note: '', linked: true }, today, { id: 'j9' })).toEqual({ reason: 'DISEASE_OR_PEST', entry_id: 'j9' });
    expect(toEndPayload({ reason: 'DISEASE_OR_PEST', date: '', note: '', linked: false }, today, { id: 'j9' })).toEqual({ reason: 'DISEASE_OR_PEST' });
  });
});
