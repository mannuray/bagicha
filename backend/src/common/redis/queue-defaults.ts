import type { DefaultJobOptions } from 'bullmq';

/**
 * Every queue's job options. Jobs use fixed ids (one per plant+stage, one per
 * pincode) so repeat visits don't stack work; BullMQ ignores add() while a job
 * with that id still exists in any state, so finished and failed jobs are
 * removed at once (each processor logs failures with logJobFailure). Otherwise a
 * failed job would block its plant's tasks until it aged out.
 */
export const QUEUE_JOB_DEFAULTS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: true,
} as const satisfies DefaultJobOptions;
