import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ok, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { taskSchema } from '../tasks';
import { useCreatePlant, useEndPlant, usePlant, usePlants, useRestorePlant } from '.';

function PastTrees() {
  const plants = usePlants(1, 'ended');
  return <p>{plants.data ? `past ${plants.data.items.length}` : 'loading'}</p>;
}

function EndIt() {
  const plant = usePlant('p1');
  const end = useEndPlant('p1');
  const restore = useRestorePlant('p1');
  return (
    <div>
      <p>{plant.data ? `reason ${plant.data.end_reason ?? 'none'} profile ${plant.data.life_profile?.note_key ?? 'none'}` : 'loading'}</p>
      <button onClick={() => end.mutate({ reason: 'DISEASE_OR_PEST', entry_id: 'd1' })}>end</button>
      <button onClick={() => restore.mutate()}>restore</button>
    </div>
  );
}

function Replace() {
  const create = useCreatePlant();
  return <button onClick={() => create.mutate({ name: 'Nimbu 2', species: 'Lemon', record_kind: 'TREE', replaces_id: 'p1' })}>replace</button>;
}

describe('plant end-of-life data', () => {
  it('asks for past trees with status=ended', async () => {
    let status: string | null = null;
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) => {
        status = new URL(request.url).searchParams.get('status');
        return HttpResponse.json(pageOf([plantRecord({ ended_at: '2026-03-01T00:00:00.000Z', end_reason: 'WEATHER' })]));
      }),
    );
    renderWithApp(<PastTrees />);
    expect(await screen.findByText('past 1')).toBeInTheDocument();
    expect(status).toBe('ended');
  });

  it('ends a plant with its reason and linked entry, then shows the new state; restore posts too', async () => {
    let ended = false;
    let body: unknown;
    let restored = 0;
    server.use(
      http.get(`${API}/ledger/plants/p1`, () =>
        HttpResponse.json(
          ok({
            ...plantRecord(ended ? { ended_at: '2026-11-10T00:00:00.000Z', end_reason: 'DISEASE_OR_PEST' } : {}),
            _count: { journal_entries: 0 },
            life_profile: { first_fruit_months: [36, 60], productive_until_months: [480, 720], lifespan_months: [720, 1200], note_key: 'mango' },
          }),
        ),
      ),
      http.post(`${API}/ledger/plants/p1/end`, async ({ request }) => {
        body = await request.json();
        ended = true;
        return HttpResponse.json(ok(plantRecord({ ended_at: '2026-11-10T00:00:00.000Z', end_reason: 'DISEASE_OR_PEST' })), { status: 201 });
      }),
      http.post(`${API}/ledger/plants/p1/restore`, () => {
        restored += 1;
        ended = false;
        return HttpResponse.json(ok(plantRecord()), { status: 201 });
      }),
    );
    renderWithApp(<EndIt />);
    expect(await screen.findByText('reason none profile mango')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'end' }));
    expect(await screen.findByText('reason DISEASE_OR_PEST profile mango')).toBeInTheDocument();
    expect(body).toEqual({ reason: 'DISEASE_OR_PEST', entry_id: 'd1' });
    await userEvent.click(screen.getByRole('button', { name: 'restore' }));
    expect(await screen.findByText('reason none profile mango')).toBeInTheDocument();
    expect(restored).toBe(1);
  });

  it('sends replaces_id when planting a replacement', async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/ledger/plants`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ id: 'p2' })), { status: 201 });
      }),
      http.post(`${API}/seasonal/plant/p2/materialize-tasks`, () => HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 })),
    );
    renderWithApp(<Replace />);
    await userEvent.click(screen.getByRole('button', { name: 'replace' }));
    await expect.poll(() => body?.replaces_id).toBe('p1');
  });

  it('parses a cancelled task', () => {
    expect(taskSchema.parse(taskRecord({ status: 'CANCELLED' })).status).toBe('CANCELLED');
  });
});
