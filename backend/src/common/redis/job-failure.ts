import type { Job } from 'bullmq';
import type { PinoLogger } from 'nestjs-pino';
import { reportError } from '../observability/error-reporting';

/**
 * Logs a failed job attempt. Failed jobs are removed at once (see
 * queue-defaults), so this log line (and its crash report) is the only record: a warning while
 * retries remain, an error when the last attempt fails. Job data is left out
 * because it can carry personal details.
 */
export function logJobFailure(
  logger: PinoLogger,
  job: Job | undefined,
  err: Error,
): void {
  if (!job) {
    logger.error({ err }, 'Job failed and could not be recovered');
    reportError(err);
    return;
  }
  const attempts = job.opts.attempts ?? 1;
  const context = {
    queue: job.queueName,
    jobId: job.id,
    jobName: job.name,
    attempt: job.attemptsMade,
    attempts,
  };
  if (job.attemptsMade >= attempts) {
    logger.error({ ...context, err }, 'Job failed after its last attempt');
    reportError(err, { queue: job.queueName, jobId: job.id });
  } else {
    logger.warn({ ...context, err }, 'Job attempt failed; will retry');
  }
}
