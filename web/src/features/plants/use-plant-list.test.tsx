import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { usePlantList } from './usePlantList';

describe('usePlantList', () => {
  it('starts from page 1 again when the address changes from outside (the nav tab)', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/plants?tab=ended']}>{children}</MemoryRouter>;
    const { result } = renderHook(() => ({ list: usePlantList(), navigate: useNavigate() }), { wrapper });
    act(() => result.current.list.more());
    act(() => result.current.list.more());
    expect(result.current.list.pages).toBe(3);
    act(() => void result.current.navigate('/plants'));
    expect(result.current.list.status).toBe('active');
    expect(result.current.list.pages).toBe(1);
  });
});
