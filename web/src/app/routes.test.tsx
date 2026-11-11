import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ok, pageOf, plantRecord } from '../test/fixtures';
import { API, server } from '../test/msw/server';
import { renderWithApp, testUser } from '../test/render';
import { AppRoutes } from './routes';

function backend() {
  server.use(
    http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([plantRecord()]))),
    http.get(`${API}/ledger/tasks`, () => HttpResponse.json(pageOf([]))),
    http.get(`${API}/seasonal/guide`, () => HttpResponse.json(ok({ season: 'Winter', crops: [], advice: 'Mulch.' }))),
    http.post(`${API}/seasonal/plant/:id/materialize-tasks`, () => HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 })),
  );
}

describe('routes', () => {
  it('sends signed-out visitors to login', async () => {
    renderWithApp(<AppRoutes />, { route: '/plants', user: null });
    expect(await screen.findByRole('heading', { name: /your garden awaits/i })).toBeInTheDocument();
  });

  it('sends incomplete profiles to onboarding', async () => {
    renderWithApp(<AppRoutes />, { route: '/', user: testUser({ district: null, region_cluster: null, garden_types: [] }) });
    expect(await screen.findByRole('heading', { name: /choose your language/i })).toBeInTheDocument();
  });

  it.each([
    ['/', /good (morning|afternoon|evening)/i],
    ['/plants', /my plants/i],
    ['/plants/new', /start a legacy/i],
    ['/tasks', /daily path/i],
    ['/scan', /^scan$/i],
    ['/profile', /^profile$/i],
  ])('%s renders its screen', async (route, heading) => {
    backend();
    renderWithApp(<AppRoutes />, { route });
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each([
    ['/', true],
    ['/plants', true],
    ['/scan', true],
    ['/profile', true],
    ['/tasks', false],
    ['/plants/new', false],
  ])('bottom navigation on %s: %s', async (route, shown) => {
    backend();
    renderWithApp(<AppRoutes />, { route });
    await screen.findAllByRole('heading');
    expect(screen.queryByRole('navigation', { name: /main/i }) !== null).toBe(shown);
    if (shown) expect(within(screen.getByRole('navigation', { name: /main/i })).getAllByRole('link')).toHaveLength(4);
  });

  it('shows not-found for unknown routes', async () => {
    renderWithApp(<AppRoutes />, { route: '/nope' });
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
