import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { pageOf } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { useTimeline, type LogType } from '.';

function Probe({ types }: { types?: readonly LogType[] }) {
  const timeline = useTimeline('p1', types);
  return <p>{timeline.data ? `loaded ${timeline.data.items.length}` : 'loading'}</p>;
}

function captureTimelineQueries() {
  const seen: Array<string | null> = [];
  server.use(
    http.get(`${API}/ledger/plants/p1/timeline`, ({ request }) => {
      seen.push(new URL(request.url).searchParams.get('types'));
      return HttpResponse.json(pageOf([]));
    }),
  );
  return seen;
}

describe('timeline filter', () => {
  it('asks the server for the chosen types', async () => {
    const seen = captureTimelineQueries();
    renderWithApp(<Probe types={['HARVEST', 'NOTE']} />);
    await screen.findByText('loaded 0');
    expect(seen).toEqual(['HARVEST,NOTE']);
  });

  it('sends no types for All', async () => {
    const seen = captureTimelineQueries();
    renderWithApp(<Probe types={[]} />);
    await screen.findByText('loaded 0');
    expect(seen).toEqual([null]);
  });
});
