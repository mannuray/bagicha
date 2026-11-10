import { buildPersonalizedOverlay } from './overlay-rules';

const NOW = new Date('2026-05-01T00:00:00Z');
const pack = { current_phase: 'fruit_development' };

describe('buildPersonalizedOverlay', () => {
  it('adds watering tasks when recent entries mention dryness', () => {
    const overlay = buildPersonalizedOverlay(
      { name: 'Aam' },
      [{ content: 'leaves wilting, soil dry', metadata: null, timestamp: NOW }],
      pack,
      NOW,
    );
    expect(overlay?.adjusted_phase).toBe(
      'fruit_development_with_dryness_attention',
    );
    expect(overlay?.personalized_tasks).toHaveLength(2);
    expect(overlay?.expires_at.toISOString()).toBe('2026-05-03T00:00:00.000Z');
    expect(overlay?.refreshed_at).toEqual(NOW);
  });

  it('returns null without a dryness signal', () => {
    expect(
      buildPersonalizedOverlay(
        { name: 'Aam' },
        [{ content: 'flowering well', metadata: null, timestamp: NOW }],
        pack,
        NOW,
      ),
    ).toBeNull();
  });
});
