import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fail, ok, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { DashboardScreen } from '.';

const guide = { season: 'Winter', crops: ['Peas', 'Carrots'], advice: 'Protect young saplings from morning frost.' };

function baseHandlers(opts: { tasks?: unknown[]; tasksFail?: boolean; plants?: unknown[] } = {}) {
  const calls = { materialize: [] as string[], weather: 0 };
  server.use(
    http.get(`${API}/ledger/tasks`, () =>
      opts.tasksFail
        ? HttpResponse.json(fail('X'), { status: 500 })
        : HttpResponse.json(pageOf(opts.tasks ?? [taskRecord()])),
    ),
    http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf(opts.plants ?? [plantRecord()]))),
    http.get(`${API}/seasonal/guide`, () => HttpResponse.json(ok(guide))),
    http.get(`${API}/seasonal/weather`, () => {
      calls.weather += 1;
      return HttpResponse.json(ok({}));
    }),
    http.post(`${API}/seasonal/plant/:id/materialize-tasks`, async ({ params }) => {
      calls.materialize.push(String(params.id));
      await new Promise((r) => setTimeout(r, 20));
      return HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 });
    }),
  );
  return calls;
}

describe('dashboard', () => {
  it('greets, shows this week’s tasks and the seasonal guide — never weather', async () => {
    const calls = baseHandlers({
      tasks: [taskRecord(), taskRecord({ id: 't0', title: 'Water Aam', due_date: new Date(Date.now() - 3 * 864e5).toISOString() })],
    });
    renderWithApp(<DashboardScreen />);
    expect(await screen.findByRole('heading', { name: /asha/i })).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: /plan pest response/i })).toBeInTheDocument();
    expect(screen.getByText(/days overdue/i)).toBeInTheDocument();
    expect(await screen.findByText(/protect young saplings/i)).toBeInTheDocument();
    expect(calls.weather).toBe(0);
  });

  it('asks for this season’s tasks once per plant per session, across remounts', async () => {
    const calls = baseHandlers({ plants: [plantRecord(), plantRecord({ id: 'p2', name: 'Nimbu' })] });
    const first = renderWithApp(<DashboardScreen />);
    await waitFor(() => expect(calls.materialize.sort()).toEqual(['p1', 'p2']));
    first.unmount();
    // Same session store, new mount.
    const { TestProviders } = await import('../../test/render');
    const { render } = await import('@testing-library/react');
    render(
      <TestProviders session={first.session}>
        <DashboardScreen />
      </TestProviders>,
    );
    await screen.findByRole('heading', { name: /asha/i });
    await new Promise((r) => setTimeout(r, 60));
    expect(calls.materialize).toHaveLength(2);
  });

  it('shows "nothing due" only after the season check has finished', async () => {
    baseHandlers({ tasks: [] });
    renderWithApp(<DashboardScreen />);
    expect(screen.queryByText(/nothing due this week/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/nothing due this week/i)).toBeInTheDocument();
  });

  it('a tasks error offers retry while the guide still shows', async () => {
    baseHandlers({ tasksFail: true });
    renderWithApp(<DashboardScreen />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(/protect young saplings/i)).toBeInTheDocument();
  });
});
