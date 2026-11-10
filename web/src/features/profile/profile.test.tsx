import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { API, server } from '../../test/msw/server';
import { renderWithApp, testUser } from '../../test/render';
import { REGION_CLUSTERS } from '../auth';
import {
  GardenScreen,
  GeolocatorProvider,
  LanguageScreen,
  ProfileScreen,
  REGIONS,
  RegionScreen,
  type Geolocator,
} from '.';

const incomplete = testUser({ district: null, region_cluster: null, garden_types: [] });

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function Onboarding({ geo }: { geo?: Geolocator }) {
  const routes = (
    <Routes>
      <Route path="/onboarding/language" element={<LanguageScreen />} />
      <Route path="/onboarding/region" element={<RegionScreen />} />
      <Route path="/onboarding/garden" element={<GardenScreen />} />
      <Route path="/" element={<Where />} />
      <Route path="/login" element={<Where />} />
      <Route path="/profile" element={<ProfileScreen />} />
    </Routes>
  );
  return geo ? <GeolocatorProvider value={geo}>{routes}</GeolocatorProvider> : routes;
}

function captureUpdates() {
  const bodies: Record<string, unknown>[] = [];
  let user = { ...incomplete };
  server.use(
    http.put(`${API}/user/profile/update`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      user = { ...user, ...body } as typeof user;
      return HttpResponse.json({ success: true, data: user });
    }),
  );
  return bodies;
}

const denied: Geolocator = { current: () => Promise.resolve(null) };

describe('regions', () => {
  it('lists exactly the backend clusters', () => {
    expect(REGIONS.map((r) => r.id).sort()).toEqual([...REGION_CLUSTERS].sort());
  });
});

describe('onboarding', () => {
  it('walks language → region → garden, saving each step, then lands home', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/language', user: incomplete });

    await userEvent.click(screen.getByRole('button', { name: /english/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByRole('heading', { name: /locate your sanctuary/i });
    await userEvent.click(screen.getByRole('button', { name: /east india/i }));
    await userEvent.type(screen.getByLabelText(/district/i), 'Patna');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByRole('heading', { name: /what grows/i });
    await userEvent.click(screen.getByRole('button', { name: /trees/i }));
    await userEvent.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'));
    expect(bodies).toEqual([
      { language_pref: 'en' },
      { region_cluster: 'EAST_INDIA', district: 'Patna' },
      { garden_types: ['trees'] },
    ]);
  });

  it('notes that Hindi shows English for now', async () => {
    renderWithApp(<Onboarding />, { route: '/onboarding/language', user: incomplete });
    await userEvent.click(screen.getByRole('button', { name: /हिन्दी/ }));
    expect(screen.getByText(/english for now/i)).toBeInTheDocument();
  });

  it('needs a region and a district before continuing', async () => {
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    const next = screen.getByRole('button', { name: /continue/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /east india/i }));
    expect(next).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/district/i), 'Patna');
    expect(next).toBeEnabled();
  });

  it('still continues when location is denied, sending no coordinates', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    expect(await screen.findByText(/couldn't get your location/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /hills/i }));
    await userEvent.type(screen.getByLabelText(/district/i), 'Shimla');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ region_cluster: 'HILLS_COOL', district: 'Shimla' });
  });

  it('sends coordinates when location is allowed', async () => {
    const bodies = captureUpdates();
    const allowed: Geolocator = { current: () => Promise.resolve({ latitude: 25.6, longitude: 85.1 }) };
    renderWithApp(<Onboarding geo={allowed} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    await screen.findByText(/location added/i);
    await userEvent.click(screen.getByRole('button', { name: /east india/i }));
    await userEvent.type(screen.getByLabelText(/district/i), 'Patna');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ latitude: 25.6, longitude: 85.1 });
  });

  it('needs at least one garden type', async () => {
    renderWithApp(<Onboarding />, { route: '/onboarding/garden', user: incomplete });
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled();
  });
});

describe('profile', () => {
  it('shows the profile and signs out', async () => {
    const { session } = renderWithApp(<Onboarding />, { route: '/profile' });
    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByText(/east india/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/login'));
    expect(session.get().user).toBeNull();
  });
});
