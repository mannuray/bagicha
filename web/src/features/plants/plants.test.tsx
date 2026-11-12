import { screen, waitFor, within } from '@testing-library/react';
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

function Search() {
  return <p data-testid="search">{useLocation().search}</p>;
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

  it('on the Crops and Flowers tabs, the empty card invites that kind, not a tree', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([]))));
    renderWithApp(routes, { route: '/plants' });
    await userEvent.click(await screen.findByRole('button', { name: /^crops$/i }));
    expect(await screen.findByRole('link', { name: /find a crop to grow/i })).toHaveAttribute('href', '/crops');
    expect(screen.queryByText(/add your first tree/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^flowers$/i }));
    expect(await screen.findByRole('link', { name: /add your first flower/i })).toHaveAttribute('href', '/crops?kind=flower');
  });

  it('shows an error with retry instead of an empty garden', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(fail('X'), { status: 500 })));
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/add your first tree/i)).not.toBeInTheDocument();
  });
});

describe('the list remembers its place', () => {
  it('the chosen tab is in the address, so opening a plant and coming back keeps it', async () => {
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) =>
        new URL(request.url).searchParams.get('status') === 'ended'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'p9', name: 'Old Papita', ended_at: '2026-03-15T06:00:00.000Z', end_reason: 'OLD_AGE' })]))
          : HttpResponse.json(pageOf([plantRecord()])),
      ),
    );
    renderWithApp(
      <Routes>
        <Route path="/plants" element={<><PlantListScreen /><Search /></>} />
      </Routes>,
      { route: '/plants?group=trees' },
    );
    await userEvent.click(await screen.findByRole('tab', { name: /^past$/i }));
    expect(screen.getByTestId('search')).toHaveTextContent('?group=trees&tab=ended');
  });
});

describe('past trees', () => {
  it('lists past trees under their own tab with reason and date', async () => {
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) =>
        new URL(request.url).searchParams.get('status') === 'ended'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'p9', name: 'Old Papita', ended_at: '2026-03-15T06:00:00.000Z', end_reason: 'OLD_AGE' })]))
          : HttpResponse.json(pageOf([plantRecord()])),
      ),
    );
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByText('Aam')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /^past$/i }));
    expect(await screen.findByText('Old Papita')).toBeInTheDocument();
    expect(screen.getByText(/old age · mar 2026/i)).toBeInTheDocument();
    expect(screen.queryByText('Aam')).not.toBeInTheDocument();
  });
});

describe('want to grow', () => {
  it('lists planned crops under their own tab, with a way to find more', async () => {
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) =>
        new URL(request.url).searchParams.get('status') === 'planned'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'c1', name: 'Tomato', species: 'Tomato', record_kind: 'CROP', crop_id: 'tomato', crop_stage: 'PLANNED' })]))
          : HttpResponse.json(pageOf([plantRecord()])),
      ),
    );
    renderWithApp(routes, { route: '/plants' });
    await screen.findByText('Aam');
    await userEvent.click(screen.getByRole('tab', { name: /want to grow/i }));
    expect(await screen.findByText('Tomato')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find crops to grow/i })).toHaveAttribute('href', '/crops');
  });

  it('no longer offers Crop on the add form: crops come through Want to grow', () => {
    renderWithApp(routes, { route: '/plants/new' });
    expect(screen.queryByRole('button', { name: /^crop$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^tree$/i })).toBeInTheDocument();
  });
});

