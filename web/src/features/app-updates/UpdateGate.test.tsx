import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../../test/render';
import { UpdateGate } from './UpdateGate';
import type { UpdaterPort } from './updater';

const file = { file_name: 'index.html', file_hash: 'a'.repeat(64), download_url: 'https://budtale.vercel.app/app-updates/files/' + 'a'.repeat(64) };
const control = (over: { min_native?: number; force?: boolean; version?: number } = {}) => ({
  min_native: over.min_native ?? 3,
  bundle: { version: over.version ?? 9, min_native: 3, force: over.force ?? false, files: [file] },
});

/** A phone on app version 3; `manifest` is what budtale.vercel.app serves. */
function phone(manifest: unknown) {
  let resume: () => void = () => undefined;
  const port = {
    native: true,
    appVersion: vi.fn(() => Promise.resolve(3)),
    ready: vi.fn(() => Promise.resolve()),
    fetchManifest: vi.fn(() => (manifest instanceof Error ? Promise.reject(manifest) : Promise.resolve(manifest))),
    download: vi.fn(() => Promise.resolve('bundle-9')),
    applyNow: vi.fn(() => Promise.resolve()),
    applyNext: vi.fn(() => Promise.resolve()),
    queued: vi.fn(() => Promise.resolve(0)),
    playUpdate: vi.fn(() => Promise.resolve(false)),
    openStore: vi.fn(() => Promise.resolve()),
    onResume: vi.fn((cb: () => void) => {
      resume = cb;
      return () => undefined;
    }),
  } satisfies UpdaterPort;
  return { port, resume: () => resume() };
}

const gate = (port: UpdaterPort) =>
  renderWithApp(
    <UpdateGate port={port} bundleVersion={5}>
      <p>garden</p>
    </UpdateGate>,
  );

describe('live updates', () => {
  it('on the website it never checks and just shows the app', () => {
    const { port } = phone(control());
    gate({ ...port, native: false });
    expect(screen.getByText('garden')).toBeInTheDocument();
    expect(port.fetchManifest).not.toHaveBeenCalled();
    expect(port.ready).not.toHaveBeenCalled();
  });

  it('tells the updater these screens started fine', async () => {
    const { port } = phone(control({ version: 5 }));
    gate(port);
    await waitFor(() => expect(port.ready).toHaveBeenCalledTimes(1));
  });

  it('downloads newer screens quietly and applies them next time, without interrupting', async () => {
    const { port } = phone(control());
    gate(port);
    await waitFor(() => expect(port.applyNext).toHaveBeenCalledWith('bundle-9'));
    expect(port.download).toHaveBeenCalledWith(9, [file]);
    expect(port.applyNow).not.toHaveBeenCalled();
    expect(screen.getByText('garden')).toBeInTheDocument();
    expect(screen.queryByText(/updating budtale/i)).not.toBeInTheDocument();
  });

  it('a forced update says it is updating and applies at once', async () => {
    const { port } = phone(control({ force: true }));
    let finish: (id: string) => void = () => undefined;
    port.download.mockImplementationOnce(() => new Promise((r) => (finish = r)));
    gate(port);
    expect(await screen.findByText(/updating budtale/i)).toBeInTheDocument();
    finish('bundle-9');
    await waitFor(() => expect(port.applyNow).toHaveBeenCalledWith('bundle-9'));
  });

  it('a failed forced download lets the person carry on', async () => {
    const { port } = phone(control({ force: true }));
    port.download.mockRejectedValueOnce(new Error('offline'));
    gate(port);
    await waitFor(() => expect(port.download).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText(/updating budtale/i)).not.toBeInTheDocument());
    expect(screen.getByText('garden')).toBeInTheDocument();
  });

  it('an app below the oldest allowed version asks Play to update and blocks the app', async () => {
    const { port } = phone(control({ min_native: 4 }));
    gate(port);
    expect(await screen.findByRole('heading', { name: /update budtale/i })).toBeInTheDocument();
    expect(screen.queryByText('garden')).not.toBeInTheDocument();
    expect(port.playUpdate).toHaveBeenCalledTimes(1);
    expect(port.download).not.toHaveBeenCalled();
  });

  it('the blocking screen button tries Play again, then opens the Play listing', async () => {
    const { port } = phone(control({ min_native: 4 }));
    gate(port);
    await userEvent.click(await screen.findByRole('button', { name: /^update$/i }));
    await waitFor(() => expect(port.openStore).toHaveBeenCalled());
    expect(port.playUpdate).toHaveBeenCalledTimes(2);
  });

  it('no internet or a broken file: the app carries on as it is', async () => {
    const { port } = phone(new Error('offline'));
    gate(port);
    await waitFor(() => expect(port.fetchManifest).toHaveBeenCalled());
    expect(screen.getByText('garden')).toBeInTheDocument();
    expect(port.download).not.toHaveBeenCalled();
  });

  it('checks again when the app comes back, without downloading the same screens twice', async () => {
    const { port, resume } = phone(control());
    gate(port);
    await waitFor(() => expect(port.applyNext).toHaveBeenCalledTimes(1));
    resume();
    await waitFor(() => expect(port.fetchManifest).toHaveBeenCalledTimes(2));
    expect(port.download).toHaveBeenCalledTimes(1);
  });

  it('screens already queued on an earlier launch are not downloaded again', async () => {
    const { port } = phone(control());
    port.queued.mockResolvedValue(9);
    gate(port);
    await waitFor(() => expect(port.fetchManifest).toHaveBeenCalled());
    await waitFor(() => expect(port.queued).toHaveBeenCalled());
    expect(port.download).not.toHaveBeenCalled();
  });
});
