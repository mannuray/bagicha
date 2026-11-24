import { seededCatalogue, seededCatalogueStore } from '../../catalogue/testing';
import type { CycleRepository } from '../repositories/cycle.repository';
import type { JournalRepository } from '../repositories/journal.repository';
import { CycleService } from './cycle.service';
import type { PlantAccess } from './plant-access.service';
import type { SpeciesNormalizationService } from './species-normalization.service';

const row = (over: Record<string, unknown>) => ({
  id: 'c1',
  cycle_year: 2026,
  season_no: 1,
  journal_entries: [],
  cycle_summary: 'Flowering was recorded fruit set was observed.',
  recommended_next_cycle_actions: [
    'Plan moisture checks around flowering and fruit-development windows.',
  ],
  cycle_summary_refs: [
    { key: 'cycle.summary.flowering' },
    { key: 'cycle.summary.fruit_set' },
  ],
  recommended_actions_refs: [{ key: 'cycle.next.moisture_checks' }],
  ...over,
});

const serviceWith = (rows: object[]) =>
  new CycleService(
    {
      listForPlant: jest.fn().mockResolvedValue({ rows, total: rows.length }),
    } as unknown as CycleRepository,
    {} as JournalRepository,
    {} as SpeciesNormalizationService,
    { owned: jest.fn() } as unknown as PlantAccess,
    seededCatalogueStore(),
  );

describe('season list text', () => {
  it('renders from the saved keys when they match the saved English', async () => {
    const page = await serviceWith([row({})]).list('u', 'p', {
      page: 1,
      page_size: 10,
    } as never);
    expect(page.items[0].cycle_summary).toBe(
      'Flowering was recorded fruit set was observed.',
    );
    expect(seededCatalogue()).toBeTruthy();
  });

  it('shows the saved English when an older API rewrote the summary after the keys were saved', async () => {
    const page = await serviceWith([
      row({
        cycle_summary: 'No flowering record was added.',
        recommended_next_cycle_actions: [
          'Keep recording flowering, fruit set, and harvest to compare the next cycle properly.',
        ],
      }),
    ]).list('u', 'p', { page: 1, page_size: 10 } as never);
    expect(page.items[0].cycle_summary).toBe('No flowering record was added.');
    expect(page.items[0].recommended_next_cycle_actions).toEqual([
      'Keep recording flowering, fruit set, and harvest to compare the next cycle properly.',
    ]);
  });
});
