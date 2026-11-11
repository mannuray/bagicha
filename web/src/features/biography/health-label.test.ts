import { describe, expect, it } from 'vitest';
import { healthLabel } from './health-label';

const NOW = new Date('2026-03-10T00:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 864e5).toISOString();
const diag = (severity: string, at: string) => ({ type: 'DIAGNOSIS', metadata: { severity }, timestamp: at });

describe('healthLabel', () => {
  it('needs attention after a HIGH diagnosis in the last 30 days', () => {
    expect(healthLabel({ health_status: 'Healthy' }, [diag('HIGH', daysAgo(10))], NOW)).toEqual({ label: null, tone: 'attention' });
  });

  it('a MEDIUM one counts too', () => {
    expect(healthLabel({ health_status: 'Healthy' }, [diag('MEDIUM', daysAgo(29))], NOW).tone).toBe('attention');
  });

  it('old or LOW diagnoses don’t', () => {
    expect(healthLabel({ health_status: 'Healthy' }, [diag('HIGH', daysAgo(40)), diag('LOW', daysAgo(1))], NOW)).toEqual({
      label: 'Healthy',
      tone: 'good',
    });
  });

  it('otherwise shows the plant’s own status', () => {
    expect(healthLabel({ health_status: 'Recovering' }, [], NOW)).toEqual({ label: 'Recovering', tone: 'good' });
  });

  it('a serious pest diagnosis needs attention too', () => {
    const pest = { type: 'PEST_DIAGNOSIS', metadata: { severity: 'HIGH' }, timestamp: daysAgo(3) };
    expect(healthLabel({ health_status: 'Healthy' }, [pest], NOW).tone).toBe('attention');
  });

  it('counts the window in India calendar days, like the rest of the app', () => {
    // 30 India days back from 10 Mar 05:30 IST is 8 Feb; 01:30 on 8 Feb IST still counts, though it is over 30×24 h ago.
    const edge = { type: 'DIAGNOSIS', metadata: { severity: 'HIGH' }, timestamp: '2026-02-07T20:00:00Z' };
    expect(healthLabel({ health_status: 'Healthy' }, [edge], NOW).tone).toBe('attention');
  });
});
