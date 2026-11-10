import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { cycleRecord, ok, pagedResponse, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { useAllCycles, usePlant } from '.';

function Cycles() {
  const cycles = useAllCycles('p1');
  return <p>{cycles.data ? `cycles ${cycles.data.length}` : 'loading'}</p>;
}

function Milestones() {
  const plant = usePlant('p1');
  return <p>{plant.data ? `first harvest ${plant.data.first_harvest_at ?? 'none'} flowering ${plant.data.first_flowering_at ?? 'none'}` : 'loading'}</p>;
}

describe('plant data for the tree page', () => {
  it('loads every cycle page', async () => {
    const all = Array.from({ length: 250 }, (_, i) => cycleRecord({ id: `c${i}`, cycle_year: 2026 - i }));
    server.use(http.get(`${API}/ledger/plants/p1/cycles`, ({ request }) => HttpResponse.json(pagedResponse(request, all))));
    renderWithApp(<Cycles />);
    expect(await screen.findByText('cycles 250')).toBeInTheDocument();
  });

  it('reads the milestone dates, and treats missing ones as none', async () => {
    server.use(
      http.get(`${API}/ledger/plants/p1`, () =>
        HttpResponse.json(ok({ ...plantRecord(), _count: { journal_entries: 0 }, first_harvest_at: '2023-06-01T00:00:00.000Z' })),
      ),
    );
    renderWithApp(<Milestones />);
    expect(await screen.findByText('first harvest 2023-06-01T00:00:00.000Z flowering none')).toBeInTheDocument();
  });
});
