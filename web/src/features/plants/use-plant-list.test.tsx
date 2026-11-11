import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { memoryKeyValueStore, StorageProvider } from '../../lib/storage';
import { usePlantList } from './usePlantList';

describe('usePlantList', () => {
  it('starts from page 1 again when the address changes from outside (the nav tab)', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider value={memoryKeyValueStore()}>
        <MemoryRouter initialEntries={['/plants?tab=ended']}>{children}</MemoryRouter>
      </StorageProvider>
    );
    const { result } = renderHook(() => ({ list: usePlantList(), navigate: useNavigate() }), { wrapper });
    act(() => result.current.list.more());
    act(() => result.current.list.more());
    expect(result.current.list.pages).toBe(3);
    act(() => void result.current.navigate('/plants'));
    expect(result.current.list.status).toBe('active');
    expect(result.current.list.pages).toBe(1);
  });

  it('coming back to a view you paged starts it from page 1 again', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider value={memoryKeyValueStore()}>
        <MemoryRouter initialEntries={['/plants']}>{children}</MemoryRouter>
      </StorageProvider>
    );
    const { result } = renderHook(() => usePlantList(), { wrapper });
    act(() => result.current.more());
    act(() => result.current.more());
    act(() => result.current.chooseGroup('trees'));
    act(() => result.current.chooseGroup('all'));
    expect(result.current.pages).toBe(1);
  });

  it('remembers the view for the plant page\'s back arrow', () => {
    const storage = memoryKeyValueStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider value={storage}>
        <MemoryRouter initialEntries={['/plants']}>{children}</MemoryRouter>
      </StorageProvider>
    );
    const { result } = renderHook(() => usePlantList(), { wrapper });
    act(() => result.current.chooseStatus('ended'));
    expect(storage.get('bagicha.plants.view')).toBe('?tab=ended');
  });
});
