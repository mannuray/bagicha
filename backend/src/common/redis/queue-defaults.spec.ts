import { QUEUE_JOB_DEFAULTS } from './queue-defaults';

describe('queue job defaults', () => {
  it('removes finished and failed jobs: a kept job blocks re-adding its fixed jobId', () => {
    expect(QUEUE_JOB_DEFAULTS.removeOnComplete).toBe(true);
    expect(QUEUE_JOB_DEFAULTS.removeOnFail).toBe(true);
  });

  it('retries a few times with backoff first', () => {
    expect(QUEUE_JOB_DEFAULTS.attempts).toBe(3);
    expect(QUEUE_JOB_DEFAULTS.backoff).toEqual({
      type: 'exponential',
      delay: 2000,
    });
  });
});
