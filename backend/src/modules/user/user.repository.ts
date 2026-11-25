import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionTier, User } from '@prisma/client';
import { Tx } from '../../common/prisma/transaction';
import { isUniqueViolation } from '../../common/prisma/unique-violation';
import { PrismaService } from '../../prisma/prisma.service';

/** A user's own row. Every method is keyed by the user's id. */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  findById(userId: string, tx?: Tx): Promise<User | null> {
    return this.db(tx).user.findUnique({ where: { id: userId } });
  }

  /** Just the fields that decide the gardener's region. */
  findRegion(
    userId: string,
    tx?: Tx,
  ): Promise<Pick<User, 'region_cluster' | 'district'> | null> {
    return this.db(tx).user.findUnique({
      where: { id: userId },
      select: { region_cluster: true, district: true },
    });
  }

  findByPhone(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone_number: phoneNumber },
    });
  }

  createWithPhone(phoneNumber: string): Promise<User> {
    return this.prisma.user.create({ data: { phone_number: phoneNumber } });
  }

  /**
   * The user with this phone, created on first sign-in. Safe when two first
   * sign-ins race: the loser of the unique-phone race reads the winner's row.
   */
  async findOrCreateByPhone(
    phoneNumber: string,
  ): Promise<{ user: User; created: boolean }> {
    const existing = await this.findByPhone(phoneNumber);
    if (existing) return { user: existing, created: false };
    try {
      return { user: await this.createWithPhone(phoneNumber), created: true };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const winner = await this.findByPhone(phoneNumber);
      if (!winner) throw err;
      return { user: winner, created: false };
    }
  }

  async bumpTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { token_version: { increment: 1 } },
    });
  }

  /**
   * Starts the notice period and signs the user out everywhere. A repeat
   * request keeps the first dates: only an account with nothing pending changes.
   */
  async markForDeletion(
    userId: string,
    requestedAt: Date,
    dueAt: Date,
  ): Promise<User> {
    await this.prisma.user.updateMany({
      where: { id: userId, deletion_due_at: null },
      data: {
        deletion_requested_at: requestedAt,
        deletion_due_at: dueAt,
        token_version: { increment: 1 },
      },
    });
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  /**
   * Drops a pending deletion only while it isn't due yet, in one statement:
   * a due account belongs to the erasure run. Null when nothing was kept.
   */
  async keepIfNotDue(userId: string, now: Date): Promise<User | null> {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, deletion_due_at: { gt: now } },
      data: { deletion_requested_at: null, deletion_due_at: null },
    });
    return count === 0 ? null : this.findById(userId);
  }

  updateProfile(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async updateSubscription(
    userId: string,
    change: { tier: SubscriptionTier; expiresAt: Date | null },
    tx?: Tx,
  ): Promise<void> {
    await this.db(tx).user.update({
      where: { id: userId },
      data: {
        subscription_tier: change.tier,
        premium_expires_at: change.expiresAt,
      },
    });
  }
}
