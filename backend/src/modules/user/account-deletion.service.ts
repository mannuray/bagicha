import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../common/errors';
import { Clock } from '../../common/time';
import { AuditAction, AuditService } from '../audit';
import { toUserView, type UserView } from './user-view';
import { UserRepository } from './user.repository';

/** The notice period between asking to delete and the account being erased. */
export const DELETION_NOTICE_DAYS = 30;
const DAY_MS = 86_400_000;

/** Asking to delete an account, and keeping it during the notice period. */
@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /** Schedules erasure 30 days out and signs out every device. Asking again keeps the first date. */
  async request(userId: string): Promise<UserView> {
    const now = this.clock.now();
    const due = new Date(now.getTime() + DELETION_NOTICE_DAYS * DAY_MS);
    const user = await this.users.markForDeletion(userId, now, due);
    const newlyMarked = user.deletion_requested_at?.getTime() === now.getTime();
    if (newlyMarked) {
      await this.audit.record({
        actorUserId: userId,
        action: AuditAction.ACCOUNT_DELETION_REQUESTED,
        targetType: 'user',
        targetId: userId,
        snapshot: { user_id: userId, due_at: due.toISOString() },
      });
    }
    return toUserView(user);
  }

  /** Keeps the account: the pending deletion is dropped. */
  async cancel(userId: string): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    if (!user.deletion_due_at) return toUserView(user);
    const kept = await this.users.clearDeletion(userId);
    await this.audit.record({
      actorUserId: userId,
      action: AuditAction.ACCOUNT_DELETION_CANCELLED,
      targetType: 'user',
      targetId: userId,
      snapshot: { user_id: userId },
    });
    return toUserView(kept);
  }
}
