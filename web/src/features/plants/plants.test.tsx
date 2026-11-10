import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fail, ok, pageOf, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { PlantFormScreen, PlantListScreen } from '.';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const routes = (
  <Routes>
    <Route path="/plants" element={<PlantListScreen />} />
    <Route path="/plants/new" element={<PlantFormScreen />} />
    <Route path="/plants/:id/edit" element={<PlantFormScreen />} />
    <Route path="/plants/:id" element={<Where />} />
  </Routes>
);

describe('my plants', () => {
  it('lists plants and loads more pages', async () => {
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        return page === '2'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'p2', name: 'Nimbu' })], { page: 2, has_next: false }))
          : HttpResponse.json(pageOf([plantRecord()], { has_next: true, total_items: 2 }));
      }),
    );
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByText('Aam')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(await screen.findByText('Nimbu')).toBeInTheDocument();
    expect(screen.getByText('Aam')).toBeInTheDocument();
  });

  it('invites the first tree when the garden is empty', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([]))));
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByRole('link', { name: /add your first tree/i })).toHaveAttribute('href', '/plants/new');
  });

  it('shows an error with retry instead of an empty garden', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(fail('X'), { status: 500 })));
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/add your first tree/i)).not.toBeInTheDocument();
  });
});

describe('add a plant', () => {
  it('opens as "Start a Legacy" with the kind chips', async () => {
    renderWithApp(routes, { route: '/plants/new' });
    expect(screen.getByRole('heading', { name: /start a legacy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^tree$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the Stitch sapling photo in the header', () => {
    const { container } = renderWithApp(routes, { route: '/plants/new' });
    expect(container.querySelector('img[src*="add-tree-sapling"]')).not.toBeNull();
  });

  it('requires a name and species', async () => {
    renderWithApp(routes, { route: '/plants/new' });
    await userEvent.click(screen.getByRole('button', { name: /add to sanctuary/i }));
    expect(screen.getByText(/give your tree a name/i)).toBeInTheDocument();
  });

  it('fills species from the catalogue, creates, materializes this season, and opens the plant', async () => {
    let created: Record<string, unknown> | undefined;
    let materialized = 0;
    server.use(
      http.get(`${API}/plants/search`, () =>
        HttpResponse.json(
          pageOf([{ id: 'c1', display_name: 'Mango (Langra)', species_family: 'mango', species: 'Mango', variety: 'Langra', plant_type: 'fruit_tree' }]),
        ),
      ),
      http.post(`${API}/ledger/plants`, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ id: 'new1' })), { status: 201 });
      }),
      http.post(`${API}/seasonal/plant/new1/materialize-tasks`, () => {
        materialized += 1;
        return HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 });
      }),
    );
    renderWithApp(routes, { route: '/plants/new' });
    await userEvent.type(screen.getByLabelText(/tree name/i), 'Aam');
    await userEvent.type(screen.getByLabelText(/^species/i), 'lang');
    await userEvent.click(await screen.findByRole('option', { name: /mango \(langra\)/i }));
    await userEvent.type(screen.getByLabelText(/year planted/i), '2015');
    await userEvent.click(screen.getByRole('button', { name: /add to sanctuary/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/plants/new1'));
    expect(created).toMatchObject({
      name: 'Aam',
      species: 'Mango',
      variety: 'Langra',
      record_kind: 'TREE',
      planting_date: '2015',
      planting_date_precision: 'YEAR',
    });
    expect(materialized).toBe(1);
  });

  it('pre-fills from ?prefill= via plants/resolve (Scan → Add as a plant)', async () => {
    server.use(
      http.post(`${API}/plants/resolve`, () =>
        HttpResponse.json(
          ok({
            match: { id: 'c1', display_name: 'Mango', species_family: 'mango', species: 'Mango', variety: null, plant_type: 'fruit_tree', matched_alias: 'mango' },
            confidence: 'high',
            matched_alias: 'mango',
            alternatives: [],
          }),
        ),
      ),
    );
    renderWithApp(routes, { route: '/plants/new?prefill=Mango' });
    await waitFor(() => expect(screen.getByLabelText(/^species/i)).toHaveValue('Mango'));
  });

  it('edits only the changed fields', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord(), _count: { journal_entries: 0 } }))),
      http.put(`${API}/ledger/plants/p1`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ name: 'Old Aam' })));
      }),
    );
    renderWithApp(routes, { route: '/plants/p1/edit' });
    const name = await screen.findByLabelText(/tree name/i);
    await waitFor(() => expect(name).toHaveValue('Aam'));
    await userEvent.clear(name);
    await userEvent.type(name, 'Old Aam');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(sent).toEqual({ name: 'Old Aam' }));
  });

  it('editing a tree that no longer exists says so instead of offering a retry', async () => {
    server.use(http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(fail('PLANT_NOT_FOUND'), { status: 404 })));
    renderWithApp(routes, { route: '/plants/p1/edit' });
    expect(await screen.findByText(/isn't in your garden/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });
});
