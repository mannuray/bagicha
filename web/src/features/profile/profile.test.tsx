import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { API, server, TEST_DISTRICTS } from '../../test/msw/server';
import { renderWithApp, testUser } from '../../test/render';
import { REGION_CLUSTERS } from '../auth';
import { ImageCompressorProvider, type ImageCompressor } from '../journal';
import {
  GardenScreen,
  GeolocatorProvider,
  LanguageScreen,
  ProfileScreen,
  REGIONS,
  knownRegion,
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

  it('knows a district’s region from the list, by name, alias or "Name, State", and nothing else', () => {
    const list = TEST_DISTRICTS as never;
    expect(knownRegion('Patna', list)).toBe('EAST_INDIA');
    expect(knownRegion('  patna district ', list)).toBe('EAST_INDIA');
    expect(knownRegion('Gurgaon', list)).toBe('NORTH_INDIA');
    expect(knownRegion('Aurangabad, Bihar', list)).toBe('EAST_INDIA');
    expect(knownRegion('Aurangabad', list)).toBeNull();
    expect(knownRegion('My village', list)).toBeNull();
    expect(knownRegion('', list)).toBeNull();
    // Delhi's direction districts only count with their state.
    expect(knownRegion('North East', list)).toBeNull();
    expect(knownRegion('North East, Delhi', list)).toBe('NORTH_INDIA');
  });
});

