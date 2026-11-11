import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../lib/i18n';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('shows a recoverable screen and reports through the reporter it is given', () => {
    const report = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary report={report}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ componentStack: expect.anything() }));
  });
});
