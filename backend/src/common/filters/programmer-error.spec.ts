import { ArgumentsHost } from '@nestjs/common';
import { InvariantError } from '../errors';
import { HttpExceptionFilter } from './http-exception.filter';

describe('a programmer error in a response', () => {
  it('gets fixed wording and no details (they are for the log, not the client)', () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    let body: unknown;
    const res = { status: () => ({ json: (b: unknown) => (body = b) }) };
    const req = { headers: {}, route: { path: '/api/v1/x' }, baseUrl: '' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;
    new HttpExceptionFilter(logger as never).catch(
      new InvariantError('plant p1 lost its cycle c9', { plantId: 'p1' }),
      host,
    );
    const error = (body as { error: Record<string, unknown> }).error;
    expect(error.message).toBe('Internal server error occurred');
    expect(error.details).toBeNull();
    expect(JSON.stringify(body)).not.toContain('p1');
    expect(logger.error).toHaveBeenCalled();
  });
});
