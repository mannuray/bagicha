import { LifecycleStage } from '@prisma/client';
import { carePhaseView, treeCareDue } from './engine';
import { AMLA_CARE } from './amla';
import { careApplies } from './region-care';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const bearing = LifecycleStage.MATURE_BEARING;

/** Spot checks copied from the approved table (docs/plant-care/amla.md). */
describe('amla care (approved table)', () => {
  it('North: dig the basin and give the main feed from Jan 1, CISH dose', () => {
    const { reminders } = treeCareDue(AMLA_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: ist('2020-01-01'),
      now: ist('2026-01-02'),
    });
    expect(reminders.find((r) => r.key === 'main_feed')).toMatchObject({
      title: 'Dig the basin and give the main feed',
      sourceKey: 'amla:main_feed:2026-01-01',
      // The table's 1.86 kg SSP, as the engine rounds it.
      amount:
        'For a 6-year-old tree: 30 kg FYM; if you also use fertiliser, add 660 g urea + 1.9 kg SSP + 510 g MOP',
    });
  });

  it('North: borax spray from Sep 1, with gloves', () => {
    const { reminders } = treeCareDue(AMLA_CARE, {
      region: 'NORTH_INDIA',
      stage: bearing,
      plantedAt: null,
      now: ist('2026-09-02'),
    });
    const spray = reminders.find((r) => r.key === 'borax_spray');
    expect(spray).toMatchObject({
      title: 'Spray borax against browning inside fruit',
      sourceKey: 'amla:borax_spray:2026-09-01',
    });
    expect(spray?.organic).toMatch(/Borax 6 g per litre.*wear gloves/);
  });

  it('young trees: frost cover from Dec 1 (the window crosses New Year)', () => {
    const { reminders } = treeCareDue(AMLA_CARE, {
      region: 'NORTH_INDIA',
      stage: LifecycleStage.SAPLING,
      plantedAt: null,
      now: ist('2026-01-10'),
    });
    expect(reminders.find((r) => r.key === 'frost_cover')).toMatchObject({
      title: 'Cover the young tree against frost',
      sourceKey: 'amla:frost_cover:2025-12-01',
    });
  });

  it('phases: flowering in Mar–Apr', () => {
    expect(
      carePhaseView(AMLA_CARE, {
        region: 'NORTH_INDIA',
        stage: bearing,
        now: ist('2026-03-15'),
      }).current_phase,
    ).toBe('flowering');
  });

  it('Central and East are pending: they keep the season pack', () => {
    expect(careApplies(AMLA_CARE, 'CENTRAL_INDIA')).toBe(false);
    expect(careApplies(AMLA_CARE, 'EAST_INDIA')).toBe(false);
    expect(careApplies(AMLA_CARE, 'NORTH_INDIA')).toBe(true);
  });
});
