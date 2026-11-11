import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fail, ok, pageOf, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { CropDetailScreen } from '.';
import { cropItem } from './test-fixtures';

const detail = (over: Record<string, unknown> = {}) => ({
  ...cropItem(),
  germination_days: [7, 10],
  transplant_after_days: null,
  harvest_span_days: 60,
  thin_after_days: 14,
  succession_every_days: 14,
  care: [],
  windows: [{ start_month: 9, end_month: 11, label: 'Sep–Nov' }],
  ...over,
});

const tomato = detail({
  id: 'tomato', name: 'Tomato', aliases: ['tamatar', 'टमाटर'], family: 'SOLANACEAE', method: 'NURSERY_TRANSPLANT',
  scientific_name: 'Solanum lycopersicum', description: 'The kitchen garden staple.', sun: 'FULL',
  germination_days: [5, 10], transplant_after_days: [25, 30], days_to_first_harvest: [90, 110],
  thin_after_days: null, succession_every_days: null, care: [{ key: 'stake', after: 'TRANSPLANTING', days: 20 }],
});

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

function setup(crop: Record<string, unknown>, onList: Array<Record<string, unknown>> = []) {
  let posted: unknown;
  server.use(
    http.get(`${API}/crops/calendar/:id`, () => HttpResponse.json(ok(crop))),
    http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf(onList))),
    http.post(`${API}/crops/plan`, async ({ request }) => {
      posted = await request.json();
      return HttpResponse.json(ok(plantRecord({ id: 'c7', crop_id: crop.id as string, crop_stage: 'PLANNED', record_kind: 'CROP' })), { status: 201 });
    }),
  );
  renderWithApp(
    <Routes>
      <Route path="/crops/:cropId" element={<CropDetailScreen />} />
      <Route path="/plants/:id" element={<Where />} />
    </Routes>,
    { route: `/crops/${crop.id as string}` },
  );
  return { posted: () => posted };
}

describe('crop detail', () => {
  it('shows a nursery crop with its facts, steps and rotation tip', async () => {
    setup(tomato);
    expect(await screen.findByRole('heading', { level: 1, name: 'Tomato' })).toBeInTheDocument();
    expect(screen.getByText('टमाटर')).toBeInTheDocument();
    expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
    expect(screen.getByText(/sow now \(sep–nov\)/i)).toBeInTheDocument();
    const facts = screen.getByRole('list', { name: /at a glance/i });
    expect(within(facts).getByText(/5–10 days/)).toBeInTheDocument();
    expect(within(facts).getByText(/25–30 days/)).toBeInTheDocument();
    expect(within(facts).getByText(/90–110 days/)).toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: /how it grows/i })).getAllByRole('listitem').map((li) => li.querySelector('h3')?.textContent);
    expect(steps).toEqual(['Seeds', 'Nursery tray', 'Transplant', 'Stake', 'Harvest']);
    expect(screen.getByText(/don't follow it with tomato, brinjal, chilli/i)).toBeInTheDocument();
  });

  it('shows a direct-sown crop with a thin step and no transplant fact', async () => {
    setup(detail());
    await screen.findByRole('heading', { level: 1, name: 'Spinach (Palak)' });
    expect(within(screen.getByRole('list', { name: /at a glance/i })).queryByText(/transplant/i)).not.toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: /how it grows/i })).getAllByRole('listitem').map((li) => li.querySelector('h3')?.textContent);
    expect(steps).toEqual(['Seeds', 'Sow', 'Thin', 'Harvest']);
    expect(screen.getByText(/sow again every 14 days/i)).toBeInTheDocument();
  });

  it('says when the next sowing is out of season', async () => {
    setup(detail({ status: 'later', next_month: 2, window_label: 'Feb–Mar' }));
    expect(await screen.findByText(/next sowing: feb–mar/i)).toBeInTheDocument();
  });

  it('starts now: adds to the plan and opens the crop to start it', async () => {
    const h = setup(tomato);
    await userEvent.click(await screen.findByRole('button', { name: /start now/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/plants/c7?start=1'));
    expect(h.posted()).toEqual({ crop_id: 'tomato' });
  });

  it('shows On your list when the crop is already planned', async () => {
    setup(tomato, [plantRecord({ id: 'p1', crop_id: 'tomato', crop_stage: 'PLANNED', record_kind: 'CROP' })]);
    expect(await screen.findByText(/on your list/i)).toBeInTheDocument();
  });

  it('says so when Start now fails, and stays on the page', async () => {
    setup(tomato);
    server.use(http.post(`${API}/crops/plan`, () => HttpResponse.json(fail('SERVER_ERROR', 'Something went wrong'), { status: 500 })));
    await userEvent.click(await screen.findByRole('button', { name: /start now/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('where')).not.toBeInTheDocument();
  });
});
