import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ok } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { createTestSession, TestProviders } from '../../test/render';
import { useUploadImage } from './media-api';

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestProviders session={createTestSession()}>{children}</TestProviders>
);

describe('upload from a component test', () => {
  it('reaches the server as multipart with the kind', async () => {
    let body = '';
    server.use(
      http.post(`${API}/media/images`, async ({ request }) => {
        // undici's multipart parser breaks under jsdom's File global; read raw text.
        body = await request.text();
        return HttpResponse.json(ok({ key: 'journal/u1/k.jpg', url: 'u', width: 1, height: 1, is_public: false }), { status: 201 });
      }),
    );
    const { result } = renderHook(() => useUploadImage('journal'), { wrapper });
    await expect(result.current.mutateAsync(new Blob(['x'], { type: 'image/jpeg' }))).resolves.toMatchObject({
      key: 'journal/u1/k.jpg',
    });
    expect(body).toMatch(/name="kind"\r\n\r\njournal/);
    expect(body).toMatch(/name="file"; filename="photo.jpg"\r\nContent-Type: image\/jpeg/);
  });
});
