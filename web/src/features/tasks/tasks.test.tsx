import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fail, ok, pagedResponse, pageOf, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { TasksScreen } from '.';

const routes = (
  <Routes>
    <Route path="/tasks" element={<TasksScreen />} />
    <Route path="/plants/:id/tasks" element={<TasksScreen />} />
  </Routes>
);

describe('tasks screen', () => {
  it('completes a task once, even on a double tap (Review Focus #5)', async () => {
    let puts = 0;
    let completed = false;
    server.use(
      http.get(`${API}/ledger/tasks`, () =>
        HttpResponse.json(pageOf(completed ? [] : [taskRecord()])),
      ),
      http.put(`${API}/ledger/plants/p1/tasks/t1`, async ({ request }) => {
        puts += 1;
        expect(await request.json()).toEqual({ status: 'COMPLETED' });
        await new Promise((r) => setTimeout(r, 30));
        completed = true;
        return HttpResponse.json(ok({ ...taskRecord(), status: 'COMPLETED', completed_at: new Date().toISOString() }));
      }),
    );
    renderWithApp(routes, { route: '/tasks' });
    const card = await screen.findByRole('article', { name: /plan pest response/i });
    await userEvent.dblClick(within(card).getByRole('button', { name: /mark done/i }));
    await waitFor(() => expect(screen.queryByRole('article', { name: /plan pest response/i })).not.toBeInTheDocument());
    expect(puts).toBe(1);
  });

  it('refetches with a message when the task is gone', async () => {
    let gets = 0;
    server.use(
      http.get(`${API}/ledger/tasks`, () => {
        gets += 1;
        return HttpResponse.json(pageOf([taskRecord()]));
      }),
      http.put(`${API}/ledger/plants/p1/tasks/t1`, () =>
        HttpResponse.json(fail('TASK_NOT_FOUND'), { status: 404 }),
      ),
    );
    renderWithApp(routes, { route: '/tasks' });
    const card = await screen.findByRole('article', { name: /plan pest response/i });
    await userEvent.click(within(card).getByRole('button', { name: /skip/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i);
    await waitFor(() => expect(gets).toBeGreaterThan(1));
  });

  it('per plant: shows that plant’s tasks and can refresh the season', async () => {
    let materialized = 0;
    server.use(
      http.get(`${API}/ledger/plants/p1/tasks`, () => HttpResponse.json(pageOf([taskRecord()]))),
      http.post(`${API}/seasonal/plant/p1/materialize-tasks`, () => {
        materialized += 1;
        return HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 });
      }),
    );
    renderWithApp(routes, { route: '/plants/p1/tasks' });
    expect(await screen.findByRole('article', { name: /plan pest response/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /refresh this season/i }));
    await waitFor(() => expect(materialized).toBe(1));
  });

  it('is the Stitch Daily Path: overdue actions, current plan and closed history', async () => {
    server.use(
      http.get(`${API}/ledger/tasks`, () =>
        HttpResponse.json(
          pageOf([
            taskRecord({ id: 'late', title: 'Deep soil hydration', priority: 'LOW', due_date: new Date(Date.now() - 2 * 864e5).toISOString() }),
            taskRecord({ id: 'soon', title: 'Nitrogen feeding', priority: 'HIGH' }),
            taskRecord({ id: 'done', title: 'Prune lower canopy', status: 'COMPLETED', completed_at: new Date(Date.now() - 864e5).toISOString() }),
          ]),
        ),
      ),
    );
    renderWithApp(routes, { route: '/tasks' });
    const overdue = await screen.findByRole('region', { name: /overdue actions/i });
    const late = within(overdue).getByRole('article', { name: /deep soil hydration/i });
    expect(within(late).getByText(/urgent/i)).toBeInTheDocument();
    expect(within(late).getByText(/due 2 days ago/i)).toBeInTheDocument();
    const plan = screen.getByRole('region', { name: /current plan/i });
    const soon = within(plan).getByRole('article', { name: /nitrogen feeding/i });
    expect(within(soon).getByText(/^high$/i)).toBeInTheDocument();
    expect(within(soon).getByText(/due tomorrow/i)).toBeInTheDocument();
    const closed = screen.getByRole('region', { name: /closed history/i });
    const done = within(closed).getByRole('article', { name: /prune lower canopy/i });
    expect(within(done).getByText(/completed yesterday/i)).toBeInTheDocument();
    expect(within(done).queryByRole('button')).not.toBeInTheDocument();
  });

  it('per plant: says whose maintenance it is', async () => {
    server.use(http.get(`${API}/ledger/plants/p1/tasks`, () => HttpResponse.json(pageOf([taskRecord()]))));
    renderWithApp(routes, { route: '/plants/p1/tasks' });
    expect(await screen.findByText(/maintenance for aam/i)).toBeInTheDocument();
  });

  it('still shows closed history when nothing is due', async () => {
    server.use(
      http.get(`${API}/ledger/tasks`, () =>
        HttpResponse.json(pageOf([taskRecord({ id: 'done', title: 'Prune lower canopy', status: 'SKIPPED', completed_at: null })])),
      ),
    );
    renderWithApp(routes, { route: '/tasks' });
    expect(await screen.findByText(/nothing due/i)).toBeInTheDocument();
    const closed = screen.getByRole('region', { name: /closed history/i });
    expect(within(closed).getByText(/aam · skipped/i)).toBeInTheDocument();
  });

  it('labels cancelled tasks in closed history', async () => {
    server.use(http.get(`${API}/ledger/tasks`, () => HttpResponse.json(pageOf([taskRecord({ id: 'x', title: 'Prune lower canopy', status: 'CANCELLED' })]))));
    renderWithApp(routes, { route: '/tasks' });
    const closed = await screen.findByRole('region', { name: /closed history/i });
    expect(within(closed).getByText(/cancelled · tree ended/i)).toBeInTheDocument();
  });

  it('says when nothing is due', async () => {
    server.use(http.get(`${API}/ledger/tasks`, () => HttpResponse.json(pageOf([]))));
    renderWithApp(routes, { route: '/tasks' });
    expect(await screen.findByText(/nothing due/i)).toBeInTheDocument();
  });

  it('shows a failed Complete on the card itself when the screen gives no error handler', async () => {
    const { TaskCard } = await import('.');
    server.use(http.put(`${API}/ledger/plants/p1/tasks/t1`, () => HttpResponse.json(fail('X'), { status: 500 })));
    const { taskSchema } = await import('.');
    renderWithApp(<TaskCard task={taskSchema.parse(taskRecord())} />);
    await userEvent.click(screen.getByRole('button', { name: /mark done/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });

  it('shows tasks beyond the first page', async () => {
    const all = Array.from({ length: 120 }, (_, i) => taskRecord({ id: `t${i}`, title: `Task ${i}` }));
    server.use(http.get(`${API}/ledger/tasks`, ({ request }) => HttpResponse.json(pagedResponse(request, all))));
    renderWithApp(routes, { route: '/tasks' });
    expect(await screen.findByRole('article', { name: 'Task 119' })).toBeInTheDocument();
  });
});
