import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fail, ok } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { WeatherCard } from '.';

const weather = {
  weather: {
    now: { temp_c: 27.4, condition: 'PARTLY_CLOUDY' },
    today: { max_c: 28.1, min_c: 14.2, rain_chance: 70, rain_mm: 4.2 },
  },
  source: 'Open-Meteo',
};

function serve(body: unknown, status = 200) {
  let calls = 0;
  server.use(
    http.get(`${API}/weather`, () => {
      calls += 1;
      return HttpResponse.json(status === 200 ? ok(body) : fail('X'), { status });
    }),
  );
  return () => calls;
}

describe('WeatherCard', () => {
  it('shows now, today and the credit', async () => {
    serve(weather);
    renderWithApp(<WeatherCard />);
    const card = await screen.findByRole('region', { name: /weather/i });
    expect(card).toHaveTextContent('27°');
    expect(card).toHaveTextContent(/partly cloudy/i);
    expect(card).toHaveTextContent(/28°.*14°/);
    expect(card).toHaveTextContent(/70%/);
    expect(card).toHaveTextContent(/open-meteo/i);
  });

  it('is hidden when there is no weather for the user', async () => {
    const calls = serve({ weather: null, source: null });
    renderWithApp(<WeatherCard />);
    await waitFor(() => expect(calls()).toBe(1));
    expect(screen.queryByRole('region', { name: /weather/i })).not.toBeInTheDocument();
  });

  it('is hidden, not an error, when the request fails', async () => {
    const calls = serve(null, 500);
    renderWithApp(<WeatherCard />);
    await waitFor(() => expect(calls()).toBeGreaterThan(0));
    expect(screen.queryByRole('region', { name: /weather/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
