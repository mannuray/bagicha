import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { API, server } from '../../test/msw/server';
import { renderWithApp, testUser } from '../../test/render';
import { homeFor, RequireAuth } from '../auth';
import { DeleteAccountInfoPage, DeleteAccountScreen, DeletionPendingScreen } from '.';

const DUE = '2026-12-26T10:00:00.000Z';
const pendingUser = testUser({ deletion_due_at: DUE });

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function Account() {
  return (
    <Routes>
      <Route path="/account/delete" element={<DeleteAccountScreen />} />
      <Route
        path="/account/deletion-pending"
        element={
          <RequireAuth allowPending>
            <DeletionPendingScreen />
          </RequireAuth>
        }
      />
      <Route path="/delete-account" element={<DeleteAccountInfoPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Where />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<Where />} />
    </Routes>
  );
}

describe('asking to delete the account', () => {
  it('keeps the button off until DELETE is typed', async () => {
    renderWithApp(<Account />, { route: '/account/delete' });
    const confirm = screen.getByRole('button', { name: /delete my account/i });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/type delete/i), 'delete');
    expect(confirm).toBeDisabled();
    await userEvent.clear(screen.getByLabelText(/type delete/i));
    await userEvent.type(screen.getByLabelText(/type delete/i), 'DELETE');
    expect(confirm).toBeEnabled();
  });

  it('says what goes, when, and that premium is not refunded', () => {
    renderWithApp(<Account />, { route: '/account/delete', now: new Date('2026-11-26T10:00:00Z') });
    expect(screen.getByText(/26 Dec 2026/)).toBeInTheDocument();
    expect(screen.getByText(/plants/i)).toBeInTheDocument();
    expect(screen.getByText(/not refunded/i)).toBeInTheDocument();
  });

  it('confirming asks the server, signs out here and shows the date', async () => {
    let asked = false;
    server.use(
      http.post(`${API}/user/deletion`, () => {
        asked = true;
        return HttpResponse.json({ success: true, data: pendingUser });
      }),
    );
    const { session } = renderWithApp(<Account />, { route: '/account/delete' });
    await userEvent.type(screen.getByLabelText(/type delete/i), 'DELETE');
    await userEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    await waitFor(() => expect(session.get().user).toBeNull());
    expect(asked).toBe(true);
    expect(await screen.findByText(/will be deleted on 26 Dec 2026/i)).toBeInTheDocument();
  });
});

describe('signing in while deletion is pending', () => {
  it('sends a pending account to the keep-or-continue screen, from home and everywhere', () => {
    expect(homeFor(pendingUser)).toBe('/account/deletion-pending');
    renderWithApp(<Account />, { route: '/', user: pendingUser });
    expect(screen.getByRole('button', { name: /keep my account/i })).toBeInTheDocument();
  });

  it('keeping the account cancels the deletion and opens the app', async () => {
    let cancelled = false;
    server.use(
      http.delete(`${API}/user/deletion`, () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { session } = renderWithApp(<Account />, { route: '/account/deletion-pending', user: pendingUser });
    expect(screen.getByText(/26 Dec 2026/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /keep my account/i }));
    expect(await screen.findByTestId('where')).toHaveTextContent('/');
    expect(cancelled).toBe(true);
    expect(session.get().user?.deletion_due_at).toBeNull();
  });

  it('continuing signs out and leaves the deletion in place', async () => {
    let signedOut = false;
    server.use(
      http.post(`${API}/auth/sign-out`, () => {
        signedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { session } = renderWithApp(<Account />, { route: '/account/deletion-pending', user: pendingUser });
    await userEvent.click(screen.getByRole('button', { name: /continue with deletion/i }));
    await waitFor(() => expect(session.get().user).toBeNull());
    await waitFor(() => expect(signedOut).toBe(true));
  });
});

describe('the public deletion page', () => {
  it('explains how to delete without signing in', () => {
    renderWithApp(<Account />, { route: '/delete-account', user: null });
    expect(screen.getByRole('heading', { name: /delete your bagicha account/i })).toBeInTheDocument();
    expect(screen.getAllByText(/profile/i).length).toBeGreaterThan(0);
  });
});
