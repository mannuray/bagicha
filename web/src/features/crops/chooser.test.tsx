import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ok, pageOf } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { DashboardScreen } from '../dashboard';
import { PlantListScreen } from '../plants';
import { AddToGardenButton } from '.';
import { cropItem } from './test-fixtures';

function handlers() {
  server.use(
    http.get(`${API}/crops/calendar`, () =>
      HttpResponse.json(ok([cropItem(), cropItem({ id: 'methi', name: 'Fenugreek (Methi)' }), cropItem({ id: 'peas', name: 'Peas' }), cropItem({ id: 'okra', name: 'Okra', status: 'later' })])),
    ),
    http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/ledger/tasks`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/seasonal/guide`, () => HttpResponse.json(ok({ season: 'Winter', crops: [], advice: 'Mulch.' }))),
    http.post(`${API}/crops/plan/sync`, () => HttpResponse.json(ok({ created_count: 0 }), { status: 201 })),
  );
}

describe('add to your garden', () => {
  it('opens from Home with a tree and a vegetable path, and lists what to sow now', async () => {
    handlers();
    renderWithApp(<DashboardScreen />);
    await userEvent.click(await screen.findByRole('button', { name: /add to garden/i }));
    const sheet = screen.getByRole('dialog', { name: /what are you growing/i });
    expect(within(sheet).getByRole('link', { name: /plant a tree/i })).toHaveAttribute('href', '/plants/new');
    expect(within(sheet).getByRole('link', { name: /grow a vegetable/i })).toHaveAttribute('href', '/crops');
    expect(await within(sheet).findByText(/sow now: palak, methi, peas/i)).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog', { name: /what are you growing/i })).not.toBeInTheDocument();
  });

  it('opens from the My Plants "+" too', async () => {
    handlers();
    renderWithApp(<PlantListScreen addSlot={<AddToGardenButton />} />, { route: '/plants' });
    await userEvent.click(screen.getByRole('button', { name: /add to garden/i }));
    expect(screen.getByRole('dialog', { name: /what are you growing/i })).toBeInTheDocument();
  });
});