describe('onboarding', () => {
  it('walks language → region → garden, saving each step, then lands home', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/language', user: incomplete });

    await userEvent.click(screen.getByRole('button', { name: /english/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByRole('heading', { name: /locate your sanctuary/i });
    await userEvent.type(screen.getByLabelText(/district/i), 'Patna');
    expect(screen.getByText(/east india/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByRole('heading', { name: /green blueprint/i });
    await userEvent.click(screen.getByRole('button', { name: /trees/i }));
    await userEvent.click(screen.getByRole('button', { name: /start gardening/i }));

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

  it('a returning user who only lacked a region goes home after choosing it', async () => {
    server.use(
      http.put(`${API}/user/profile/update`, async ({ request }) =>
        HttpResponse.json({ success: true, data: { ...testUser({ region_cluster: null }), ...((await request.json()) as object) } }),
      ),
    );
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: testUser({ region_cluster: null }) });
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/));
  });

  it('a known district picks its region by itself: no region cards to tap', async () => {
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    const next = screen.getByRole('button', { name: /continue/i });
    expect(next).toBeDisabled();
    expect(screen.queryByRole('button', { name: /coastal/i })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/district/i), 'Patna');
    expect(screen.queryByRole('button', { name: /coastal/i })).not.toBeInTheDocument();
    expect(screen.getByText(/east india/i)).toBeInTheDocument();
    expect(next).toBeEnabled();
  });

  it('an unknown district shows the region cards and needs a pick', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.type(screen.getByLabelText(/district/i), 'My village');
    const next = screen.getByRole('button', { name: /continue/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /east india/i }));
    await userEvent.click(next);
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ region_cluster: 'EAST_INDIA', district: 'My village' });
  });

  it('still continues when location is denied, sending no coordinates', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    expect(await screen.findByText(/couldn't get your location/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/district/i), 'Shimla');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ region_cluster: 'HILLS_COOL', district: 'Shimla' });
  });

  it('detects the district from the location, posting the rounded point (never in the URL)', async () => {
    const bodies = captureUpdates();
    let sent: { url: string; body: unknown } | null = null;
    server.use(
      http.post(`${API}/regions/locate`, async ({ request }) => {
        sent = { url: request.url, body: await request.json() };
        return HttpResponse.json({ success: true, data: { district: 'Gaya', state: 'Bihar', region: 'EAST_INDIA', label: 'Gaya' } });
      }),
    );
    const allowed: Geolocator = { current: () => Promise.resolve({ latitude: 24.791234, longitude: 85.004567 }) };
    renderWithApp(<Onboarding geo={allowed} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    expect(await screen.findByText(/detected gaya, bihar · east india/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/district/i)).toHaveValue('Gaya');
    expect(sent).toEqual({ url: `${API}/regions/locate`, body: { lat: 24.791, lng: 85.005 } });
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ region_cluster: 'EAST_INDIA', district: 'Gaya', latitude: 24.791, longitude: 85.005 });
  });

  it('saves the detected region even when the district list failed to load', async () => {
    const bodies = captureUpdates();
    server.use(
      http.get(`${API}/regions/districts`, () => HttpResponse.json({ success: false, error: { code: 'X', message: 'X' } }, { status: 500 })),
      http.post(`${API}/regions/locate`, () =>
        HttpResponse.json({ success: true, data: { district: 'Gaya', state: 'Bihar', region: 'EAST_INDIA', label: 'Gaya' } }),
      ),
    );
    const allowed: Geolocator = { current: () => Promise.resolve({ latitude: 24.79, longitude: 85.0 }) };
    renderWithApp(<Onboarding geo={allowed} />, { route: '/onboarding/region', user: testUser({ district: 'Patna', region_cluster: 'HILLS_COOL', garden_types: [] }) });
    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    expect(await screen.findByText(/detected gaya, bihar · east india/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ region_cluster: 'EAST_INDIA', district: 'Gaya' });
  });

  it('keeps what was typed when the location names no district', async () => {
    server.use(http.post(`${API}/regions/locate`, () => HttpResponse.json({ success: true, data: null })));
    const allowed: Geolocator = { current: () => Promise.resolve({ latitude: 51.5, longitude: -0.1 }) };
    renderWithApp(<Onboarding geo={allowed} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.type(screen.getByLabelText(/district/i), 'My village');
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }));
    expect(await screen.findByText(/couldn't find your district from your location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/district/i)).toHaveValue('My village');
  });

  it('suggests districts as you type, and a pick sets the region', async () => {
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.type(screen.getByLabelText(/district/i), 'ga');
    await userEvent.click(await screen.findByRole('option', { name: /gaya · bihar/i }));
    expect(screen.getByLabelText(/district/i)).toHaveValue('Gaya');
    expect(screen.getByText(/east india/i)).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('saves a shared district name with its state', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding geo={denied} />, { route: '/onboarding/region', user: incomplete });
    await userEvent.type(screen.getByLabelText(/district/i), 'aurang');
    await userEvent.click(await screen.findByRole('option', { name: /aurangabad · bihar/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ region_cluster: 'EAST_INDIA', district: 'Aurangabad, Bihar' });
  });

  it('marks each chosen focus as selected', async () => {
    renderWithApp(<Onboarding />, { route: '/onboarding/garden', user: incomplete });
    const trees = screen.getByRole('button', { name: /fruit trees/i });
    expect(trees).toHaveAttribute('aria-pressed', 'false');
    expect(trees).toHaveTextContent(/orchard care/i);
    await userEvent.click(trees);
    expect(trees).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /start gardening/i })).toBeEnabled();
  });

  it('shows the Stitch photos: the garden header and one per choice', async () => {
    const { container } = renderWithApp(<Onboarding />, { route: '/onboarding/garden', user: incomplete });
    const srcs = [...container.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    for (const name of ['garden-hero', 'garden-trees', 'garden-veggies', 'garden-flowers']) {
      expect(srcs.some((s) => s.includes(name))).toBe(true);
    }
  });

  it('needs at least one garden type', async () => {
    renderWithApp(<Onboarding />, { route: '/onboarding/garden', user: incomplete });
    expect(screen.getByRole('button', { name: /start gardening/i })).toBeDisabled();
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

  it('signing out also ends the sign-in on the server, without waiting for it', async () => {
    let auth: string | null = null;
    server.use(
      http.post(`${API}/auth/sign-out`, async ({ request }) => {
        auth = request.headers.get('Authorization');
        await new Promise((r) => setTimeout(r, 50));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { session } = renderWithApp(<Onboarding />, { route: '/profile' });
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(session.get().user).toBeNull();
    await waitFor(() => expect(auth).toMatch(/^Bearer /));
  });

  it('shows the status card and settings rows from real profile data', async () => {
    renderWithApp(<Onboarding />, { route: '/profile' });
    expect(screen.getByText('Seedling')).toBeInTheDocument();
    expect(screen.getAllByText(/^free$/i)).toHaveLength(2); // plan card + premium row
    expect(screen.getByRole('heading', { name: /journal settings/i })).toBeInTheDocument();
    expect(screen.getByText('Patna')).toBeInTheDocument();
  });

  it('opens the edit form from a settings row', async () => {
    renderWithApp(<Onboarding />, { route: '/profile' });
    await userEvent.click(screen.getByRole('button', { name: /language/i }));
    expect(screen.getByLabelText(/^district/i)).toHaveValue('Patna');
  });

  it('saving the profile corrects a region that contradicts a known district', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding />, { route: '/profile', user: testUser({ district: 'patna', region_cluster: 'COASTAL_HUMID' }) });
    await userEvent.click(screen.getByRole('button', { name: /edit details/i }));
    expect(screen.queryByRole('button', { name: /coastal/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ region_cluster: 'EAST_INDIA', district: 'patna' });
  });

  it('will not save a blank district from the profile (it would send the user back to onboarding)', async () => {
    let puts = 0;
    server.use(http.put(`${API}/user/profile/update`, () => {
      puts += 1;
      return HttpResponse.json({ success: true, data: testUser({ district: null }) });
    }));
    renderWithApp(<Onboarding />, { route: '/profile' });
    await userEvent.click(screen.getByRole('button', { name: /edit details/i }));
    await userEvent.clear(screen.getByLabelText(/^district/i));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByText(/enter your district/i)).toBeInTheDocument();
    expect(puts).toBe(0);
  });

  it('credits the district boundary data', async () => {
    renderWithApp(<Onboarding />, { route: '/profile' });
    expect(await screen.findByText(/district boundaries: geoboundaries \(odbl\)/i)).toBeInTheDocument();
  });

  it('offers the same district suggestions when editing the profile, saving shared names with their state', async () => {
    const bodies = captureUpdates();
    renderWithApp(<Onboarding />, { route: '/profile', user: testUser({ district: 'Patna', region_cluster: 'EAST_INDIA' }) });
    await userEvent.click(screen.getByRole('button', { name: /edit details/i }));
    const box = screen.getByLabelText(/^district/i);
    await userEvent.clear(box);
    await userEvent.type(box, 'aurang');
    await userEvent.click(await screen.findByRole('option', { name: /aurangabad · bihar/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ district: 'Aurangabad, Bihar', region_cluster: 'EAST_INDIA' });
  });
});

describe('profile photo', () => {
  const key = 'avatars/u1/0f8fad5b-d9cb-469f-a165-70867728950e.jpg';
  const compressor: ImageCompressor = {
    compress: () => Promise.resolve({ blob: new Blob(['jpg'], { type: 'image/jpeg' }), base64: 'anBn', width: 10, height: 10 }),
  };

  it('uploads the picked photo as an avatar, saves its key, and shows it', async () => {
    const kinds: string[] = [];
    const saved: Record<string, unknown>[] = [];
    server.use(
      http.post(`${API}/media/images`, async ({ request }) => {
        kinds.push(/name="kind"\r\n\r\n(\w+)/.exec(await request.text())?.[1] ?? '');
        return HttpResponse.json({ success: true, data: { key, url: 'x', width: 10, height: 10, is_public: false } }, { status: 201 });
      }),
      http.put(`${API}/user/profile/update`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        saved.push(body);
        return HttpResponse.json({ success: true, data: { ...testUser(), ...body } });
      }),
      http.get(`${API}/media/download-url/*`, () =>
        HttpResponse.json({ success: true, data: { url: 'https://cdn.test/me.jpg', expires_in_seconds: 3600 } }),
      ),
    );
    renderWithApp(
      <ImageCompressorProvider value={compressor}>
        <ProfileScreen />
      </ImageCompressorProvider>,
      { user: testUser() },
    );

    await userEvent.upload(screen.getByLabelText(/change profile photo/i), new File(['x'], 'me.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(saved).toEqual([{ avatar_key: key }]));
    expect(kinds).toEqual(['avatar']);
    expect(await screen.findByRole('img', { name: /profile photo/i })).toHaveAttribute('src', 'https://cdn.test/me.jpg');
  });

  it('shows the person icon when there is no photo', () => {
    renderWithApp(<ProfileScreen />, { user: testUser() });
    expect(screen.queryByRole('img', { name: /profile photo/i })).toBeNull();
  });
});
