import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { fail, ok, pageOf, plantRecord, taskRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { ImageCompressorProvider, type ImageCompressor } from '../journal';
import { DiagnoseResultScreen, IdentifyResultScreen, ScanScreen, ScanStateProvider } from '.';

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

const compressor: ImageCompressor = {
  compress: vi.fn(() => Promise.resolve({ blob: new Blob(['j']), base64: 'QUJD', width: 10, height: 10 })),
};

const tree = (
  <ImageCompressorProvider value={compressor}>
    <ScanStateProvider>
      <Routes>
        <Route path="/scan" element={<ScanScreen />} />
        <Route path="/scan/identify" element={<IdentifyResultScreen />} />
        <Route path="/scan/diagnose" element={<DiagnoseResultScreen />} />
        <Route path="/plants/new" element={<Where />} />
      </Routes>
    </ScanStateProvider>
  </ImageCompressorProvider>
);

const diagnosis = {
  primary_issue: 'PEST', severity: 'MEDIUM', confidence: 'high', reasoning_summary: 'Mealybugs on new flush.',
  recommended_actions: ['Spray neem oil in the evening'], symptoms: ['White clusters'], follow_up_days: 3,
  secondary_issues: [], needs_follow_up: true, related_event_type: 'PEST_DIAGNOSIS',
};

function plants() {
  server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.json(pageOf([plantRecord()]))));
}

async function pickPhoto() {
  await userEvent.upload(screen.getByLabelText(/take or choose a photo/i), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }));
}

describe('scan', () => {
  it('diagnoses a chosen tree, saves it there and shows the follow-up task', async () => {
    plants();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/vision/diagnose`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(ok({ diagnosis, persisted: true, session_id: 's', outcome_id: 'o', log_ids: ['l'], task_id: 't9' }), { status: 201 });
      }),
      http.get(`${API}/ledger/plants/p1/tasks`, () =>
        HttpResponse.json(pageOf([taskRecord({ id: 't9', title: 'Spray neem oil in the evening', source: 'AI_DIAGNOSIS' })])),
      ),
    );
    renderWithApp(tree, { route: '/scan' });
    await userEvent.click(screen.getByRole('button', { name: /what's wrong/i }));
    await userEvent.selectOptions(await screen.findByLabelText(/which tree/i), 'p1');
    await userEvent.type(screen.getByLabelText(/anything to add/i), 'leaves curling');
    await pickPhoto();
    await userEvent.click(screen.getByRole('button', { name: /diagnose/i }));
    expect(await screen.findByRole('heading', { name: /pest/i })).toBeInTheDocument();
    expect(screen.getByText(/saved to aam/i)).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: /spray neem oil/i })).toBeInTheDocument();
    expect(body).toEqual({ image_base64: 'QUJD', plant_id: 'p1', note: 'leaves curling' });
  });

  it('identify offers "Add as a plant" with the name prefilled', async () => {
    plants();
    server.use(
      http.post(`${API}/vision/identify`, () =>
        HttpResponse.json(ok({ common_name: 'Mango', scientific_name: 'Mangifera indica', description: 'A fruit tree.' }), { status: 201 }),
      ),
    );
    renderWithApp(tree, { route: '/scan' });
    await userEvent.click(screen.getByRole('button', { name: /what is this/i }));
    await pickPhoto();
    await userEvent.click(screen.getByRole('button', { name: /identify/i }));
    expect(await screen.findByRole('heading', { name: 'Mango' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /add as a plant/i }));
    expect(screen.getByTestId('where')).toHaveTextContent('/plants/new?prefill=Mango');
  });

  it.each([
    ['AI_NOT_CONFIGURED', /isn't available/i],
    ['AI_PROVIDER_ERROR', /busy/i],
    ['AI_RESPONSE_INVALID', /couldn't read that photo/i],
    ['RATE_LIMITED', /too many attempts/i],
  ])('%s shows a specific message and retries with the same photo (Review Focus #3)', async (code, message) => {
    plants();
    const bodies: unknown[] = [];
    let first = true;
    server.use(
      http.post(`${API}/vision/diagnose`, async ({ request }) => {
        bodies.push(await request.json());
        if (first) {
          first = false;
          return HttpResponse.json(fail(code), { status: code === 'RATE_LIMITED' ? 429 : 502 });
        }
        return HttpResponse.json(ok({ diagnosis, persisted: true, task_id: null }), { status: 201 });
      }),
      http.get(`${API}/ledger/plants/p1/tasks`, () => HttpResponse.json(pageOf([]))),
    );
    renderWithApp(tree, { route: '/scan' });
    await userEvent.click(screen.getByRole('button', { name: /what's wrong/i }));
    await userEvent.selectOptions(await screen.findByLabelText(/which tree/i), 'p1');
    await pickPhoto();
    await userEvent.click(screen.getByRole('button', { name: /diagnose/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { name: /pest/i })).toBeInTheDocument();
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
    expect(compressor.compress).toHaveBeenCalledTimes(1);
  });

  it('a double tap on Diagnose sends one request (Review Focus #5)', async () => {
    plants();
    let calls = 0;
    server.use(
      http.post(`${API}/vision/diagnose`, async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return HttpResponse.json(ok({ diagnosis, persisted: true, task_id: null }), { status: 201 });
      }),
      http.get(`${API}/ledger/plants/p1/tasks`, () => HttpResponse.json(pageOf([]))),
    );
    renderWithApp(tree, { route: '/scan' });
    await userEvent.click(screen.getByRole('button', { name: /what's wrong/i }));
    await userEvent.selectOptions(await screen.findByLabelText(/which tree/i), 'p1');
    await pickPhoto();
    await userEvent.dblClick(screen.getByRole('button', { name: /diagnose/i }));
    await screen.findByRole('heading', { name: /pest/i });
    await waitFor(() => expect(calls).toBe(1));
  });

  it('needs a tree before diagnosing', async () => {
    plants();
    renderWithApp(tree, { route: '/scan' });
    await userEvent.click(screen.getByRole('button', { name: /what's wrong/i }));
    await pickPhoto();
    await userEvent.click(screen.getByRole('button', { name: /diagnose/i }));
    expect(screen.getByText(/choose which tree/i)).toBeInTheDocument();
  });
});
