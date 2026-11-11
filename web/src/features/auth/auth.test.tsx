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
import { LoginScreen, OtpScreen, RequireAuth, RequireOnboarded } from '.';

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
      <Route path="/login/otp" element={<OtpScreen />} />
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

describe('login', () => {
  it('shows the Bagicha logo, the same mark as the browser icon', () => {
    renderWithApp(<LoginScreen />, { route: '/login', user: null });
    expect(screen.getByRole('img', { name: /bagicha logo/i })).toBeInTheDocument();
  });

  it('shows the Stitch mango-leaf photo behind the login header', () => {
    const { container } = renderWithApp(<LoginScreen />, { route: '/login', user: null });
    expect(container.querySelector('header img[src*="login-leaf"]')).not.toBeNull();
  });

  it('sends +91 and the 10 digits, then asks for the code', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/auth/request-otp`, async ({ request }) => {
        body = await request.json();
        return ok({ message: 'OTP sent successfully' });
      }),
    );
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(await screen.findByRole('heading', { name: /enter the code/i })).toBeInTheDocument();
    expect(body).toEqual({ phone_number: '+919876543210' });
  });

  it('shows the code on the verification page when the test backend sends it', async () => {
    server.use(http.post(`${API}/auth/request-otp`, () => ok({ message: 'OTP sent successfully', dev_otp: '482913' })));
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(await screen.findByText(/test code/i)).toHaveTextContent('482913');
  });

  it('shows the new code after a resend', async () => {
    let n = 0;
    server.use(
      http.post(`${API}/auth/request-otp`, () => {
        n += 1;
        return ok({ message: 'OTP sent successfully', dev_otp: n === 1 ? '111111' : '222222' });
      }),
    );
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(await screen.findByText(/test code/i)).toHaveTextContent('111111');
    await userEvent.click(screen.getByRole('button', { name: /resend code/i }));
    await waitFor(() => expect(screen.getByText(/test code/i)).toHaveTextContent('222222'));
  });

  it('shows each typed digit in its own box', async () => {
    renderWithApp(<OtpScreen />, { route: { pathname: '/login/otp', state: { phone: '+919876543210' } } });
    await userEvent.type(screen.getByLabelText(/verification code/i), '48');
    const boxes = screen.getAllByTestId('otp-box');
    expect(boxes).toHaveLength(6);
    expect(boxes.map((b) => b.textContent)).toEqual(['4', '8', '', '', '', '']);
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
  });

  it('shows the Stitch garden photo above the code', async () => {
    const { container } = renderWithApp(<OtpScreen />, { route: { pathname: '/login/otp', state: { phone: '+919876543210' } } });
    expect(container.querySelector('img[src*="otp-olive"]')).not.toBeNull();
  });

  it('shows no test code when the backend does not send one', async () => {
    server.use(http.post(`${API}/auth/request-otp`, () => ok({ message: 'OTP sent successfully' })));
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    await screen.findByRole('heading', { name: /enter the code/i });
    expect(screen.queryByText(/test code/i)).not.toBeInTheDocument();
  });

  it('rejects a short number without calling the server', async () => {
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '98765');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(screen.getByText(/10-digit/i)).toBeInTheDocument();
  });

  it('explains rate limiting', async () => {
    server.use(http.post(`${API}/auth/request-otp`, () => fail(429, 'RATE_LIMITED')));
    renderWithApp(<AuthRoutes />, { route: '/login', user: null });
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
  });
});

describe('otp', () => {
  const otpRoute = { pathname: '/login/otp', state: { phone: '+919876543210' } };

  it('signs in and goes home when the profile is complete', async () => {
    server.use(
      http.post(`${API}/auth/verify-otp`, () => ok({ access_token: 'jwt', user: testUser() })),
    );
    const { session } = renderWithApp(<AuthRoutes />, { route: otpRoute, user: null });
    await userEvent.type(screen.getByLabelText(/verification code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'));
    expect(session.tokens.get()).toBe('jwt');
  });

  it('sends new users to onboarding', async () => {
    server.use(
      http.post(`${API}/auth/verify-otp`, () =>
        ok({ access_token: 'jwt', user: testUser({ district: null, region_cluster: null, garden_types: [] }) }),
      ),
    );
    renderWithApp(<AuthRoutes />, { route: otpRoute, user: null });
    await userEvent.type(screen.getByLabelText(/verification code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/onboarding/language'));
  });

  it('sends a returning user who only lacks a region straight to the region step', async () => {
    server.use(
      http.post(`${API}/auth/verify-otp`, () => ok({ access_token: 'jwt', user: testUser({ region_cluster: null }) })),
    );
    renderWithApp(<AuthRoutes />, { route: otpRoute, user: null });
    await userEvent.type(screen.getByLabelText(/verification code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/onboarding/region'));
  });

  it('shows a wrong code and offers a new one', async () => {
    server.use(http.post(`${API}/auth/verify-otp`, () => fail(401, 'AUTH_INVALID_OTP')));
    renderWithApp(<AuthRoutes />, { route: otpRoute, user: null });
    await userEvent.type(screen.getByLabelText(/verification code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/didn't work/i);
    expect(screen.getByRole('button', { name: /new code/i })).toBeInTheDocument();
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
