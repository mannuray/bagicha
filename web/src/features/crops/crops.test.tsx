import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ok, pageOf, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { CropsScreen } from '.';
import { cropItem, flowerItem } from './test-fixtures';


const calendar = [
  flowerItem(),
  cropItem({ aliases: ['palak', 'पालक'] }),
  cropItem({ id: 'tomato', name: 'Tomato', family: 'SOLANACEAE', method: 'NURSERY_TRANSPLANT', tags: ['container'], sun: 'FULL', status: 'soon', opens_in_days: 12, window_label: 'Jan–Feb' }),
  cropItem({ id: 'pumpkin', name: 'Pumpkin', family: 'CUCURBITACEAE', tags: ['beginner'], status: 'later', next_month: 2, window_label: 'Feb–Mar' }),
];

function handlers(onList: Array<Record<string, unknown>> = [], places: Array<Record<string, unknown>> = []) {
  let added: unknown;
  server.use(
    http.get(`${API}/crops/calendar`, () => HttpResponse.json(ok(calendar))),
    http.get(`${API}/garden/places`, () => HttpResponse.json(ok(places))),
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
    await userEvent.click(screen.getByRole('button', { name: /later: pumpkin/i }));
    expect(within(screen.getByRole('region', { name: /later/i })).getByText('Pumpkin')).toBeInTheDocument();
  });

  it('filters by container-friendly, beginner and quick harvest', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByRole('button', { name: /later: pumpkin/i });
    await userEvent.click(screen.getByRole('button', { name: /container-friendly/i }));
    expect(screen.queryByRole('button', { name: /later: pumpkin/i })).not.toBeInTheDocument();
    expect(screen.getByText('Tomato')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /quick harvest/i }));
    expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
    expect(screen.getByText('Spinach (Palak)')).toBeInTheDocument();
  });

  it('adds a crop to Want to grow, and shows crops already on the list', async () => {
    const h = handlers([plantRecord({ id: 'p9', crop_id: 'palak', crop_stage: 'PLANNED', record_kind: 'CROP' })]);
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const palakCard = (await screen.findByText('Spinach (Palak)')).closest('article') as HTMLElement;
    expect(within(palakCard).getByRole('img', { name: /on your list/i })).toBeInTheDocument();
    const tomatoCard = screen.getByText('Tomato').closest('article') as HTMLElement;
    await userEvent.click(within(tomatoCard).getByRole('button', { name: /add to want to grow/i }));
    await waitFor(() => expect(h.added()).toEqual({ crop_id: 'tomato' }));
  });

  it('heads the page with the district and this month', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const month = new Date().toLocaleString('en-IN', { month: 'long' }).toUpperCase();
    expect(await screen.findByText(`PATNA · ${month} SOWING`)).toBeInTheDocument();
    expect(await screen.findByText(/1 crop to sow now/i)).toBeInTheDocument();
  });

  it('shows the Hindi name and links each card to its crop page', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const card = (await screen.findByText('Spinach (Palak)')).closest('article') as HTMLElement;
    expect(within(card).getByText('पालक')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /spinach \(palak\)/i })).toHaveAttribute('href', '/crops/palak');
  });

  it('keeps Later collapsed until asked', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByText('Spinach (Palak)');
    expect(screen.queryByText('Pumpkin', { selector: 'h3' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /later: pumpkin/i }));
    expect(screen.getByText('Pumpkin', { selector: 'h3' })).toBeInTheDocument();
  });

  it('searches names and aliases, including Hindi', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByText('Tomato');
    await userEvent.type(screen.getByRole('searchbox', { name: /search crops/i }), 'पालक');
    expect(screen.getByText('Spinach (Palak)')).toBeInTheDocument();
    expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
  });

  it('hides the sunlight filter until a place has sun set', async () => {
    handlers([], [{ id: 'b1', name: 'Bag 1', kind: 'GROW_BAG', sun_hours: null, archived_at: null }]);
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByText('Tomato');
    expect(screen.queryByRole('button', { name: /suits my sunlight/i })).not.toBeInTheDocument();
  });

  it('keeps only crops that suit the sunniest place', async () => {
    handlers([], [{ id: 'b1', name: 'Balcony', kind: 'POT', sun_hours: 'PARTIAL', archived_at: null }]);
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await userEvent.click(await screen.findByRole('button', { name: /suits my sunlight/i }));
    expect(screen.getByText('Spinach (Palak)')).toBeInTheDocument();
    expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
  });

  it('shows a family pebble when a crop has no photo', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await userEvent.click(await screen.findByRole('button', { name: /later: pumpkin/i }));
    const card = screen.getByText('Pumpkin', { selector: 'h3' }).closest('article') as HTMLElement;
    expect(within(card).getByRole('img', { name: 'Pumpkin' }).tagName).not.toBe('IMG');
  });

  it('uses the bundled photo when a crop has one', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    const card = (await screen.findByText('Tomato')).closest('article') as HTMLElement;
    expect(within(card).getByRole('img', { name: 'Tomato' }).tagName).toBe('IMG');
  });

  it('switches to flowers, with flower filters and a way to add perennials', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops' });
    await screen.findByText('Spinach (Palak)');
    expect(screen.queryByText('Marigold (Genda)')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^flowers$/i }));
    expect(screen.getByRole('button', { name: /^flowers$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Marigold (Genda)')).toBeInTheDocument();
    expect(screen.queryByText('Spinach (Palak)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /long blooming/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /quick harvest/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /perennials like rose or mogra/i })).toHaveAttribute('href', '/plants/new?kind=FLOWER');
  });

  it('opens on flowers from ?kind=flower', async () => {
    handlers();
    renderWithApp(<CropsScreen />, { route: '/crops?kind=flower' });
    expect(await screen.findByText('Marigold (Genda)')).toBeInTheDocument();
  });
});
