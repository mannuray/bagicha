/** Backend-shaped records for MSW handlers (tests only). */
export const plantRecord = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  user_id: 'u1',
  name: 'Aam',
  species: 'Mango',
  species_family: 'mango',
  variety: 'Langra',
  record_kind: 'TREE',
  type: 'FRUIT_BEARING',
  growth_habit: 'PERENNIAL',
  record_pattern: 'LONG_LIVED',
  lifecycle_stage: 'MATURE_BEARING',
  lifecycle_stage_manual: false,
  planted_context: 'UNKNOWN',
  planting_date: '2015-01-01T00:00:00.000Z',
  planting_date_precision: 'YEAR',
  planting_date_input: '2015',
  first_flowering_at: null,
  first_fruit_set_at: null,
  first_harvest_at: null,
  latest_harvest_at: null,
  health_status: 'Healthy',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...over,
});

export const pageOf = <T,>(items: T[], over: Record<string, unknown> = {}) => ({
  success: true,
  data: items,
  pagination: {
    page: 1,
    page_size: 20,
    total_items: items.length,
    total_pages: 1,
    has_next: false,
    has_previous: false,
    ...over,
  },
});

export const ok = (data: unknown) => ({ success: true, data });
export const fail = (code: string, message = code) => ({ success: false, error: { code, message } });
