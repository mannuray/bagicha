import {
  ArgumentsHost,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { InvariantError, NotFoundError } from '../errors';
import { HttpExceptionFilter } from './http-exception.filter';

function run(exception: unknown) {
  const logger = { warn: jest.fn(), error: jest.fn() };
  const filter = new HttpExceptionFilter(logger as unknown as Logger);
  let status = 0;
  let body: any;
  const response = {
    status: (s: number) => {
      status = s;
      return response;
    },
    json: (b: unknown) => {
      body = b;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ headers: {}, url: '/api/v1/x' }),
    }),
  } as unknown as ArgumentsHost;
  filter.catch(exception, host);
  return { status, body, logger };
}

describe('HttpExceptionFilter', () => {
  it('uses the AppError reason as the error code and logs operational errors at warn', () => {
    const { status, body, logger } = run(
      new NotFoundError('PLANT_NOT_FOUND', 'Plant not found'),
    );
    expect(status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PLANT_NOT_FOUND');
    expect(body.error.message).toBe('Plant not found');
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('treats InvariantError as a programmer error (500, logged at error)', () => {
    const { status, body, logger } = run(new InvariantError('cycle missing'));
    expect(status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_INVARIANT');
    expect(logger.error).toHaveBeenCalled();
  });

  it('hides the message of unknown errors', () => {
    const { status, body, logger } = run(new Error('db password is hunter2'));
    expect(status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(logger.error).toHaveBeenCalled();
  });

  it('maps plain Nest exceptions to a status-derived code', () => {
    const { status, body } = run(new NotFoundException('Plant not found'));
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('keeps an explicit code supplied on a Nest exception', () => {
    const { body } = run(
      new NotFoundException({ code: 'AUTH_USER_NOT_FOUND', message: 'gone' }),
    );
    expect(body.error.code).toBe('AUTH_USER_NOT_FOUND');
  });

  it('reports validation failures as VALIDATION_ERROR with the field messages', () => {
    const { status, body } = run(
      new UnprocessableEntityException(['name must be a string']),
    );
    expect(status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.validation_errors).toEqual([
      { field: 'name', message: 'name must be a string' },
    ]);
  });
});
