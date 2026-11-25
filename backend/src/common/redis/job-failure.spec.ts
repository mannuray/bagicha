import type { Job } from 'bullmq';
import type { PinoLogger } from 'nestjs-pino';
import { logJobFailure } from './job-failure';
import { reportError } from '../observability/error-reporting';

jest.mock('../observability/error-reporting', () => ({
  reportError: jest.fn(),
}));

function logger() {
  return { warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger & {
    warn: jest.Mock;
    error: jest.Mock;
  };
}

function job(attemptsMade: number, attempts = 3): Job {
  return {
    id: 'lifecycle-p1-SEEDLING',
    name: 'generate',
    queueName: 'task-generation',
    attemptsMade,
    opts: { attempts },
    data: { plant_id: 'p1', user_id: 'u1', phone_number: '+919999999999' },
  } as unknown as Job;
}

describe('logJobFailure', () => {
  it('logs a retry as a warning while attempts remain', () => {
    const log = logger();
    logJobFailure(log, job(1), new Error('db timeout'));
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.error).not.toHaveBeenCalled();
    expect(log.warn.mock.calls[0][0]).toMatchObject({
      queue: 'task-generation',
      jobId: 'lifecycle-p1-SEEDLING',
      attempt: 1,
      attempts: 3,
    });
  });

  it('logs the last failed attempt as an error with the cause', () => {
    const log = logger();
    const err = new Error('db timeout');
    logJobFailure(log, job(3), err);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error.mock.calls[0][0]).toMatchObject({
      queue: 'task-generation',
      jobId: 'lifecycle-p1-SEEDLING',
      attempt: 3,
      attempts: 3,
      err,
    });
  });

  it('never logs job data: it can carry personal details', () => {
    const log = logger();
    logJobFailure(log, job(3), new Error('x'));
    expect(JSON.stringify(log.error.mock.calls[0][0])).not.toContain(
      '+919999999999',
    );
  });

  it('treats a job without an attempts option as a single attempt', () => {
    const log = logger();
    const single = { ...job(1), opts: {} } as unknown as Job;
    logJobFailure(log, single, new Error('x'));
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  it('logs an error when the job is missing (stalled beyond recovery)', () => {
    const log = logger();
    logJobFailure(log, undefined, new Error('stalled'));
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});

describe('logJobFailure crash reports', () => {
  beforeEach(() => jest.mocked(reportError).mockClear());

  it('reports only the last failed attempt, tagged with queue and job id', () => {
    const err = new Error('db timeout');
    logJobFailure(logger(), job(1), err);
    expect(reportError).not.toHaveBeenCalled();
    logJobFailure(logger(), job(3), err);
    expect(reportError).toHaveBeenCalledWith(err, {
      queue: 'task-generation',
      jobId: 'lifecycle-p1-SEEDLING',
    });
  });
});
