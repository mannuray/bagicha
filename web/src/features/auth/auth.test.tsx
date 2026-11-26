import { useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { API, server } from '../../test/msw/server';
import { renderWithApp, testUser } from '../../test/render';
import { vi } from 'vitest';
import { LoginScreen, RequireAuth, RequireOnboarded, SplashScreen } from '.';
import { GooglePortProvider, type GooglePort } from './google';

const ok = (data: unknown) => HttpResponse.json({ success: true, data });
const fail = (status: number, code: string) =>
  HttpResponse.json({ success: false, error: { code, message: code } }, { status });

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
}

function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/onboarding/language" element={<Where />} />
      <Route path="/onboarding/region" element={<Where />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <Where />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

/** A phone: the account sheet returns this token, or 'cancelled'. */
function nativeGoogle(result: string): GooglePort & { signIn: ReturnType<typeof vi.fn> } {
  return { native: true, signIn: vi.fn(() => Promise.resolve(result)), renderButton: vi.fn(() => Promise.resolve()) };
}

/** The website: Google's button is drawn, and a click on it delivers this token at once. */
function webGoogle(token: string): GooglePort & { renderButton: ReturnType<typeof vi.fn> } {
  return {
    native: false,
    signIn: vi.fn(() => Promise.resolve('cancelled')),
    renderButton: vi.fn((_el: HTMLElement, onToken: (t: string) => void) => {
      onToken(token);
      return Promise.resolve();
    }),
  };
}

function renderLogin(port: GooglePort) {
  return renderWithApp(
    <GooglePortProvider value={port}>
      <AuthRoutes />
    </GooglePortProvider>,
    { route: '/login', user: null },
  );
}

describe('login', () => {
  it('shows the Budtale logo, the same mark as the browser icon', () => {
    renderWithApp(<LoginScreen />, { route: '/login', user: null });
    expect(screen.getByRole('img', { name: /budtale logo/i })).toBeInTheDocument();
  });

  it('shows the Stitch mango-leaf photo behind the login header', () => {
    const { container } = renderWithApp(<LoginScreen />, { route: '/login', user: null });
    expect(container.querySelector('header img[src*="login-leaf"]')).not.toBeNull();
  });

  it('signs in with Google in the app and goes home when the profile is complete', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/auth/google`, async ({ request }) => {
        body = await request.json();
        return ok({ access_token: 'jwt', user: testUser() });
      }),
    );
    const { session } = renderLogin(nativeGoogle('tok'));
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'));
    expect(body).toEqual({ id_token: 'tok' });
    expect(session.tokens.get()).toBe('jwt');
  });

  it('sends a new gardener to onboarding', async () => {
    server.use(
      http.post(`${API}/auth/google`, () =>
        ok({ access_token: 'jwt', user: testUser({ district: null, region_cluster: null, garden_types: [] }) }),
      ),
    );
    renderLogin(nativeGoogle('tok'));
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/onboarding/language'));
  });

  it('a cancelled account picker shows no error and the button works again', async () => {
    const port = nativeGoogle('cancelled');
    renderLogin(port);
    const button = screen.getByRole('button', { name: /continue with google/i });
    await userEvent.click(button);
    await waitFor(() => expect(port.signIn).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(port.signIn).toHaveBeenCalledTimes(2);
  });

  it('a phone that cannot reach Google sign-in says so', async () => {
    const port = nativeGoogle('tok');
    port.signIn.mockRejectedValueOnce(new Error('Developer console is not set up correctly'));
    renderLogin(port);
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/isn.t available/i);
  });

  it('a refused sign-in shows the failure line', async () => {
    server.use(http.post(`${API}/auth/google`, () => fail(401, 'AUTH_GOOGLE_INVALID')));
    renderLogin(nativeGoogle('tok'));
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/google sign-in didn't work/i);
  });

  it("on the website, Google's own button signs in", async () => {
    server.use(http.post(`${API}/auth/google`, () => ok({ access_token: 'jwt', user: testUser() })));
    const port = webGoogle('web-tok');
    renderLogin(port);
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'));
    expect(port.renderButton).toHaveBeenCalled();
  });

  it('links to the privacy policy and terms on budtale.vercel.app', () => {
    renderLogin(nativeGoogle('tok'));
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', 'https://budtale.vercel.app/privacy');
    expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', 'https://budtale.vercel.app/terms');
  });
});

describe('guards', () => {
  it('routes an onboarded user who only lacks a region to the region step', async () => {
    renderWithApp(
      <Routes>
        <Route path="/onboarding/region" element={<Where />} />
        <Route path="/" element={<RequireOnboarded><p>home</p></RequireOnboarded>} />
      </Routes>,
      { user: testUser({ region_cluster: null }) },
    );
    expect(await screen.findByTestId('where')).toHaveTextContent('/onboarding/region');
  });

  it('sends signed-out users to login', async () => {
    renderWithApp(
      <Routes>
        <Route path="/login" element={<Where />} />
        <Route path="/" element={<RequireAuth><p>secret</p></RequireAuth>} />
      </Routes>,
      { user: null },
    );
    expect(await screen.findByTestId('where')).toHaveTextContent('/login');
  });

  it('a 401 from any request returns to login with "sign in again" (Review Focus #1)', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => fail(401, 'UNAUTHORIZED')));
    function Probe() {
      const api = useApi();
      useQuery({ queryKey: ['p'], queryFn: () => api.get('/ledger/plants', z.unknown()) });
      return <p>home</p>;
    }
    renderWithApp(
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<RequireAuth><Probe /></RequireAuth>} />
      </Routes>,
    );
    expect(await screen.findByText(/please sign in again/i)).toBeInTheDocument();
  });
});

describe('splash', () => {
  it('shows the name, the tagline and what Budtale grows, with the real logo', () => {
    renderWithApp(<SplashScreen />, { route: '/splash', user: null });
    expect(screen.getByRole('heading', { name: 'Budtale' })).toBeInTheDocument();
    expect(screen.getByText("Your orchard's memory")).toBeInTheDocument();
    expect(screen.getByText('Fruit · Vegetables · Flowers')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Budtale logo' })).toBeInTheDocument();
  });

  it('sends a returning user who only lacks a region straight to the region step', async () => {
    renderWithApp(
      <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/onboarding/language" element={<Where />} />
        <Route path="/onboarding/region" element={<Where />} />
      </Routes>,
      { route: '/splash', user: testUser({ region_cluster: null }) },
    );
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/onboarding/region'), { timeout: 3000 });
  });
});
