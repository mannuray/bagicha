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
});
