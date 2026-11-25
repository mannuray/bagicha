import type { Prisma } from '@prisma/client';

/**
 * An account that isn't waiting to be deleted. Anything shown to other people
 * (posts, replies, conversations) and daily jobs filter on it: a pending
 * account disappears from the community the moment deletion is asked for.
 */
export const ACTIVE_ACCOUNT = {
  deletion_due_at: null,
} satisfies Prisma.UserWhereInput;
