import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '../lib/i18n';
import { ServerWakeBanner } from './server-wake';
import { createServerWake } from './server-wake-store';

describe('server wake banner', () => {
  it('stays hidden until a request is slow, then explains, then goes away', () => {
    const wake = createServerWake();
    render(<ServerWakeBanner wake={wake} />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() => wake.set(true));
    expect(screen.getByRole('status')).toHaveTextContent(/waking up/i);

    act(() => wake.set(false));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
