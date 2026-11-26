import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { API, server } from '../../test/msw/server';
import { renderWithApp, testUser } from '../../test/render';
import { memoryKeyValueStore } from '../../lib/storage';
import { PushPortProvider, type PushPermission, type PushPort } from './push';
import { RemindersCard } from './RemindersCard';
import { RemindersSection } from '../profile/RemindersSection';
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

describe('reminders card on the home screen', () => {
  const renderCard = (port: PushPort, storage = memoryKeyValueStore()) =>
    renderWithApp(
      <PushPortProvider value={port}>
        <RemindersCard />
      </PushPortProvider>,
      { storage },
    );

  it('asks for permission, then goes away once granted', async () => {
    const { port } = fakePort({ permission: 'prompt' });
    renderCard(port);
    await userEvent.click(await screen.findByRole('button', { name: 'Turn on' }));
    expect(port.request).toHaveBeenCalled();
    expect(port.register).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Garden reminders')).not.toBeInTheDocument());
  });

  it('"Not now" hides it for good', async () => {
    const storage = memoryKeyValueStore();
    const { port } = fakePort({ permission: 'prompt' });
    const first = renderCard(port, storage);
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Garden reminders')).not.toBeInTheDocument();
    first.unmount();
    renderCard(port, storage);
    await waitFor(() => expect(port.permission).toHaveBeenCalled());
    expect(screen.queryByText('Garden reminders')).not.toBeInTheDocument();
  });

  it('is not shown once permission was given or refused', async () => {
    const { port } = fakePort({ permission: 'granted' });
    renderCard(port);
    await waitFor(() => expect(port.permission).toHaveBeenCalled());
    expect(screen.queryByText('Garden reminders')).not.toBeInTheDocument();
  });

  it('is not shown on the website', async () => {
    const { port } = fakePort({ native: false, permission: 'prompt' });
    renderCard(port);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Garden reminders')).not.toBeInTheDocument();
  });
});

describe('reminders in the profile', () => {
  function renderSection(port: PushPort, user = testUser()) {
    const patches: unknown[] = [];
    server.use(
      http.patch(`${API}/user/profile`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        patches.push(body);
        return HttpResponse.json({ success: true, data: { ...user, ...body } });
      }),
    );
    renderWithApp(
      <PushPortProvider value={port}>
        <RemindersSection />
      </PushPortProvider>,
      { user },
    );
    return patches;
  }

  it('saves a new morning time', async () => {
    const patches = renderSection(fakePort().port);
    await userEvent.selectOptions(await screen.findByLabelText('Morning'), '7:30 am');
    await waitFor(() => expect(patches).toEqual([{ reminder_morning_min: 450 }]));
  });

  it('turns the evening off', async () => {
    const patches = renderSection(fakePort().port);
    await userEvent.selectOptions(await screen.findByLabelText('Evening'), 'Off');
    await waitFor(() => expect(patches).toEqual([{ reminder_evening_min: null }]));
  });

  it('shows the saved times, and Off for a slot that is off', async () => {
    renderSection(fakePort().port, testUser({ reminder_morning_min: 375, reminder_evening_min: null }));
    expect(await screen.findByLabelText('Morning')).toHaveDisplayValue('6:15 am');
    expect(screen.getByLabelText('Evening')).toHaveDisplayValue('Off');
  });

  it('offers evening times from 3:00 pm to 9:45 pm only', async () => {
    renderSection(fakePort().port);
    const options = [...(await screen.findByLabelText('Evening')).querySelectorAll('option')].map((o) => o.textContent);
    expect(options[0]).toBe('Off');
    expect(options[1]).toBe('3:00 pm');
    expect(options.at(-1)).toBe('9:45 pm');
    expect(options).toHaveLength(1 + 28);
  });

  it('explains how to turn notifications back on when the phone blocks them', async () => {
    renderSection(fakePort({ permission: 'denied' }).port);
    expect(await screen.findByText('Notifications are off for Budtale on this phone.')).toBeInTheDocument();
  });

  it('is not shown on the website', async () => {
    renderSection(fakePort({ native: false }).port);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Reminders')).not.toBeInTheDocument();
  });
});
