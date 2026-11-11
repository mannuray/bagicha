import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createTestSession, TestProviders } from '../../test/render';
import { ScanStateProvider, useScanState, type PreviewUrls } from './scan-state';

describe('scan photo previews', () => {
  it('releases the old preview when a new scan replaces it, and on clearing', () => {
    let n = 0;
    const previews: PreviewUrls = { create: vi.fn(() => `blob:${++n}`), revoke: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders session={createTestSession()}>
        <ScanStateProvider previews={previews}>{children}</ScanStateProvider>
      </TestProviders>
    );
    const { result } = renderHook(() => useScanState(), { wrapper });
    const scanWith = (url: string | null) => ({ mode: 'identify' as const, base64: 'x', previewUrl: url });

    act(() => result.current.setScan(scanWith(result.current.previewOf(new Blob(['a'])))));
    expect(result.current.scan?.previewUrl).toBe('blob:1');
    act(() => result.current.setScan(scanWith(result.current.previewOf(new Blob(['b'])))));
    expect(previews.revoke).toHaveBeenCalledWith('blob:1');
    act(() => result.current.setScan(null));
    expect(previews.revoke).toHaveBeenCalledWith('blob:2');
  });

  it('releases the preview when the scan screen state goes away (sign-out, closing the app)', () => {
    const previews: PreviewUrls = { create: vi.fn(() => 'blob:9'), revoke: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders session={createTestSession()}>
        <ScanStateProvider previews={previews}>{children}</ScanStateProvider>
      </TestProviders>
    );
    const { result, unmount } = renderHook(() => useScanState(), { wrapper });
    act(() => result.current.setScan({ mode: 'identify', base64: 'x', previewUrl: result.current.previewOf(new Blob(['a'])) }));
    unmount();
    expect(previews.revoke).toHaveBeenCalledWith('blob:9');
  });

  it('signing back in as the same user does not bring back a scan whose photo was released', () => {
    const previews: PreviewUrls = { create: vi.fn(() => 'blob:7'), revoke: vi.fn() };
    const session = createTestSession();
    const user = session.get().user!;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders session={session}>
        <ScanStateProvider previews={previews}>{children}</ScanStateProvider>
      </TestProviders>
    );
    const { result } = renderHook(() => useScanState(), { wrapper });
    act(() => result.current.setScan({ mode: 'identify', base64: 'x', previewUrl: result.current.previewOf(new Blob(['a'])) }));
    act(() => session.expire());
    expect(previews.revoke).toHaveBeenCalledWith('blob:7');
    act(() => session.signIn('t2', user));
    expect(result.current.scan).toBeNull();
  });
});
