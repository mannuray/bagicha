import { buildTaskSourceSummary } from './task-view';

describe('buildTaskSourceSummary', () => {
  it('an old season-pack reminder never repeats the retired generic phase', () => {
    expect(
      buildTaskSourceSummary({
        source: 'SEASONAL_PACK',
        seasonal_pack: {
          current_phase: 'seasonal_growth_window',
          upcoming_phase: 'productive_phase',
        },
      }),
    ).toBe('From the old general season tips; it clears at the next refresh.');
  });
});
