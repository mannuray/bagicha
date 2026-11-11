import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cycleRecord, fail, ok, pagedResponse, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { LogMomentScreen } from '../journal';
import { TasksScreen } from '../tasks';
import { PlantDetailScreen } from '.';

const intelligence = {
  seasonal_pack: {
    id: 'pack1', current_phase: 'flowering', upcoming_phase: 'fruit_set', confidence: 'high',
    do_now: ['Keep soil evenly moist', 'Mulch against Deccan heat'], avoid_now: ['Heavy pruning'], watch_for: ['Hoppers on panicles'],
  },
  personalized_overlay: null,
  is_paid_user: false,
};
const cycle = {
  id: 'c1', cycle_year: 2025, observed_flowering_at: '2026-02-01T00:00:00Z', observed_fruit_set_at: null,
  harvest_started_at: null, harvest_completed_at: null, yield_quantity: null, yield_unit: null, yield_quality: 'UNKNOWN',
  flower_drop_level: 'HIGH', fruit_drop_level: 'UNKNOWN', stress_score: 1, pest_pressure_score: 2, treatment_count: 1,
  cycle_summary: 'Flowering was recorded but fruit set was not confirmed.', recommended_next_cycle_actions: ['Mulch early'], recent_events: [],
};
const entry = (over: object) => ({
  id: 'j1', type: 'FLOWERING', content: 'Panicles everywhere', metadata: null, timestamp: '2026-02-01T05:00:00Z',
  recorded_at: '2026-02-01T05:00:00Z', plant_cycle_id: 'c1', diagnosis_outcome_id: null, ...over,
});

function handlers(opts: { plant?: Record<string, unknown>; cycles?: unknown[] } = {}) {
  let signed = 0;
  server.use(
    http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord(opts.plant), _count: { journal_entries: 2 } }))),
    http.get(`${API}/seasonal/plant/p1/intelligence`, () => HttpResponse.json(ok(intelligence))),
    http.get(`${API}/ledger/plants/p1/cycles`, ({ request }) => HttpResponse.json(pagedResponse(request, opts.cycles ?? [cycle]))),
    http.get(`${API}/ledger/plants/p1/tasks`, () => HttpResponse.json(pageOf([taskRecord()]))),
    http.get(`${API}/ledger/plants/p1/timeline`, () =>
      HttpResponse.json(pageOf([entry({ id: 'j2', metadata: { photo_key: 'journal/u1/a.jpg' } }), entry({ id: 'j1', type: 'NOTE', content: 'First note' })])),
    ),
    http.get(`${API}/media/download-url/*`, () => {
      signed += 1;
      return HttpResponse.json(ok({ url: 'http://signed/a.jpg', expires_in_seconds: 3600 }));
    }),
  );
  return { signed: () => signed };
}

const routes = (
  <Routes>
    <Route path="/plants/:id" element={<PlantDetailScreen />} />
    <Route path="/plants/:id/tasks" element={<TasksScreen />} />
    <Route path="/plants/:id/log" element={<LogMomentScreen />} />
  </Routes>
);

