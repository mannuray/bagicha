import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { memoryKeyValueStore } from '../../lib/storage';
import { ok, plantRecord } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { renderWithApp } from '../../test/render';
import { LogMomentScreen } from '.';

describe('the moment draft', () => {
  it('is kept in the storage the app provides, not the browser\'s directly', async () => {
    server.use(http.get(`${API}/ledger/plants/p1`, () => HttpResponse.json(ok({ ...plantRecord(), _count: { journal_entries: 0 } }))));
    const storage = memoryKeyValueStore();
    renderWithApp(
      <Routes>
        <Route path="/plants/:id/log" element={<LogMomentScreen />} />
      </Routes>,
      { route: '/plants/p1/log', storage },
    );
    await userEvent.type(await screen.findByLabelText(/what happened|note/i), 'New leaves');
    expect(JSON.parse(storage.get('bagicha.draft.moment.p1') ?? '{}')).toMatchObject({ content: 'New leaves' });
    expect(localStorage.getItem('bagicha.draft.moment.p1')).toBeNull();
  });
});
