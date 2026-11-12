import { NotFoundError } from '../errors';
import { safeErr, safeReq } from './safe-serializers';

describe('safe log serializers', () => {
  it('drops the message of a driver error (it can carry the connection string), keeps frames and code', () => {
    const err = Object.assign(
      new Error('connect to postgresql://app:hunter2@db:5432 failed'),
      { code: 'P1001' },
    );
    const out = safeErr(err);
    expect(JSON.stringify(out)).not.toContain('hunter2');
    expect(out).toMatchObject({ type: 'Error', code: 'P1001' });
    expect(String(out.stack)).toContain('at ');
  });

  it("keeps our own operational error's message and reason", () => {
    expect(
      safeErr(new NotFoundError('PLANT_NOT_FOUND', 'Plant not found')),
    ).toMatchObject({
      type: 'NotFoundError',
      reason: 'PLANT_NOT_FOUND',
      message: 'Plant not found',
    });
  });

  it('logs a request as its method and route pattern only', () => {
    const req = {
      method: 'GET',
      url: '/api/v1/ledger/plants/abc?x=1',
      headers: { cookie: 'c' },
      raw: {
        method: 'GET',
        baseUrl: '',
        route: { path: '/api/v1/ledger/plants/:id' },
      },
    };
    expect(safeReq(req)).toEqual({
      method: 'GET',
      route: '/api/v1/ledger/plants/:id',
    });
  });
});
