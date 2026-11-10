import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ok, pageOf, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { CropsScreen } from '.';

export const cropItem = (over: Record<string, unknown> = {}) => ({
  id: 'palak', name: 'Spinach (Palak)', aliases: ['palak'], family: 'AMARANTHACEAE', method: 'DIRECT_SOW',
  tags: ['container', 'beginner', 'quick'], days_to_first_harvest: [30, 40],
  guide: { plants_for_family_of_4: 'a 1-metre row every 2 weeks', container: '8-inch pot', spacing_cm: [10, 15] },
  status: 'open', opens_in_days: null, next_month: null, window_label: 'Sep–Nov', ...over,
});

const calendar = [
  cropItem(),
  cropItem({ id: 'tomato', name: 'Tomato', family: 'SOLANACEAE', method: 'NURSERY_TRANSPLANT', tags: ['container'], status: 'soon', opens_in_days: 12, window_label: 'Jan–Feb' }),
  cropItem({ id: 'pumpkin', name: 'Pumpkin', family: 'CUCURBITACEAE', tags: ['beginner'], status: 'later', next_month: 2, window_label: 'Feb–Mar' }),
];

function handlers(onList: Array<Record<string, unknown>> = []) {
  let added: unknown;
  server.use(
    http.get(`${API}/crops/calendar`, () => HttpResponse.json(ok(calendar))),
    http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf(onList))),
    http.post(`${API}/crops/plan`, async ({ request }) => {
      added = await request.json();
      return HttpResponse.json(ok(plantRecord({ id: 'c1', crop_id: 'tomato', crop_stage: 'PLANNED', record_kind: 'CROP' })), { status: 201 });
    }),
  );
  return { added: () => added };
}

describe('what can I sow now?', () => {
  it('groups crops into sow now, coming up and later', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const now = await screen.findByRole('region', { name: /sow now/i });
    expect(within(now).getByText('Spinach (Palak)')).toBeInTheDocument();
    expect(within(now).getByText(/sow sep–nov/i)).toBeInTheDocument();
    const soon = screen.getByRole('region', { name: /coming up/i });
    expect(within(soon).getByText(/opens in 12 days/i)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /later/i })).getByText('Pumpkin')).toBeInTheDocument();
  });

  it('filters by container-friendly, beginner and quick harvest', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByText('Pumpkin');
    await userEvent.click(screen.getByRole('button', { name: /container-friendly/i }));
    expect(screen.queryByText('Pumpkin')).not.toBeInTheDocument();
    expect(screen.getByText('Tomato')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /quick harvest/i }));
    expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
    expect(screen.getByText('Spinach (Palak)')).toBeInTheDocument();
  });

  it('adds a crop to Want to grow, and shows crops already on the list', async () => {
    const h = handlers([plantRecord({ id: 'p9', crop_id: 'palak', crop_stage: 'PLANNED', record_kind: 'CROP' })]);
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const palakCard = (await screen.findByText('Spinach (Palak)')).closest('article') as HTMLElement;
    expect(within(palakCard).getByText(/on your list/i)).toBeInTheDocument();
    const tomatoCard = screen.getByText('Tomato').closest('article') as HTMLElement;
    await userEvent.click(within(tomatoCard).getByRole('button', { name: /add to want to grow/i }));
    await waitFor(() => expect(h.added()).toEqual({ crop_id: 'tomato' }));
  });
});
