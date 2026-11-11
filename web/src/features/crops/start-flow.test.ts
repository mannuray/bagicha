import { describe, expect, it } from 'vitest';
import { sunMismatch, startEntry, startProgress } from './start-flow';

describe('the start sheet steps', () => {
  it('a direct-sown crop: path, then place', () => {
    expect(startProgress({ path: null, method: 'DIRECT', nurseryCrop: false })).toEqual({ step: 'path', steps: ['path', 'place'], at: 0 });
    expect(startProgress({ path: 'seeds', method: 'DIRECT', nurseryCrop: false })).toEqual({ step: 'place', steps: ['path', 'place'], at: 1 });
  });

  it('a nursery crop from seed asks the method; a nursery tray needs no place', () => {
    expect(startProgress({ path: 'seeds', method: null, nurseryCrop: true })).toEqual({ step: 'method', steps: ['path', 'method', 'place'], at: 1 });
    expect(startProgress({ path: 'seeds', method: 'NURSERY', nurseryCrop: true })).toEqual({ step: 'confirm', steps: ['path', 'method'], at: 1 });
    expect(startProgress({ path: 'seeds', method: 'DIRECT', nurseryCrop: true })).toEqual({ step: 'place', steps: ['path', 'method', 'place'], at: 2 });
  });

  it('bought seedlings skip the method; transplanting is just the place', () => {
    expect(startProgress({ path: 'seedlings', method: null, nurseryCrop: true })).toEqual({ step: 'place', steps: ['path', 'place'], at: 1 });
    expect(startProgress({ path: 'transplant', method: null, nurseryCrop: true })).toEqual({ step: 'place', steps: ['place'], at: 0 });
  });
});

describe('startEntry: what the sheet logs', () => {
  it('seeds log a sowing with its method and place', () => {
    expect(startEntry('seeds', 'NURSERY', null)).toEqual({ type: 'SOWING', metadata: { method: 'NURSERY' } });
    expect(startEntry('seeds', null, 'pl1')).toEqual({ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl1' } });
  });

  it('seedlings and transplanting log a transplant', () => {
    expect(startEntry('seedlings', null, 'pl1')).toEqual({ type: 'TRANSPLANTING', metadata: { place_id: 'pl1' } });
    expect(startEntry('transplant', null, null)).toEqual({ type: 'TRANSPLANTING', metadata: {} });
  });
});

describe('sunMismatch', () => {
  it('warns only when a full-sun crop goes somewhere with less sun', () => {
    expect(sunMismatch('FULL', 'PARTIAL')).toBe(true);
    expect(sunMismatch('FULL', 'SHADE')).toBe(true);
    expect(sunMismatch('FULL', 'FULL')).toBe(false);
    expect(sunMismatch('PARTIAL', 'SHADE')).toBe(false);
    expect(sunMismatch('FULL', null)).toBe(false);
  });
});
