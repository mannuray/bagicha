import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { fail, ok, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { createTestSession, renderWithApp, TestProviders } from '../../test/render';
import { RequireAuth } from '../auth';
import { ImageCompressorProvider, LogMomentScreen, type ImageCompressor } from '.';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const fakeCompressor: ImageCompressor = {
  compress: vi.fn(() =>
    Promise.resolve({ blob: new Blob(['jpg'], { type: 'image/jpeg' }), base64: 'anBn', width: 10, height: 10 }),
  ),
};

const screenTree = (
  <ImageCompressorProvider value={fakeCompressor}>
    <Routes>
      <Route path="/plants/:id/log" element={<RequireAuth><LogMomentScreen /></RequireAuth>} />
      <Route path="/plants/:id" element={<Where />} />
      <Route path="/login" element={<Where />} />
    </Routes>
  </ImageCompressorProvider>
);

const entry = (over: object = {}) => ({
  id: 'j1', type: 'NOTE', content: null, metadata: null,
  timestamp: '2026-03-10T00:00:00.000Z', recorded_at: '2026-03-10T00:00:00.000Z',
  plant_cycle_id: 'c1', diagnosis_outcome_id: null, plant_id: 'p1', ...over,
});

function plantHandler() {
  server.use(http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord(), _count: { journal_entries: 0 } }))));
}

describe('log a moment', () => {
  it('is the Stitch sheet: leaf photo behind, kicker, the tree, and a way back', async () => {
    plantHandler();
    const { container } = renderWithApp(screenTree, { route: '/plants/p1/log' });
    expect(await screen.findByRole('heading', { name: /log a moment/i })).toBeInTheDocument();
    expect(screen.getByText(/add to the legacy timeline/i)).toBeInTheDocument();
    expect(await screen.findByText(/for aam/i)).toBeInTheDocument();
    expect(container.querySelector('img[src*="moment-leaves"]')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.getByTestId('where')).toHaveTextContent('/plants/p1');
  });

  it('saves a harvest with quantity, unit and quality', async () => {
    plantHandler();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/ledger/plants/p1/journal`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok(entry({ type: 'HARVEST' })), { status: 201 });
      }),
    );
    renderWithApp(screenTree, { route: '/plants/p1/log' });
    await userEvent.click(await screen.findByRole('button', { name: /^harvest$/i }));
    await userEvent.type(screen.getByLabelText(/how much/i), '12');
    await userEvent.click(screen.getByRole('button', { name: /^good$/i }));
    await userEvent.type(screen.getByLabelText(/note/i), 'Sweet this year');
    await userEvent.click(screen.getByRole('button', { name: /save to biography/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/plants/p1'));
    expect(body).toEqual({
      type: 'HARVEST',
      content: 'Sweet this year',
      metadata: { quantity_value: 12, quantity_unit: 'kg', quality: 'good' },
    });
  });

  it('uploads the photo first, then saves the entry with its key — once, even on a double tap (Review Focus #5)', async () => {
    plantHandler();
    let uploads = 0;
    const posts: Record<string, unknown>[] = [];
    server.use(
      http.post(`${API}/media/images`, async () => {
        uploads += 1;
        await new Promise((r) => setTimeout(r, 30));
        return HttpResponse.json(ok({ key: 'journal/u1/abc.jpg', url: 'u', width: 10, height: 10, is_public: false }), { status: 201 });
      }),
      http.post(`${API}/ledger/plants/p1/journal`, async ({ request }) => {
        posts.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(ok(entry({ type: 'FLOWERING' })), { status: 201 });
      }),
    );
    renderWithApp(screenTree, { route: '/plants/p1/log' });
    await userEvent.click(await screen.findByRole('button', { name: /^flowering$/i }));
    await userEvent.upload(screen.getByLabelText(/add a photo/i), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }));
    await userEvent.dblClick(screen.getByRole('button', { name: /save to biography/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/plants/p1'));
    expect(uploads).toBe(1);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ type: 'FLOWERING', metadata: { photo_key: 'journal/u1/abc.jpg' } });
  });

  it('keeps the form and saves nothing when the photo upload fails', async () => {
    plantHandler();
    let posts = 0;
    server.use(
      http.post(`${API}/media/images`, () => HttpResponse.json(fail('PAYLOAD_TOO_LARGE'), { status: 413 })),
      http.post(`${API}/ledger/plants/p1/journal`, () => {
        posts += 1;
        return HttpResponse.json(ok(entry()), { status: 201 });
      }),
    );
    renderWithApp(screenTree, { route: '/plants/p1/log' });
    await userEvent.type(await screen.findByLabelText(/note/i), 'New leaves');
    await userEvent.upload(screen.getByLabelText(/add a photo/i), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }));
    await userEvent.click(screen.getByRole('button', { name: /save to biography/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/too large/i);
    expect(screen.getByLabelText(/note/i)).toHaveValue('New leaves');
    expect(posts).toBe(0);
  });

  it('keeps what was typed when the session expires mid-save (Review Focus #1)', async () => {
    plantHandler();
    server.use(http.post(`${API}/ledger/plants/p1/journal`, () => HttpResponse.json(fail('UNAUTHORIZED'), { status: 401 })));
    const first = renderWithApp(screenTree, { route: '/plants/p1/log' });
    await userEvent.type(await screen.findByLabelText(/note/i), 'Mango flowers opening');
    await userEvent.click(screen.getByRole('button', { name: /save to biography/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/login'));
    first.unmount();

    render(
      <TestProviders route="/plants/p1/log" session={createTestSession()}>
        {screenTree}
      </TestProviders>,
    );
    expect(await screen.findByLabelText(/note/i)).toHaveValue('Mango flowers opening');
  });

  it('offers flower moments for a flower, and no fruit ones', async () => {
    server.use(http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord({ record_kind: 'FLOWER', name: 'Gulab', species: 'Rose' }), _count: { journal_entries: 0 } }))));
    renderWithApp(screenTree, { route: '/plants/p1/log' });
    expect(await screen.findByRole('button', { name: /^peak bloom$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^deadheading$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pinching$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^fruit set$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^harvest$/i })).not.toBeInTheDocument();
  });
});
