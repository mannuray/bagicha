import type { User } from '@prisma/client';
import { FixedClock } from '../../common/time';
import type { AuditService } from '../audit';
import { AccountDeletionService } from './account-deletion.service';
import type { UserRepository } from './user.repository';

const NOW = new Date('2026-11-26T10:00:00.000Z');
const DUE = new Date('2026-12-26T10:00:00.000Z');

function user(over: Partial<User> = {}): User {
  return {
    id: 'u1',
    deletion_requested_at: null,
    deletion_due_at: null,
    ...over,
  } as User;
}

function build(stored: User) {
  let row = stored;
  const users = {
    findById: jest.fn(() => Promise.resolve(row)),
    markForDeletion: jest.fn((_id: string, requestedAt: Date, dueAt: Date) => {
      if (!row.deletion_due_at) {
        row = {
          ...row,
          deletion_requested_at: requestedAt,
          deletion_due_at: dueAt,
        };
      }
      return Promise.resolve(row);
    }),
    clearDeletion: jest.fn(() => {
      row = { ...row, deletion_requested_at: null, deletion_due_at: null };
      return Promise.resolve(row);
    }),
  };
  const audit = { record: jest.fn(() => Promise.resolve()) };
  const service = new AccountDeletionService(
    users as unknown as UserRepository,
    audit as unknown as AuditService,
    new FixedClock(NOW),
  );
  return { service, users, audit };
}

describe('AccountDeletionService', () => {
  it('schedules erasure exactly 30 days from the request and audits it', async () => {
    const { service, users, audit } = build(user());
    const view = await service.request('u1');
    expect(users.markForDeletion).toHaveBeenCalledWith('u1', NOW, DUE);
    expect(view.deletion_due_at).toEqual(DUE);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACCOUNT_DELETION_REQUESTED',
        actorUserId: 'u1',
        snapshot: { user_id: 'u1', due_at: DUE.toISOString() },
      }),
    );
  });

  it('a repeat request keeps the first date and audits nothing new', async () => {
    const first = new Date('2026-12-01T00:00:00.000Z');
    const { service, audit } = build(
      user({
        deletion_requested_at: new Date('2026-11-01'),
        deletion_due_at: first,
      }),
    );
    const view = await service.request('u1');
    expect(view.deletion_due_at).toEqual(first);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('keeping the account clears the date and audits it', async () => {
    const { service, audit } = build(
      user({ deletion_requested_at: NOW, deletion_due_at: DUE }),
    );
    const view = await service.cancel('u1');
    expect(view.deletion_due_at).toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ACCOUNT_DELETION_CANCELLED' }),
    );
  });

  it('keeping an account with nothing pending changes nothing', async () => {
    const { service, users, audit } = build(user());
    await service.cancel('u1');
    expect(users.clearDeletion).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});
