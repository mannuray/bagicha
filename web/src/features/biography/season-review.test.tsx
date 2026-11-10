import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fail, ok, pageOf } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { SeasonReviewScreen } from '.';

const plan = {
  cycle_year: 2025,
  summary: 'Cycle 2025 shows signals that can be improved before the next season.',
  likely_issues: ['Flowering was recorded but fruit set was not confirmed.'],
  what_to_change: ['Start pest scouting before flowering.'],
  watch_early: ['Check panicles weekly for hoppers.'],
  priority_actions: ['Mulch the basin before summer.'],
  completed_tasks: 3,
  skipped_tasks: 1,
  pending_tasks: 2,
};

const routes = (
  <Routes>
    <Route path="/plants/:id/season" element={<SeasonReviewScreen />} />
  </Routes>
);

describe('season review', () => {
  it('shows what went wrong, what to change and task follow-through', async () => {
    server.use(
      http.get(`${API}/ledger/plants/p1/mitigation-plan`, () => HttpResponse.json(ok(plan))),
      http.get(`${API}/ledger/plants/p1/cycles`, () => HttpResponse.json(pageOf([]))),
    );
    renderWithApp(routes, { route: '/plants/p1/season' });
    expect(await screen.findByRole('heading', { name: /season 2025/i })).toBeInTheDocument();
    expect(screen.getByText(/fruit set was not confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/start pest scouting/i)).toBeInTheDocument();
    expect(screen.getByText(/check panicles weekly/i)).toBeInTheDocument();
    expect(screen.getByText(/mulch the basin/i)).toBeInTheDocument();
    expect(screen.getByText(/3 done/i)).toBeInTheDocument();
  });

  it('explains how to get a review when there is no cycle yet', async () => {
    server.use(
      http.get(`${API}/ledger/plants/p1/mitigation-plan`, () =>
        HttpResponse.json(ok({ ...plan, cycle_year: null, likely_issues: [], what_to_change: [], watch_early: [], priority_actions: [], completed_tasks: 0, skipped_tasks: 0, pending_tasks: 0 })),
      ),
      http.get(`${API}/ledger/plants/p1/cycles`, () => HttpResponse.json(pageOf([]))),
    );
    renderWithApp(routes, { route: '/plants/p1/season' });
    expect(await screen.findByText(/log flowering, fruit set and harvest/i)).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(
      http.get(`${API}/ledger/plants/p1/mitigation-plan`, () => HttpResponse.json(fail('X'), { status: 500 })),
      http.get(`${API}/ledger/plants/p1/cycles`, () => HttpResponse.json(pageOf([]))),
    );
    renderWithApp(routes, { route: '/plants/p1/season' });
    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('a missing plant shows "not in your garden" (Review Focus #4)', async () => {
    const missing = () => HttpResponse.json(fail('PLANT_NOT_FOUND'), { status: 404 });
    server.use(http.get(`${API}/ledger/plants/p1/mitigation-plan`, missing), http.get(`${API}/ledger/plants/p1/cycles`, missing));
    renderWithApp(routes, { route: '/plants/p1/season' });
    expect(await screen.findByText(/isn't in your garden/i)).toBeInTheDocument();
  });
});
