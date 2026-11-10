// @vitest-environment node
// Node env: jsdom's FormData can't be sent by Node's fetch, so the upload path is tested here.
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createApiClient } from '../../lib/api-client';
import { ok } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { memoryTokenStore } from '../../test/render';
import { toUploadForm, uploadSchema } from './media-api';

describe('image upload', () => {
  it('posts multipart with kind and a JPEG file', async () => {
    let kind: FormDataEntryValue | null = null;
    let file: FormDataEntryValue | null = null;
    server.use(
      http.post(`${API}/media/images`, async ({ request }) => {
        const form = await request.formData();
        kind = form.get('kind');
        file = form.get('file');
        return HttpResponse.json(
          ok({ key: 'journal/u1/k.jpg', url: 'http://x', bucket: 'b', width: 1, height: 1, bytes: 1, content_type: 'image/jpeg', is_public: false }),
          { status: 201 },
        );
      }),
    );
    const api = createApiClient({ baseUrl: API, tokens: memoryTokenStore(), onUnauthorized: () => {} });
    const res = await api.upload('/media/images', toUploadForm('journal', new Blob(['x'], { type: 'image/jpeg' })), uploadSchema);
    expect(res.key).toBe('journal/u1/k.jpg');
    expect(kind).toBe('journal');
    expect((file as unknown as File).type).toBe('image/jpeg');
  });
});
