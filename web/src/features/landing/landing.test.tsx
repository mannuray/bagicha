import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { RequireAuth } from '../auth';
import { PrivacyPage, TermsPage } from '../legal';
import { WebHome } from './WebHome';

function renderHome(opts: { native?: boolean; signedIn?: boolean } = {}) {
  return renderWithApp(
    <Routes>
      <Route path="/" element={<WebHome app={<RequireAuth><p>Dashboard</p></RequireAuth>} native={opts.native ?? false} />} />
      <Route path="/login" element={<p>Login screen</p>} />
    </Routes>,
    { route: '/', user: opts.signedIn ? undefined : null },
  );
}

describe('the home address', () => {
  it('shows the landing page to a visitor on the website', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { level: 1, name: /Every plant has a story/ })).toBeInTheDocument();
    const open = screen.getAllByRole('link', { name: /Open the app/ });
    expect(open.length).toBeGreaterThan(0);
    open.forEach((a) => expect(a).toHaveAttribute('href', '/login'));
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('links to the privacy policy, terms and account deletion', async () => {
    renderHome();
    expect(await screen.findByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of use' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Delete your account' })).toHaveAttribute('href', '/delete-account');
  });

  it('shows the garden to a signed-in gardener', async () => {
    renderHome({ signedIn: true });
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Every plant has a story/ })).not.toBeInTheDocument();
  });

  it('goes straight to sign-in in the phone app', async () => {
    renderHome({ native: true });
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });
});

describe('legal pages', () => {
  it('shows the privacy policy, including how reminders reach the phone', async () => {
    renderWithApp(<PrivacyPage />, { route: '/privacy', user: null });
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument();
    expect(screen.getAllByText(/Firebase Cloud Messaging/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'budtale.vercel.app/delete-account' })).toHaveAttribute('href', '/delete-account');
  });

  it('shows the terms of use', async () => {
    renderWithApp(<TermsPage />, { route: '/terms', user: null });
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3. Advice is guidance, not a guarantee' })).toBeInTheDocument();
  });
});