describe('tree biography', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-11-10T06:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('renders the loop sections from real data', async () => {
    const h = handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Aam' })).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(await screen.findByText(/hoppers on panicles/i)).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: /plan pest response/i })).toBeInTheDocument();
    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log a moment/i })).toHaveAttribute('href', '/plants/p1/log');
    await waitFor(() => expect(h.signed()).toBe(1));
  });

  it('shows the age line and the Stitch photo when there is no moment photo', async () => {
    handlers();
    server.use(http.get(`${API}/ledger/plants/p1/timeline`, () => HttpResponse.json(pageOf([entry({ id: 'j1', type: 'NOTE' })]))));
    const { container } = renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/planted 2015 · 11 years/i)).toBeInTheDocument();
    expect(container.querySelector('header img[src*="tree-hero"]')).not.toBeNull();
  });

  it('does not flash the Stitch photo while the tree\'s own photo is loading', async () => {
    handlers();
    server.use(http.get(`${API}/media/download-url/*`, () => new Promise(() => {})));
    const { container } = renderWithApp(routes, { route: '/plants/p1' });
    await screen.findByRole('heading', { level: 1, name: 'Aam' });
    await screen.findByText('First note');
    expect(container.querySelector('header img[src*="tree-hero"]')).toBeNull();
  });

  it('shows stage and season phase as separate things', async () => {
    handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    const glance = await screen.findByRole('region', { name: /at a glance/i });
    expect(within(glance).getByText(/mature canopy/i).closest('[aria-current="step"]')).not.toBeNull();
    expect(await within(glance).findByText(/now: flowering/i)).toBeInTheDocument();
  });

  it('tells an old papaya it is past its productive age and suggests a replacement', async () => {
    handlers({
      plant: {
        name: 'Papita', species: 'Papaya', species_family: 'papaya', planting_date: '2022-06-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR',
        life_profile: { first_fruit_months: [8, 12], productive_until_months: [24, 36], lifespan_months: [48, 72], note_key: 'papaya' },
      },
    });
    renderWithApp(routes, { route: '/plants/p1' });
    const glance = await screen.findByRole('region', { name: /at a glance/i });
    expect(await within(glance).findByText(/past the typical productive age \(2–3 years\)/i)).toBeInTheDocument();
    expect(within(glance).getByText(/plan a replacement/i)).toBeInTheDocument();
    expect(within(glance).getByText(/replace papaya every 2–3 years/i)).toBeInTheDocument();
  });

  it('gives a mango its age and productive span, and a rose no life line', async () => {
    handlers({ plant: { life_profile: { first_fruit_months: [36, 60], productive_until_months: [480, 720], lifespan_months: [720, 1200], note_key: null } } });
    const first = renderWithApp(routes, { route: '/plants/p1' });
    const glance = await screen.findByRole('region', { name: /at a glance/i });
    expect(await within(glance).findByText(/11 years · productive until about 40–60 years/i)).toBeInTheDocument();
    first.unmount();
    handlers({ plant: { species: 'Rose', species_family: null, life_profile: null } });
    renderWithApp(routes, { route: '/plants/p1' });
    const roseGlance = await screen.findByRole('region', { name: /at a glance/i });
    expect(within(roseGlance).queryByText(/productive|first fruit/i)).not.toBeInTheDocument();
  });

  it('in a pot, shows the first-fruit line only, with the container note', async () => {
    handlers({
      plant: {
        planted_context: 'POT', planting_date: '2026-01-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR',
        life_profile: { first_fruit_months: [36, 60], productive_until_months: [480, 720], lifespan_months: [720, 1200], note_key: null },
      },
    });
    renderWithApp(routes, { route: '/plants/p1' });
    const glance = await screen.findByRole('region', { name: /at a glance/i });
    expect(await within(glance).findByText(/first fruit usually at 3–5 years/i)).toBeInTheDocument();
    expect(within(glance).getByText(/in a container/i)).toBeInTheDocument();
  });

  it('marks a tree as died with a cause and links the recent diagnosis', async () => {
    handlers();
    let body: unknown;
    server.use(
      http.get(`${API}/ledger/plants/p1/timeline`, () =>
        HttpResponse.json(pageOf([entry({ id: 'd1', type: 'PEST_DIAGNOSIS', content: 'Mealybugs', timestamp: '2026-11-01T05:00:00Z' })])),
      ),
      http.post(`${API}/ledger/plants/p1/end`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(ok(plantRecord({ ended_at: '2026-11-10T06:00:00.000Z', end_reason: 'DISEASE_OR_PEST' })), { status: 201 });
      }),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    await userEvent.click(await screen.findByRole('button', { name: /mark as ended/i }));
    const sheet = screen.getByRole('dialog', { name: /mark as ended/i });
    await userEvent.click(within(sheet).getByRole('button', { name: /disease or pest/i }));
    expect(within(sheet).getByRole('button', { name: /linked: mealybugs/i })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(within(sheet).getByLabelText(/note/i), 'Spread fast');
    await userEvent.click(within(sheet).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(body).toEqual({ reason: 'DISEASE_OR_PEST', note: 'Spread fast', entry_id: 'd1' }));
  });

  it('picking today in the morning is not "in the future": it sends no date, and the field stops at today', async () => {
    handlers();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/ledger/plants/p1/end`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ ended_at: '2026-11-10T06:00:00.000Z', end_reason: 'WEATHER' })), { status: 201 });
      }),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    await userEvent.click(await screen.findByRole('button', { name: /mark as ended/i }));
    const sheet = screen.getByRole('dialog', { name: /mark as ended/i });
    await userEvent.click(within(sheet).getByRole('button', { name: /weather/i }));
    const date = within(sheet).getByLabelText(/^date/i);
    expect(date).toHaveAttribute('max', '2026-11-10');
    await userEvent.type(date, '2026-11-10');
    await userEvent.click(within(sheet).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(body).toEqual({ reason: 'WEATHER' }));
  });

  it('an ended tree is read-only, with a calm banner, restore and replace', async () => {
    let restored = 0;
    handlers({ plant: { ended_at: '2026-03-15T06:00:00.000Z', end_reason: 'DISEASE_OR_PEST', end_note: 'Canker' } });
    server.use(
      http.post(`${API}/ledger/plants/p1/restore`, () => {
        restored += 1;
        return HttpResponse.json(ok(plantRecord()), { status: 201 });
      }),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/died · mar 2026 · disease or pest/i)).toBeInTheDocument();
    expect(screen.getByText('Canker')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /log a moment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /this season/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /upcoming care/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark as ended/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /sanctuary record/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /plant a replacement/i })).toHaveAttribute('href', '/plants/new?replaces=p1');
    await userEvent.click(screen.getByRole('button', { name: /restore/i }));
    await waitFor(() => expect(restored).toBe(1));
  });

  it('an ended tree has no health badge and its age stops at its end', async () => {
    handlers({ plant: { ended_at: '2020-06-15T06:00:00.000Z', end_reason: 'WEATHER' } });
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/died · jun 2020 · weather/i)).toBeInTheDocument();
    expect(screen.getByText(/planted 2015 · 5 years/i)).toBeInTheDocument();
    expect(screen.queryByText(/^healthy$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/needs attention/i)).not.toBeInTheDocument();
  });

  it('links a replaced tree and its replacement both ways', async () => {
    handlers({ plant: { ended_at: '2026-03-15T06:00:00.000Z', end_reason: 'REPLACED', replaced_by_id: 'p2', replaced_by: { id: 'p2', name: 'Nimbu 2' }, replaces: [] } });
    const first = renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('link', { name: /replaced by nimbu 2/i })).toHaveAttribute('href', '/plants/p2');
    first.unmount();
    handlers({ plant: { replaces: [{ id: 'p0', name: 'Old Nimbu' }] } });
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('link', { name: /replaces old nimbu/i })).toHaveAttribute('href', '/plants/p0');
  });

  it('drops Do now, Botanical Essence and the Cycles section', async () => {
    handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    await screen.findByText(/hoppers on panicles/i);
    expect(screen.queryByText(/do now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/keep soil evenly moist/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /botanical essence/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^cycles$/i })).not.toBeInTheDocument();
  });

  it('compares this year with last and links the season review', async () => {
    handlers({
      cycles: [
        cycleRecord({ id: 'c25', cycle_year: 2025, harvest_started_at: '2025-06-01T00:00:00Z', yield_quantity: 40, yield_unit: 'kg' }),
        cycleRecord({ id: 'c24', cycle_year: 2024, yield_quantity: 30, yield_unit: 'kg' }),
      ],
    });
    renderWithApp(routes, { route: '/plants/p1' });
    const yoy = await screen.findByRole('region', { name: /year on year/i });
    expect(await within(yoy).findAllByText('40 kg')).not.toHaveLength(0);
    expect(within(yoy).getAllByText(/better/i)).not.toHaveLength(0);
    expect(within(yoy).getByRole('link', { name: /season review/i })).toHaveAttribute('href', '/plants/p1/season');
  });

  it('says to log harvests when there is nothing to compare', async () => {
    handlers({ cycles: [cycleRecord({ cycle_year: 2026 })] });
    renderWithApp(routes, { route: '/plants/p1' });
    const yoy = await screen.findByRole('region', { name: /year on year/i });
    expect(await within(yoy).findByText(/log harvests to start comparing/i)).toBeInTheDocument();
    expect(within(yoy).getByRole('link', { name: /season review/i })).toHaveAttribute('href', '/plants/p1/season');
  });

  it('lists milestones and mutes the missing ones', async () => {
    handlers({ plant: { first_flowering_at: '2019-02-10T00:00:00.000Z' } });
    renderWithApp(routes, { route: '/plants/p1' });
    const milestones = await screen.findByRole('region', { name: /milestones/i });
    const flowering = within(milestones).getByText(/first flowering/i).closest('li') as HTMLElement;
    expect(within(flowering).getByText(/2019/)).toBeInTheDocument();
    const harvest = within(milestones).getByText(/first harvest/i).closest('li') as HTMLElement;
    expect(within(harvest).getByText(/not yet/i)).toBeInTheDocument();
  });

  it('groups the record by year with harvest tags', async () => {
    handlers();
    server.use(
      http.get(`${API}/ledger/plants/p1/timeline`, () =>
        HttpResponse.json(
          pageOf([
            entry({ id: 'h', type: 'HARVEST', timestamp: '2026-06-01T05:00:00Z', metadata: { quantity_value: 120, quantity_unit: 'kg', quality: 'good' } }),
            entry({ id: 'n', type: 'NOTE', content: 'Old note', timestamp: '2025-03-01T05:00:00Z' }),
          ]),
        ),
      ),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    const record = await screen.findByRole('region', { name: /sanctuary record/i });
    expect(await within(record).findByRole('heading', { name: '2026' })).toBeInTheDocument();
    expect(within(record).getByRole('heading', { name: '2025' })).toBeInTheDocument();
    expect(within(record).getByText(/120 kg · good/i)).toBeInTheDocument();
  });

  it('filters the record on the server, and pages within the filter', async () => {
    handlers();
    const seen: Array<string | null> = [];
    const all = Array.from({ length: 25 }, (_, i) => entry({ id: `h${i}`, type: 'HARVEST', content: `Harvest ${i}` }));
    server.use(
      http.get(`${API}/ledger/plants/p1/timeline`, ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('types'));
        return HttpResponse.json(pagedResponse(request, all));
      }),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    const record = await screen.findByRole('region', { name: /sanctuary record/i });
    await userEvent.click(within(record).getByRole('button', { name: /^harvest$/i }));
    await within(record).findByText('Harvest 0');
    await userEvent.click(within(record).getByRole('button', { name: /earlier moments/i }));
    await within(record).findByText('Harvest 24');
    expect(seen.filter((v) => v !== null)).toEqual(['HARVEST', 'HARVEST']);
  });

  it('shows a kind-empty message when a filter matches nothing', async () => {
    handlers();
    server.use(
      http.get(`${API}/ledger/plants/p1/timeline`, ({ request }) =>
        HttpResponse.json(pageOf(new URL(request.url).searchParams.get('types') ? [] : [entry({ id: 'n', type: 'NOTE', content: 'A note' })])),
      ),
    );
    renderWithApp(routes, { route: '/plants/p1' });
    const record = await screen.findByRole('region', { name: /sanctuary record/i });
    await within(record).findByText('A note');
    await userEvent.click(within(record).getByRole('button', { name: /^harvest$/i }));
    expect(await within(record).findByText(/no moments of this kind yet/i)).toBeInTheDocument();
    expect(within(record).getByRole('button', { name: /^all$/i })).toBeInTheDocument();
  });

  it('shows a memory card in the anniversary month', async () => {
    handlers({ plant: { planting_date: '2015-11-04T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' } });
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/11 years ago this month/i)).toBeInTheDocument();
  });

  it('has no age line, memory or crash without a planting date', async () => {
    handlers({ plant: { planting_date: null, planting_date_precision: 'UNKNOWN', planting_date_input: null } });
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Aam' })).toBeInTheDocument();
    expect(screen.queryByText(/^planted /i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ago this month/i)).not.toBeInTheDocument();
    const milestones = await screen.findByRole('region', { name: /milestones/i });
    const planted = within(milestones).getByText(/^planted$/i).closest('li') as HTMLElement;
    expect(within(planted).getByText(/date unknown/i)).toBeInTheDocument();
    expect(within(planted).queryByText(/not yet/i)).not.toBeInTheDocument();
  });

  it.each(['/plants/p1', '/plants/p1/tasks', '/plants/p1/log'])(
    '%s shows "not in your garden" for a missing plant (Review Focus #4)',
    async (route) => {
      const missing = () => HttpResponse.json(fail('PLANT_NOT_FOUND', 'Plant not found'), { status: 404 });
      server.use(
        http.get(`${API}/ledger/plants/p1`, missing),
        http.get(`${API}/ledger/plants/p1/*`, missing),
      );
      renderWithApp(routes, { route });
      expect(await screen.findByText(/isn't in your garden/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to my plants/i })).toHaveAttribute('href', '/plants');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    },
  );

  it('this season shows what to avoid and watch for from the region-aware pack', async () => {
    handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/heavy pruning/i)).toBeInTheDocument();
    expect(screen.getByText(/hoppers on panicles/i)).toBeInTheDocument();
  });

  it('shows earlier moments on request, beyond the first page', async () => {
    handlers();
    const all = Array.from({ length: 25 }, (_, i) => entry({ id: `j${i}`, type: 'NOTE', content: `Moment ${i}` }));
    server.use(http.get(`${API}/ledger/plants/p1/timeline`, ({ request }) => HttpResponse.json(pagedResponse(request, all))));
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText('Moment 0')).toBeInTheDocument();
    expect(screen.queryByText('Moment 24')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /earlier moments/i }));
    expect(await screen.findByText('Moment 24')).toBeInTheDocument();
  });
});

describe('a perennial flower', () => {
  const rose = {
    record_kind: 'FLOWER', name: 'Gulab', species: 'Rose', variety: null, lifecycle_stage: 'FIRST_FLOWERING', planting_date: '2022-01-01T00:00:00.000Z',
    bloom: { status: 'in_season', window_label: 'Nov–Mar' },
    life_profile: { first_fruit_months: [4, 8], productive_until_months: [120, 180], lifespan_months: [120, 180], note_key: null },
  };

  it('has flower stages, its bloom months and blooms per year, never fruit guidance', async () => {
    handlers({ plant: rose });
    let intel = 0;
    server.use(http.get(`${API}/seasonal/plant/p1/intelligence`, () => { intel += 1; return HttpResponse.json(ok(intelligence)); }));
    const { container } = renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/in its bloom season \(nov–mar\)/i)).toBeInTheDocument();
    const stages = screen.getByRole('list', { name: /stage/i });
    expect(within(stages).getByText('Young')).toBeInTheDocument();
    expect(within(stages).getByText('Blooming').closest('[aria-current="step"]')).not.toBeNull();
    expect(screen.queryByText(/mature canopy/i)).not.toBeInTheDocument();
    expect(screen.getByText(/usually lives 10–15 years/i)).toBeInTheDocument();
    const blooms = await screen.findByRole('region', { name: /blooms by year/i });
    expect(await within(blooms).findByText(/1 bloom logged/i)).toBeInTheDocument();
    expect(container.querySelector('img[src*="tree-hero"]')).toBeNull();
    expect(intel).toBe(0);
  });

  it('a flower we do not know still renders, without a bloom line', async () => {
    handlers({ plant: { ...rose, species: 'Lotus', bloom: null, life_profile: null, lifecycle_stage: 'JUVENILE' } });
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Gulab' })).toBeInTheDocument();
    expect(screen.queryByText(/bloom season|next bloom/i)).not.toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: /stage/i })).getByText('Young').closest('[aria-current="step"]')).not.toBeNull();
  });
});
