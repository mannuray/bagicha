import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { PushPortProvider, type PushPermission, type PushPort } from './push';
import { PushRegistration } from './usePushRegistration';

/** A fake phone: records calls, and lets a test fire a token or a tap. */
function fakePort({ permission = 'granted', ...over }: Partial<Omit<PushPort, 'permission'>> & { permission?: PushPermission } = {}) {
  let tokenCb: ((t: string) => void) | undefined;
  let tapCb: ((route: string) => void) | undefined;
  const port: PushPort = {
    native: true,
    permission: vi.fn(() => Promise.resolve(permission)),
    request: vi.fn(() => Promise.resolve('granted' as const)),
    register: vi.fn(() => Promise.resolve()),
    ensureChannel: vi.fn(() => Promise.resolve()),
    onToken: (cb) => {
      tokenCb = cb;
    },
    onTap: (cb) => {
      tapCb = cb;
    },
    ...over,
  };
  return { port, emitToken: (t: string) => tokenCb?.(t), tap: (r: string) => tapCb?.(r) };
}

function renderRegistration(port: PushPort, route = '/') {
  return renderWithApp(
    <PushPortProvider value={port}>
      <PushRegistration />
      <Routes>
        <Route path="/" element={<p>Home</p>} />
        <Route path="/tasks" element={<p>Tasks screen</p>} />
        <Route path="/plants" element={<p>Plants screen</p>} />
      </Routes>
    </PushPortProvider>,
    { route },
  );
}

describe('push registration', () => {
  it('registers the phone with the server when permission is already granted', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.put(`${API}/user/devices`, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { port, emitToken } = fakePort();
    renderRegistration(port);
    await waitFor(() => expect(port.register).toHaveBeenCalled());
    expect(port.ensureChannel).toHaveBeenCalled();
    emitToken('tok-1');
    await waitFor(() => expect(bodies).toEqual([{ token: 'tok-1', platform: 'ANDROID' }]));
  });

  it('never asks for permission by itself', async () => {
    const { port } = fakePort({ permission: 'prompt' });
    renderRegistration(port);
    await waitFor(() => expect(port.permission).toHaveBeenCalled());
    expect(port.request).not.toHaveBeenCalled();
    expect(port.register).not.toHaveBeenCalled();
  });

  it('does nothing on the website', async () => {
    const { port } = fakePort({ native: false });
    renderRegistration(port);
    await screen.findByText('Home');
    expect(port.permission).not.toHaveBeenCalled();
    expect(port.ensureChannel).not.toHaveBeenCalled();
  });

  it('opens the tasks screen when a reminder is tapped', async () => {
    const { port, tap } = fakePort({ permission: 'denied' });
    renderRegistration(port);
    await screen.findByText('Home');
    tap('/tasks');
    expect(await screen.findByText('Tasks screen')).toBeInTheDocument();
  });

  it('ignores any other route a push might carry', async () => {
    const { port, tap } = fakePort({ permission: 'denied' });
    renderRegistration(port);
    await screen.findByText('Home');
    tap('/plants');
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
