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
});
