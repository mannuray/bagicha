import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { cycleRecord, ok, pagedResponse, pageOf, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { PlantDetailScreen } from '../biography';
import { cropItem } from './test-fixtures';

const tomatoItem = cropItem({ id: 'tomato', name: 'Tomato', family: 'SOLANACEAE', method: 'NURSERY_TRANSPLANT', guide: { plants_for_family_of_4: '4–6 plants', container: '12–14 inch pot or grow-bag per plant', spacing_cm: [45, 60] } });

function handlers(plant: Record<string, unknown>, opts: { conflict?: boolean } = {}) {
  const posts: Array<Record<string, unknown>> = [];
  server.use(
    http.get(`${API}/ledger/plants/c1`, () => HttpResponse.json(ok({ ...plantRecord({ id: 'c1', record_kind: 'CROP', planting_date: null, planting_date_precision: 'UNKNOWN', ...plant }), _count: { journal_entries: 0 } }))),
    http.get(`${API}/ledger/plants/c1/timeline`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/ledger/plants/c1/tasks`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) => HttpResponse.json(pagedResponse(request, []))),
    http.get(`${API}/crops/calendar`, () => HttpResponse.json(ok([cropItem(), tomatoItem]))),
    http.get(`${API}/garden/places`, () => HttpResponse.json(ok([{ id: 'pl1', name: 'Terrace bag', kind: 'GROW_BAG', archived_at: null }]))),
    http.get(`${API}/garden/places/pl1/rotation`, () =>
      HttpResponse.json(ok(opts.conflict ? { conflict: true, last: { crop_id: 'potato', crop_name: 'Potato', family: 'SOLANACEAE', season_label: 'Oct 2026' } } : { conflict: false, last: null })),
    ),
    http.post(`${API}/ledger/plants/c1/journal`, async ({ request }) => {
      posts.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(ok({ id: 'j1', type: 'SOWING', content: null, metadata: null, timestamp: '2026-10-10T06:00:00Z', recorded_at: '2026-10-10T06:00:00Z', plant_cycle_id: null, diagnosis_outcome_id: null }), { status: 201 });
    }),
  );
  return posts;
}

const routes = (
  <Routes>
    <Route path="/plants/:id" element={<PlantDetailScreen />} />
  </Routes>
);

describe('the crop page', () => {
  it('a planned direct-sown crop starts with "I have seeds" into a chosen place', async () => {
    const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    expect(within(journey).getByText(/a 1-metre row every 2 weeks/i)).toBeInTheDocument();
    await userEvent.click(within(journey).getByRole('button', { name: /^start$/i }));
    const sheet = screen.getByRole('dialog', { name: /start growing/i });
    await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
    expect(within(sheet).queryByRole('button', { name: /nursery tray/i })).not.toBeInTheDocument();
    await userEvent.click(await within(sheet).findByRole('button', { name: /terrace bag/i }));
    await userEvent.click(within(sheet).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl1' } }]));
  });

  it('bought seedlings transplant straight in, with the rotation note for the place', async () => {
    const posts = handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' }, { conflict: true });
    renderWithApp(routes, { route: '/plants/c1' });
    await userEvent.click(await screen.findByRole('button', { name: /^start$/i }));
    const sheet = screen.getByRole('dialog', { name: /start growing/i });
    await userEvent.click(within(sheet).getByRole('button', { name: /bought seedlings/i }));
    await userEvent.click(await within(sheet).findByRole('button', { name: /terrace bag/i }));
    expect(await within(sheet).findByText(/potato \(same family\) grew here in oct 2026/i)).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(posts).toEqual([{ type: 'TRANSPLANTING', metadata: { place_id: 'pl1' } }]));
  });

  it('a nursery crop sown in a tray offers to log the transplant, and the stepper shows where it is', async () => {
    const posts = handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'NURSERY' });
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    expect(within(journey).getByText(/^sown$/i).closest('[aria-current="step"]')).not.toBeNull();
    expect(within(journey).getByText(/transplanted/i)).toBeInTheDocument();
    await userEvent.click(within(journey).getByRole('button', { name: /log transplant/i }));
    const sheet = screen.getByRole('dialog', { name: /transplant/i });
    await userEvent.click(await within(sheet).findByRole('button', { name: /terrace bag/i }));
    await userEvent.click(within(sheet).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(posts).toEqual([{ type: 'TRANSPLANTING', metadata: { place_id: 'pl1' } }]));
  });

  it('a harvesting crop can end its season; crop pages have no tree sections', async () => {
    const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'HARVESTING' });
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    expect(within(journey).getByText(/^harvesting$/i).closest('[aria-current="step"]')).not.toBeNull();
    expect(within(journey).getByRole('link', { name: /log a harvest/i })).toHaveAttribute('href', '/plants/c1/log');
    expect(screen.queryByRole('region', { name: /at a glance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /milestones/i })).not.toBeInTheDocument();
    await userEvent.click(within(journey).getByRole('button', { name: /end season/i }));
    await waitFor(() => expect(posts).toEqual([{ type: 'SEASON_END' }]));
  });

  it('a crop has no tree photo in its header and no repeated species line', async () => {
    handlers({ name: 'Spinach (Palak)', species: 'Spinach (Palak)', variety: null, crop_id: 'palak', crop_stage: 'PLANNED' });
    const { container } = renderWithApp(routes, { route: '/plants/c1' });
    await screen.findByRole('heading', { level: 1, name: 'Spinach (Palak)' });
    expect(container.querySelector('header img[src*="tree-hero"]')).toBeNull();
    expect(screen.getAllByText(/spinach \(palak\)/i)).toHaveLength(1);
  });

  it('a never-sown planned crop can be removed from Want to grow', async () => {
    handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
    let deleted = 0;
    server.use(http.delete(`${API}/crops/plan/c1`, () => { deleted += 1; return new HttpResponse(null, { status: 204 }); }));
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    await userEvent.click(await within(journey).findByRole('button', { name: /remove from want to grow/i }));
    await waitFor(() => expect(deleted).toBe(1));
  });

  it('shows where the crop is growing, with the rotation note', async () => {
    handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'IN_GROUND' }, { conflict: true });
    server.use(
      http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) =>
        HttpResponse.json(pagedResponse(request, [cycleRecord({ id: 's1', started_at: '2026-10-10T06:00:00Z', closed_at: null, place_id: 'pl1' })])),
      ),
    );
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    expect(await within(journey).findByText(/growing in terrace bag/i)).toBeInTheDocument();
    expect(await within(journey).findByText(/potato \(same family\) grew here/i)).toBeInTheDocument();
    expect(within(journey).queryByRole('button', { name: /remove from want to grow/i })).not.toBeInTheDocument();
  });

  it('a failed nursery tray can be ended from the card', async () => {
    const posts = handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'NURSERY' });
    renderWithApp(routes, { route: '/plants/c1' });
    const journey = await screen.findByRole('region', { name: /journey/i });
    await userEvent.click(within(journey).getByRole('button', { name: /end season/i }));
    await waitFor(() => expect(posts).toEqual([{ type: 'SEASON_END' }]));
  });

  it('shows crop seasons by their start month', async () => {
    handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'RESTING' });
    server.use(
      http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) =>
        HttpResponse.json(
          pagedResponse(request, [
            cycleRecord({ id: 's2', cycle_year: 2026, season_no: 2, started_at: '2026-09-05T06:00:00Z', closed_at: '2026-12-20T06:00:00Z', yield_quantity: 6, yield_unit: 'kg' }),
            cycleRecord({ id: 's1', cycle_year: 2026, season_no: 1, started_at: '2026-01-10T06:00:00Z', closed_at: '2026-05-01T06:00:00Z', yield_quantity: 4, yield_unit: 'kg' }),
          ]),
        ),
      ),
    );
    renderWithApp(routes, { route: '/plants/c1' });
    const yoy = await screen.findByRole('region', { name: /seasons/i });
    expect(await within(yoy).findByText(/^Sept? 2026$/)).toBeInTheDocument();
    expect(within(yoy).getByText('Jan 2026')).toBeInTheDocument();
    expect(within(yoy).getAllByText(/better/i).length).toBeGreaterThan(0);
  });
});
