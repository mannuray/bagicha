import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fail, ok, pagedResponse, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { DashboardScreen } from '.';

const guide = { season: 'Winter', crops: ['Peas', 'Carrots'], advice: 'Protect young saplings from morning frost.' };

function baseHandlers(
  opts: { tasks?: unknown[]; tasksFail?: boolean; plants?: unknown[]; plantsFail?: boolean; materializeFail?: boolean } = {},
) {
  const calls = { materialize: [] as string[], weather: 0 };
  server.use(
    http.get(`${API}/ledger/tasks`, () =>
      opts.tasksFail
        ? HttpResponse.json(fail('X'), { status: 500 })
        : HttpResponse.json(pageOf(opts.tasks ?? [taskRecord()])),
    ),
    http.get(`${API}/ledger/plants`, ({ request }) => {
      if (opts.plantsFail) return HttpResponse.json(fail('X'), { status: 500 });
      return HttpResponse.json(pagedResponse(request, opts.plants ?? [plantRecord()]));
    }),
    http.get(`${API}/seasonal/guide`, () => HttpResponse.json(ok(guide))),
    http.get(`${API}/seasonal/weather`, () => {
      calls.weather += 1;
      return HttpResponse.json(ok({}));
    }),
    http.post(`${API}/seasonal/plant/:id/materialize-tasks`, async ({ params }) => {
      calls.materialize.push(String(params.id));
      await new Promise((r) => setTimeout(r, 20));
      if (opts.materializeFail) return HttpResponse.json(fail('X'), { status: 500 });
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
    expect(screen.getByText(/due 3 days ago/i)).toBeInTheDocument();
    expect(await screen.findByText(/protect young saplings/i)).toBeInTheDocument();
    expect(calls.weather).toBe(0);
    expect(screen.getAllByText(/^this week$/i)).toHaveLength(1);
  });

  it('shows the Stitch orchard photo behind the greeting', async () => {
    baseHandlers();
    const { container } = renderWithApp(<DashboardScreen />);
    await screen.findByRole('heading', { name: /asha/i });
    expect(container.querySelector('header img[src*="dashboard-orchard"]')).not.toBeNull();
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

  it('an empty garden shows "nothing due" instead of spinning', async () => {
    baseHandlers({ tasks: [], plants: [] });
    renderWithApp(<DashboardScreen />);
    const week = await screen.findByRole('region', { name: /this week/i });
    expect(await within(week).findByText(/nothing due this week/i)).toBeInTheDocument();
  });

  it('a tasks error offers retry while the guide still shows', async () => {
    baseHandlers({ tasksFail: true });
    renderWithApp(<DashboardScreen />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(/protect young saplings/i)).toBeInTheDocument();
  });

  it('does not spin forever when the plant list fails; it offers a retry', async () => {
    baseHandlers({ tasks: [], plantsFail: true });
    renderWithApp(<DashboardScreen />);
    const week = await screen.findByRole('region', { name: /this week/i });
    await waitFor(() => expect(within(week).getByRole('alert')).toBeInTheDocument());
    expect(within(week).getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(within(week).queryByText(/nothing due this week/i)).not.toBeInTheDocument();
  });

  it('says the season check failed instead of "nothing due" when materialize fails', async () => {
    baseHandlers({ tasks: [], materializeFail: true });
    renderWithApp(<DashboardScreen />);
    const week = await screen.findByRole('region', { name: /this week/i });
    expect(await within(week).findByRole('alert')).toBeInTheDocument();
    expect(within(week).queryByText(/nothing due this week/i)).not.toBeInTheDocument();
  });

  it('syncs crop reminders once per session and skips the tree pack for journey crops', async () => {
    const calls = baseHandlers({ plants: [plantRecord(), plantRecord({ id: 'c1', name: 'Tomato', crop_id: 'tomato', crop_stage: 'IN_GROUND', record_kind: 'CROP' })] });
    let syncs = 0;
    server.use(http.post(`${API}/crops/plan/sync`, () => { syncs += 1; return HttpResponse.json(ok({ created_count: 0 }), { status: 201 }); }));
    const first = renderWithApp(<DashboardScreen />);
    await waitFor(() => expect(calls.materialize).toEqual(['p1']));
    await waitFor(() => expect(syncs).toBe(1));
    first.unmount();
    const { TestProviders } = await import('../../test/render');
    const { render } = await import('@testing-library/react');
    render(<TestProviders session={first.session}><DashboardScreen /></TestProviders>);
    await screen.findByRole('heading', { name: /asha/i });
    await new Promise((r) => setTimeout(r, 50));
    expect(syncs).toBe(1);
  });

  it('links "good to sow now" to the crop list', async () => {
    baseHandlers();
    renderWithApp(<DashboardScreen />);
    expect(await screen.findByRole('link', { name: /good to sow now/i })).toHaveAttribute('href', '/crops');
  });

  it('asks for this season’s tasks for every plant, not only the first page', async () => {
    const plants = Array.from({ length: 130 }, (_, i) => plantRecord({ id: `p${i}`, name: `Tree ${i}` }));
    const calls = baseHandlers({ plants });
    renderWithApp(<DashboardScreen />);
    await waitFor(() => expect(calls.materialize).toHaveLength(130), { timeout: 4000 });
  });

  describe('your garden', () => {
    const crop = (id: string, stage: string) => plantRecord({ id, name: id, record_kind: 'CROP', crop_id: 'palak', crop_stage: stage });
    const garden = (active: unknown[], planned: unknown[]) => {
      baseHandlers({ plants: active });
      server.use(
        http.get(`${API}/ledger/plants`, ({ request }) =>
          HttpResponse.json(pagedResponse(request, new URL(request.url).searchParams.get('status') === 'planned' ? planned : active)),
        ),
      );
    };

    it('counts trees and growing crops, each linking to its group on the Plants tab', async () => {
      garden([plantRecord({ id: 'p1' }), plantRecord({ id: 'p2' }), crop('c1', 'HARVESTING')], [crop('c2', 'PLANNED')]);
      renderWithApp(<DashboardScreen />);
      const tile = await screen.findByRole('region', { name: /your garden/i });
      expect(await within(tile).findByRole('link', { name: /2\s*trees/i })).toHaveAttribute('href', '/plants?group=trees');
      expect(within(tile).getByRole('link', { name: /1\s*crop growing/i })).toHaveAttribute('href', '/plants?group=crops');
      expect(await within(tile).findByRole('link', { name: /\+1 planned/i })).toHaveAttribute('href', '/plants?group=crops&tab=planned');
    });

    it('shows an empty group as 0, with one add button for the whole garden', async () => {
      garden([plantRecord({ id: 'p1' })], []);
      renderWithApp(<DashboardScreen />);
      const tile = await screen.findByRole('region', { name: /your garden/i });
      expect(await within(tile).findByRole('link', { name: /0\s*crops growing/i })).toHaveAttribute('href', '/plants?group=crops');
      expect(within(tile).getAllByRole('button')).toHaveLength(1);
      await userEvent.click(within(tile).getByRole('button', { name: /add to garden/i }));
      expect(screen.getByRole('dialog', { name: /what are you growing/i })).toBeInTheDocument();
    });

    it('counts flowers apart from crops, seasonal and perennial', async () => {
      garden([
        plantRecord({ id: 'p1' }),
        crop('c1', 'IN_GROUND'),
        plantRecord({ id: 'f1', record_kind: 'FLOWER', crop_id: 'marigold', crop_stage: 'HARVESTING' }),
        plantRecord({ id: 'f2', record_kind: 'FLOWER' }),
      ], []);
      renderWithApp(<DashboardScreen />);
      const tile = await screen.findByRole('region', { name: /your garden/i });
      expect(await within(tile).findByRole('link', { name: /2\s*flowers/i })).toHaveAttribute('href', '/plants?group=flowers');
      expect(within(tile).getByRole('link', { name: /1\s*crop growing/i })).toBeInTheDocument();
      expect(within(tile).getByText(/1 seasonal · 1 perennial/i)).toBeInTheDocument();
    });
  });
});
