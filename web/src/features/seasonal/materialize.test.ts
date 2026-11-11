import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../../lib/api-client';
import { API, server } from '../../test/msw/server';
import { memoryTokenStore } from '../../test/render';
import { materializeTasks } from '.';

const api = createApiClient({ baseUrl: API, tokens: memoryTokenStore(), onUnauthorized: vi.fn() });

describe('materializeTasks: the one call that asks for a plant\'s seasonal tasks', () => {
  it('posts to the plant and returns the validated result', async () => {
    let hit = '';
    server.use(
      http.post(`${API}/seasonal/plant/:id/materialize-tasks`, ({ params }) => {
        hit = String(params.id);
        return HttpResponse.json({ success: true, data: { results: [], created_count: 2 } }, { status: 201 });
      }),
    );
    await expect(materializeTasks(api, 'p9')).resolves.toEqual({ results: [], created_count: 2 });
    expect(hit).toBe('p9');
  });

  it('rejects a response that breaks the contract', async () => {
    server.use(
      http.post(`${API}/seasonal/plant/:id/materialize-tasks`, () =>
        HttpResponse.json({ success: true, data: { nope: true } }, { status: 201 }),
      ),
    );
    await expect(materializeTasks(api, 'p9')).rejects.toMatchObject({ code: 'CONTRACT_MISMATCH' });
  });
});
