import { CATALOGUE_SEED } from '../../catalogue';
import { seededCatalogue } from '../../catalogue/testing';
import { buildPersonalizedOverlay, overlayInLanguage } from './overlay-rules';

const catalogue = seededCatalogue();
const en = (ref: Parameters<typeof catalogue.advice>[0]) =>
  catalogue.advice(ref, 'en');

const NOW = new Date('2026-05-01T00:00:00Z');
const phase = 'fruit_development';

describe('buildPersonalizedOverlay', () => {
  it('adds watering tasks when recent entries mention dryness', () => {
    const overlay = buildPersonalizedOverlay(
      { name: 'Aam' },
      [{ content: 'leaves wilting, soil dry', metadata: null, timestamp: NOW }],
      phase,
      NOW,
      en,
    );
    expect(overlay?.adjusted_phase).toBe(
      'fruit_development_with_dryness_attention',
    );
    expect(overlay?.personalized_tasks).toHaveLength(2);
    expect(overlay?.expires_at.toISOString()).toBe('2026-05-03T00:00:00.000Z');
    expect(overlay?.refreshed_at).toEqual(NOW);
  });

  it('names no season phase for a tree whose care is coming', () => {
    const overlay = buildPersonalizedOverlay(
      { name: 'Jamun' },
      [{ content: 'soil dry', metadata: null, timestamp: NOW }],
      null,
      NOW,
      en,
    );
    expect(overlay?.adjusted_phase).toBe('dryness_attention');
  });

  it('returns null without a dryness signal', () => {
    expect(
      buildPersonalizedOverlay(
        { name: 'Aam' },
        [{ content: 'flowering well', metadata: null, timestamp: NOW }],
        phase,
        NOW,
        en,
      ),
    ).toBeNull();
  });
});

describe('dryness overlay text', () => {
  const overlay = () =>
    buildPersonalizedOverlay(
      { name: 'Aam' },
      [{ content: 'soil dry', metadata: null, timestamp: NOW }],
      phase,
      NOW,
      en,
    )!;

  it('keeps its English word for word', () => {
    const o = overlay();
    expect(o.priority_actions).toEqual([
      'Water the plant today',
      'Recheck leaf stress after watering',
    ]);
    expect(o.suppressed_actions).toEqual([
      'Do not defer irrigation until the next normal checkpoint',
    ]);
    expect(o.reasoning_summary).toBe(
      'Recent journal_entries indicate dryness or water stress, so irrigation support is needed immediately.',
    );
    expect(o.personalized_tasks.map((t) => [t.title, t.reason])).toEqual([
      ['Water the plant today', 'Dryness signal detected for Aam'],
      [
        'Recheck the plant after watering',
        'Confirm recovery after dryness intervention',
      ],
    ]);
  });

  it('reads a saved overlay in Hindi where the catalogue has it, English otherwise', () => {
    const hindi = seededCatalogue({
      ...CATALOGUE_SEED,
      advice: CATALOGUE_SEED.advice.map((a) =>
        a.key === 'overlay.dryness.water_today'
          ? { ...a, hi: 'आज पानी दें' }
          : a,
      ),
    });
    const saved = overlay();
    const view = overlayInLanguage(saved, hindi, 'hi');
    expect(view.priority_actions).toEqual([
      'आज पानी दें',
      'Recheck leaf stress after watering',
    ]);
    expect(overlayInLanguage(saved, hindi, 'en')).toEqual(saved);
  });
});
