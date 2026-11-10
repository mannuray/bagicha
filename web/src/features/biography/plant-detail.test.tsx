import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fail, ok, pagedResponse, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
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

function handlers() {
  let signed = 0;
  server.use(
    http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord(), _count: { journal_entries: 2 } }))),
    http.get(`${API}/seasonal/plant/p1/intelligence`, () => HttpResponse.json(ok(intelligence))),
    http.get(`${API}/ledger/plants/p1/cycles`, () => HttpResponse.json(pageOf([cycle]))),
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
  it('renders the loop sections from real data', async () => {
    const h = handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Aam' })).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(await screen.findByText(/keep soil evenly moist/i)).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: /plan pest response/i })).toBeInTheDocument();
    expect(await screen.findByText(/fruit set was not confirmed/i)).toBeInTheDocument();
    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /season review/i })).toHaveAttribute('href', '/plants/p1/season');
    expect(screen.getByRole('link', { name: /log a moment/i })).toHaveAttribute('href', '/plants/p1/log');
    await waitFor(() => expect(h.signed()).toBe(1));
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

  it('this season comes from the region-aware pack that also makes the tasks', async () => {
    handlers();
    renderWithApp(routes, { route: '/plants/p1' });
    expect(await screen.findByText(/mulch against deccan heat/i)).toBeInTheDocument();
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
