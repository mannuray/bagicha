import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cycleRecord, ok, pagedResponse, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { PlantDetailScreen } from '../biography';
import { cropItem, flowerItem } from './test-fixtures';

const tomatoItem = cropItem({ id: 'tomato', name: 'Tomato', family: 'SOLANACEAE', method: 'NURSERY_TRANSPLANT', journey: 'NURSERY', sun: 'FULL', guide: { plants_for_family_of_4: '4–6 plants', container: '12–14 inch pot or grow-bag per plant', spacing_cm: [45, 60] } });

function handlers(plant: Record<string, unknown>, opts: { conflict?: boolean; places?: Array<Record<string, unknown>> } = {}) {
  const posts: Array<Record<string, unknown>> = [];
  server.use(
    http.get(`${API}/ledger/plants/c1`, () => HttpResponse.json(ok({ ...plantRecord({ id: 'c1', record_kind: 'CROP', planting_date: null, planting_date_precision: 'UNKNOWN', ...plant }), _count: { journal_entries: 0 } }))),
    http.get(`${API}/ledger/plants/c1/timeline`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/ledger/plants/c1/tasks`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) => HttpResponse.json(pagedResponse(request, []))),
    http.get(`${API}/crops/calendar`, () => HttpResponse.json(ok([cropItem(), tomatoItem, flowerItem()]))),
    http.get(`${API}/garden/places`, () => HttpResponse.json(ok(opts.places ?? [{ id: 'pl1', name: 'Terrace bag', kind: 'GROW_BAG', archived_at: null }]))),
    http.get(`${API}/crops/calendar/:id`, ({ params }) =>
      HttpResponse.json(ok({ ...(params.id === 'tomato' ? tomatoItem : cropItem()), germination_days: [5, 10], transplant_after_days: params.id === 'tomato' ? [25, 30] : null, harvest_span_days: 60, thin_after_days: null, succession_every_days: null, care: [], material: null, windows: [] })),
    ),
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
    await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
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
    await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
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

  describe('journey page', () => {
    // Day counts are IST calendar days; at real midnight-1 am IST "n days and an hour ago"
    // crosses a day boundary. Pin noon IST.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
      vi.setSystemTime(new Date('2026-11-10T06:30:00Z'));
    });
    afterEach(() => vi.useRealTimers());
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000 - 3600 * 1000).toISOString();
    const openSeason = (started: string, place: string | null = 'pl1') =>
      server.use(
        http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) =>
          HttpResponse.json(pagedResponse(request, [cycleRecord({ id: 's1', started_at: started, closed_at: null, place_id: place })])),
        ),
      );
    const harvest = (id: string, cycle: string) => ({
      id, type: 'HARVEST', content: null, metadata: null, timestamp: daysAgo(1), recorded_at: daysAgo(1), plant_cycle_id: cycle, diagnosis_outcome_id: null,
    });

    it('heads a nursery crop with its stage and day, and no place', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'NURSERY' });
      openSeason(daysAgo(5), null);
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByText('In the nursery · day 5')).toBeInTheDocument();
    });

    it('heads a planted crop with its place', async () => {
      handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'IN_GROUND' });
      openSeason(daysAgo(12));
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByText('Planted · day 12 · Terrace bag')).toBeInTheDocument();
      expect(await screen.findByText(/day 12 of about 30–40/i)).toBeInTheDocument();
    });

    it('shows the next step from the crop plan', async () => {
      handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'IN_GROUND' });
      openSeason(daysAgo(12));
      server.use(
        http.get(`${API}/ledger/plants/c1/tasks`, () =>
          HttpResponse.json(pageOf([
            taskRecord({ id: 't2', source: 'CROP_PLAN', title: 'Pick the first leaves', plant_id: 'c1', due_date: new Date(Date.now() + 9 * 86400000).toISOString() }),
            taskRecord({ id: 't1', source: 'CROP_PLAN', title: 'Thin the seedlings', plant_id: 'c1', due_date: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString() }),
          ])),
        ),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const journey = await screen.findByRole('region', { name: /journey/i });
      expect(await within(journey).findByText(/next: thin the seedlings · due in 3 days/i)).toBeInTheDocument();
    });

    it('counts this season\'s harvests', async () => {
      handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'HARVESTING' });
      openSeason(daysAgo(40));
      server.use(http.get(`${API}/ledger/plants/c1/timeline`, () => HttpResponse.json(pageOf([harvest('h1', 's1'), harvest('h2', 's1'), harvest('h0', 'old')]))));
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByText(/2 harvests this season/i)).toBeInTheDocument();
    });

    it('says when the place is a good choice for rotation', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'IN_GROUND' });
      server.use(
        http.get(`${API}/garden/places/pl1/rotation`, () =>
          HttpResponse.json(ok({ conflict: false, last: { crop_id: 'peas', crop_name: 'Peas', family: 'FABACEAE', season_label: 'Feb 2026' } })),
        ),
      );
      openSeason(daysAgo(3));
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByText(/good choice: peas grew here last, a different family/i)).toBeInTheDocument();
    });

    it('opens the start sheet when arriving with ?start=1', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' });
      renderWithApp(routes, { route: '/plants/c1?start=1' });
      expect(await screen.findByRole('dialog', { name: /start growing/i })).toBeInTheDocument();
    });

    it('calls ending a crop "Stop growing this crop"', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'IN_GROUND' });
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByRole('button', { name: /stop growing this crop/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as ended/i })).not.toBeInTheDocument();
    });
  });

  describe('start sheet', () => {
    const openSheet = async () => {
      await userEvent.click(await screen.findByRole('button', { name: /^start$/i }));
      return screen.getByRole('dialog', { name: /start growing/i });
    };

    it('recommends seeds for a direct-sown crop', async () => {
      handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      expect(within(sheet).getByText(/start this season/i)).toBeInTheDocument();
      expect(within(within(sheet).getByRole('button', { name: /i have seeds/i })).getByText(/recommended/i)).toBeInTheDocument();
      expect(within(within(sheet).getByRole('button', { name: /bought seedlings/i })).queryByText(/recommended/i)).not.toBeInTheDocument();
    });

    it('recommends bought seedlings as quickest for a nursery crop, and hints at the tray', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' });
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      expect(within(within(sheet).getByRole('button', { name: /bought seedlings/i })).getByText(/quickest/i)).toBeInTheDocument();
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      expect(await within(sheet).findByText(/tomato does best raised in a tray, then moved after 25–30 days/i)).toBeInTheDocument();
    });

    it('a nursery tray asks no place and starts the season', async () => {
      const posts = handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' });
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      await userEvent.click(within(sheet).getByRole('button', { name: /nursery tray/i }));
      expect(within(sheet).queryByRole('button', { name: /terrace bag/i })).not.toBeInTheDocument();
      await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'NURSERY' } }]));
    });

    it('a nursery tray makes no place, even for a gardener with none yet', async () => {
      const posts = handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' }, { places: [] });
      let placeMade = false;
      server.use(
        http.post(`${API}/garden/places`, () => {
          placeMade = true;
          return HttpResponse.json(ok({ id: 'pl9', name: 'Ground', kind: 'GROUND', sun_hours: null, archived_at: null }), { status: 201 });
        }),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      await userEvent.click(within(sheet).getByRole('button', { name: /nursery tray/i }));
      await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'NURSERY' } }]));
      expect(placeMade).toBe(false);
    });

    it('says so when the new place cannot be saved', async () => {
      const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' }, { places: [] });
      server.use(http.post(`${API}/garden/places`, () => HttpResponse.json({ success: false, error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 })));
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      await userEvent.click(await within(sheet).findByRole('button', { name: /start season/i }));
      expect(await within(sheet).findByRole('alert')).toBeInTheDocument();
      expect(posts).toEqual([]);
    });

    it('notes when a full-sun crop goes into a partly sunny place', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' }, { places: [{ id: 'pl1', name: 'Balcony', kind: 'POT', sun_hours: 'PARTIAL', archived_at: null }] });
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      await userEvent.click(within(sheet).getByRole('button', { name: /bought seedlings/i }));
      await userEvent.click(await within(sheet).findByRole('button', { name: /balcony/i }));
      expect(within(sheet).getByText(/balcony gets partial sun; tomato prefers 6\+ hours/i)).toBeInTheDocument();
    });

    it('notes when it is outside the sowing time', async () => {
      handlers({ name: 'Tomato', crop_id: 'tomato', crop_stage: 'PLANNED' });
      server.use(http.get(`${API}/crops/calendar`, () => HttpResponse.json(ok([{ ...tomatoItem, status: 'later', next_month: 2, window_label: 'Jan–Feb' }]))));
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      expect(within(sheet).getByText(/outside the usual sowing time in your region; it may struggle/i)).toBeInTheDocument();
    });

    it('adds a place with its kind and sun, saved by Start', async () => {
      const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
      let created: unknown;
      server.use(
        http.post(`${API}/garden/places`, async ({ request }) => {
          created = await request.json();
          return HttpResponse.json(ok({ id: 'pl2', name: 'Back bed', kind: 'BED', sun_hours: 'FULL', archived_at: null }), { status: 201 });
        }),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const sheet = await openSheet();
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      await userEvent.type(await within(sheet).findByLabelText(/name \(optional\)/i), 'Back bed');
      await userEvent.click(within(sheet).getByRole('button', { name: /^bed$/i }));
      await userEvent.click(within(sheet).getByRole('button', { name: /^full sun$/i }));
      await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
      await waitFor(() => expect(created).toEqual({ name: 'Back bed', kind: 'BED', sun_hours: 'FULL' }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl2' } }]));
    });
  });

  describe('choosing a place', () => {
    it('with no places yet, the new-place form is already open on Ground, and Start saves it', async () => {
      const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' }, { places: [] });
      let created: unknown;
      server.use(
        http.post(`${API}/garden/places`, async ({ request }) => {
          created = await request.json();
          return HttpResponse.json(ok({ id: 'pl9', name: 'Ground', kind: 'GROUND', sun_hours: null, archived_at: null }), { status: 201 });
        }),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const journey = await screen.findByRole('region', { name: /journey/i });
      await userEvent.click(within(journey).getByRole('button', { name: /^start$/i }));
      const sheet = screen.getByRole('dialog', { name: /start growing/i });
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      expect(await within(sheet).findByLabelText(/name \(optional\)/i)).toBeInTheDocument();
      expect(within(sheet).getByRole('button', { name: /^ground$/i })).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
      await waitFor(() => expect(created).toEqual({ name: 'Ground', kind: 'GROUND' }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl9' } }]));
    });

    it('with places, the new-place section is open without a tap; picking a place uses it', async () => {
      const posts = handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
      let placeMade = false;
      server.use(
        http.post(`${API}/garden/places`, () => {
          placeMade = true;
          return HttpResponse.json(ok({ id: 'pl3', name: 'Ground', kind: 'GROUND', sun_hours: null, archived_at: null }), { status: 201 });
        }),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const journey = await screen.findByRole('region', { name: /journey/i });
      await userEvent.click(within(journey).getByRole('button', { name: /^start$/i }));
      const sheet = screen.getByRole('dialog', { name: /start growing/i });
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      expect(await within(sheet).findByLabelText(/name \(optional\)/i)).toBeInTheDocument();
      expect(within(sheet).queryByRole('button', { name: /add a place/i })).toBeNull();
      const ground = within(sheet).getByRole('button', { name: /^ground$/i });
      expect(ground).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(within(sheet).getByRole('button', { name: /terrace bag/i }));
      expect(ground).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(within(sheet).getByRole('button', { name: /start season/i }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl1' } }]));
      expect(placeMade).toBe(false);
    });

    it('never makes a second "Ground": a place with the same name and kind is reused', async () => {
      const posts = handlers(
        { name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' },
        { places: [{ id: 'pl5', name: 'Ground', kind: 'GROUND', sun_hours: null, archived_at: null }] },
      );
      let placeMade = false;
      server.use(
        http.post(`${API}/garden/places`, () => {
          placeMade = true;
          return HttpResponse.json(ok({ id: 'pl6', name: 'Ground', kind: 'GROUND', sun_hours: null, archived_at: null }), { status: 201 });
        }),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      const journey = await screen.findByRole('region', { name: /journey/i });
      await userEvent.click(within(journey).getByRole('button', { name: /^start$/i }));
      const sheet = screen.getByRole('dialog', { name: /start growing/i });
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      await userEvent.click(await within(sheet).findByRole('button', { name: /start season/i }));
      await waitFor(() => expect(posts).toEqual([{ type: 'SOWING', metadata: { method: 'DIRECT', place_id: 'pl5' } }]));
      expect(placeMade).toBe(false);
    });

    it('tapping a kind after picking a place switches back to a new place', async () => {
      handlers({ name: 'Spinach (Palak)', crop_id: 'palak', crop_stage: 'PLANNED' });
      renderWithApp(routes, { route: '/plants/c1' });
      const journey = await screen.findByRole('region', { name: /journey/i });
      await userEvent.click(within(journey).getByRole('button', { name: /^start$/i }));
      const sheet = screen.getByRole('dialog', { name: /start growing/i });
      await userEvent.click(within(sheet).getByRole('button', { name: /i have seeds/i }));
      const terrace = await within(sheet).findByRole('button', { name: /terrace bag/i });
      await userEvent.click(terrace);
      await userEvent.click(within(sheet).getByRole('button', { name: /^bed$/i }));
      expect(terrace).toHaveAttribute('aria-pressed', 'false');
      expect(within(sheet).getByRole('button', { name: /^bed$/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('a seasonal flower', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
      vi.setSystemTime(new Date('2026-11-10T06:30:00Z'));
    });
    afterEach(() => vi.useRealTimers());
    it('blooms instead of harvesting, logs a bloom, and has no rotation note', async () => {
      handlers({ name: 'Marigold (Genda)', crop_id: 'marigold', crop_stage: 'HARVESTING', record_kind: 'FLOWER' }, { conflict: true });
      server.use(
        http.get(`${API}/ledger/plants/c1/cycles`, ({ request }) =>
          HttpResponse.json(pagedResponse(request, [cycleRecord({ id: 's1', started_at: new Date(Date.now() - 70 * 86400000 - 3600000).toISOString(), closed_at: null, place_id: 'pl1' })])),
        ),
      );
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByText('Blooming · day 70 · Terrace bag')).toBeInTheDocument();
      const journey = screen.getByRole('region', { name: /journey/i });
      expect(within(journey).getByText(/^blooming$/i).closest('[aria-current="step"]')).not.toBeNull();
      expect(within(journey).getByRole('link', { name: /log a bloom/i })).toHaveAttribute('href', '/plants/c1/log');
      expect(await within(journey).findByText(/growing in terrace bag/i)).toBeInTheDocument();
      expect(within(journey).queryByText(/same family/i)).not.toBeInTheDocument();
    });

    it('compares years by blooms, not harvests', async () => {
      handlers({ name: 'Marigold (Genda)', crop_id: 'marigold', crop_stage: 'HARVESTING', record_kind: 'FLOWER' });
      renderWithApp(routes, { route: '/plants/c1' });
      expect(await screen.findByRole('region', { name: /blooms by year/i })).toBeInTheDocument();
      expect(screen.queryByText(/log harvests to start comparing/i)).not.toBeInTheDocument();
    });
  });
});