describe('plant a replacement', () => {
  it('prefills from the tree it replaces and links them on save', async () => {
    let created: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/ledger/plants/p1`, () =>
        HttpResponse.json(ok({ ...plantRecord({ name: 'Nimbu', species: 'Lemon', variety: 'Kagzi', ended_at: '2026-03-15T06:00:00.000Z' }), _count: { journal_entries: 0 } })),
      ),
      http.post(`${API}/ledger/plants`, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ id: 'new1' })), { status: 201 });
      }),
      http.post(`${API}/seasonal/plant/new1/materialize-tasks`, () => HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 })),
    );
    renderWithApp(routes, { route: '/plants/new?replaces=p1' });
    await waitFor(() => expect(screen.getByLabelText(/^species/i)).toHaveValue('Lemon'));
    expect(screen.getByLabelText(/variety/i)).toHaveValue('Kagzi');
    await userEvent.type(screen.getByLabelText(/tree name/i), 'Nimbu 2');
    await userEvent.click(screen.getByRole('button', { name: /add to sanctuary/i }));
    await waitFor(() => expect(created).toMatchObject({ name: 'Nimbu 2', species: 'Lemon', replaces_id: 'p1' }));
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

describe('groups', () => {
  it('opens on the group from the link, and asks the server for that kind', async () => {
    const kinds: Array<string | null> = [];
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) => {
        const url = new URL(request.url);
        kinds.push(url.searchParams.get('kind'));
        return url.searchParams.get('kind') === 'crop'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'c1', name: 'Palak', species: 'Spinach (Palak)', record_kind: 'CROP', crop_id: 'palak', crop_stage: 'HARVESTING', season_started_at: new Date(Date.now() - 3 * 86400000).toISOString() })]))
          : HttpResponse.json(pageOf([plantRecord()]));
      }),
    );
    renderWithApp(routes, { route: '/plants?group=crops' });
    expect(await screen.findByText('Palak')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^crops$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/harvesting · day 3/i)).toBeInTheDocument();
    expect(kinds).toContain('crop');
    await userEvent.click(screen.getByRole('button', { name: /^trees$/i }));
    expect(await screen.findByText('Aam')).toBeInTheDocument();
    expect(kinds).toContain('tree');
  });

  it('shows when a tree was planted', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([plantRecord()]))));
    renderWithApp(routes, { route: '/plants' });
    expect(await screen.findByText(/planted 2015/i)).toBeInTheDocument();
  });

  it('opens on Want to grow from the planned link', async () => {
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) =>
        new URL(request.url).searchParams.get('status') === 'planned'
          ? HttpResponse.json(pageOf([plantRecord({ id: 'c2', name: 'Methi', record_kind: 'CROP', crop_id: 'methi', crop_stage: 'PLANNED' })]))
          : HttpResponse.json(pageOf([plantRecord()])),
      ),
    );
    renderWithApp(routes, { route: '/plants?group=crops&tab=planned' });
    expect(await screen.findByText('Methi')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /want to grow/i })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('flowers', () => {
  it('the add form opens on Flower from ?kind=FLOWER and suggests flowers only', async () => {
    server.use(
      http.get(`${API}/plants/search`, () =>
        HttpResponse.json(pageOf([
          { id: 'f1', display_name: 'Rose', species_family: 'rose', species: 'rose', variety: null, plant_type: 'perennial_flower' },
          { id: 't1', display_name: 'Rose apple', species_family: 'generic', species: 'rose apple', variety: null, plant_type: 'fruit_tree' },
        ])),
      ),
    );
    renderWithApp(routes, { route: '/plants/new?kind=FLOWER' });
    expect(await screen.findByRole('button', { name: /^flower$/i })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(screen.getByLabelText(/^species/i), 'rose');
    expect(await screen.findByRole('option', { name: /^rose$/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /rose apple/i })).not.toBeInTheDocument();
  });

  it('lists flowers in their own group with bloom wording', async () => {
    const kinds: Array<string | null> = [];
    server.use(
      http.get(`${API}/ledger/plants`, ({ request }) => {
        kinds.push(new URL(request.url).searchParams.get('kind'));
        return HttpResponse.json(pageOf([
          plantRecord({ id: 'f1', name: 'Genda', species: 'Marigold (Genda)', record_kind: 'FLOWER', crop_id: 'marigold', crop_stage: 'HARVESTING', season_started_at: new Date(Date.now() - 3 * 86400000).toISOString() }),
          plantRecord({ id: 'f2', name: 'Gulab', species: 'Rose', record_kind: 'FLOWER', lifecycle_stage: 'FIRST_FLOWERING', planting_date: '2022-01-01T00:00:00.000Z' }),
        ]));
      }),
    );
    renderWithApp(routes, { route: '/plants?group=flowers' });
    expect(await screen.findByText('Genda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^flowers$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(kinds).toContain('flower');
    expect(screen.getByText(/blooming · day 3/i)).toBeInTheDocument();
    expect(screen.getByText(/blooming · planted 2022/i)).toBeInTheDocument();
  });

describe('an old tree on the add form', () => {
  it('asks whether it has fruited, and sends "yes, since 2019"', async () => {
    let created: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/ledger/plants`, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(plantRecord({ id: 'new1' })), { status: 201 });
      }),
      http.post(`${API}/seasonal/plant/new1/materialize-tasks`, () => HttpResponse.json(ok({ results: [], created_count: 0 }), { status: 201 })),
    );
    renderWithApp(routes, { route: '/plants/new' });
    await userEvent.type(screen.getByLabelText(/tree name/i), 'Aam');
    await userEvent.type(screen.getByLabelText(/^species/i), 'Mango');
    await userEvent.type(screen.getByLabelText(/year planted/i), '2017');
    const question = screen.getByRole('group', { name: /has it fruited yet/i });
    expect(within(question).getByRole('button', { name: /not sure/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/since about which year/i)).toBeNull();
    await userEvent.click(within(question).getByRole('button', { name: /^yes$/i }));
    await userEvent.type(screen.getByLabelText(/since about which year/i), '2019');
    await userEvent.click(screen.getByRole('button', { name: /add to sanctuary/i }));
    await waitFor(() => expect(created).toMatchObject({ bearing_status: 'BEARING', bearing_since_year: 2019 }));
  });

  it('"not sure" sends no answer, and flowers are not asked', async () => {
    renderWithApp(routes, { route: '/plants/new?kind=FLOWER' });
    expect(screen.queryByRole('group', { name: /has it fruited yet/i })).toBeNull();
  });
});
});
