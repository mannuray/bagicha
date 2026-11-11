import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClockProvider, useNow } from './clock';

function ShowNow() {
  return <p>{useNow().toISOString()}</p>;
}

describe('the app clock', () => {
  it('pages read "now" from the provided clock', () => {
    render(
      <ClockProvider value={{ now: () => new Date('2030-01-02T03:04:05Z') }}>
        <ShowNow />
      </ClockProvider>,
    );
    expect(screen.getByText('2030-01-02T03:04:05.000Z')).toBeInTheDocument();
  });

  it('defaults to the real clock', () => {
    const before = Date.now();
    render(<ShowNow />);
    const shown = Date.parse(screen.getByText(/^\d{4}-/).textContent ?? '');
    expect(shown).toBeGreaterThanOrEqual(before);
  });
});
