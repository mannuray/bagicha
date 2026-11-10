import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/errors';
import { ErrorState, QueryState } from './StateViews';

const query = (over: object) => ({
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
  refetch: vi.fn(),
  ...over,
});

describe('ErrorState', () => {
  it('explains the error and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError(0, 'NETWORK_ERROR', 'x')} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('QueryState', () => {
  it('shows a loading state while pending', () => {
    render(<QueryState query={query({ isPending: true })}>{() => <p>done</p>}</QueryState>);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  it('shows the error with retry, never an empty list', async () => {
    const q = query({ isError: true, error: new ApiError(500, 'X', 'x') });
    render(
      <QueryState query={q} empty={() => true} emptyView={<p>nothing</p>}>
        {() => <p>done</p>}
      </QueryState>,
    );
    expect(screen.queryByText('nothing')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(q.refetch).toHaveBeenCalled();
  });

  it('shows the empty view when the data is empty', () => {
    render(
      <QueryState query={query({ data: [] })} empty={(d: unknown[]) => d.length === 0} emptyView={<p>nothing</p>}>
        {() => <p>done</p>}
      </QueryState>,
    );
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  it('renders children with the data on success', () => {
    render(
      <QueryState query={query({ data: ['a'] })}>{(d: string[]) => <p>{d.join()}</p>}</QueryState>,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
  });
});
