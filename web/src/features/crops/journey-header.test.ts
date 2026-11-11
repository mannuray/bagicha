import { describe, expect, it } from 'vitest';
import { cropStatusLine, harvestsIn, journeyStep, journeySteps, openCycle } from './journey-header';

describe('cropStatusLine', () => {
  it('counts IST calendar days, so a crop sown last night is on day 1 this morning', () => {
    // Sown 10 Nov 21:00 IST; checked 11 Nov 08:00 IST (11 hours later).
    const line = cropStatusLine('IN_GROUND', '2026-11-10T15:30:00Z', 'Bag 1', new Date('2026-11-11T02:30:00Z'));
    expect(line).toEqual({ stage: 'IN_GROUND', day: 1, place: 'Bag 1' });
  });

  it('is day 0 on the day of sowing', () => {
    expect(cropStatusLine('NURSERY', '2026-11-11T01:00:00Z', 'Bag 1', new Date('2026-11-11T15:00:00Z'))).toEqual({ stage: 'NURSERY', day: 0, place: null });
  });
});

describe('the journey steps', () => {
  it('a nursery crop has a transplant step; a direct-sown one does not', () => {
    expect(journeySteps(true)).toEqual(['planned', 'seeds', 'sown', 'transplanted', 'harvesting', 'ended']);
    expect(journeySteps(false)).toEqual(['planned', 'seeds', 'sown', 'harvesting', 'ended']);
  });

  it('maps the crop stage to its step', () => {
    expect(journeyStep('PLANNED', false)).toBe('planned');
    expect(journeyStep(null, false)).toBe('planned');
    expect(journeyStep('NURSERY', true)).toBe('sown');
    expect(journeyStep('IN_GROUND', true)).toBe('transplanted');
    expect(journeyStep('IN_GROUND', false)).toBe('sown');
    expect(journeyStep('HARVESTING', false)).toBe('harvesting');
    expect(journeyStep('RESTING', false)).toBe('ended');
  });
});

describe('openCycle and harvestsIn', () => {
  const cycles = [
    { id: 'old', started_at: '2025-06-01', closed_at: '2025-10-01' },
    { id: 'now', started_at: '2026-06-01', closed_at: null },
  ];
  it('finds the season that is started and not closed', () => {
    expect(openCycle(cycles)?.id).toBe('now');
    expect(openCycle([cycles[0]])).toBeNull();
    expect(openCycle(undefined)).toBeNull();
  });

  it('counts harvests in that season only', () => {
    const entries = [
      { type: 'HARVEST', plant_cycle_id: 'now' },
      { type: 'HARVEST', plant_cycle_id: 'old' },
      { type: 'NOTE', plant_cycle_id: 'now' },
    ];
    expect(harvestsIn(entries, 'now')).toBe(1);
    expect(harvestsIn(entries, null)).toBe(0);
  });
});
