import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionTier, User } from '@prisma/client';
import { Tx } from '../../common/prisma/transaction';
import { isUniqueViolation } from '../../common/prisma/unique-violation';
import { PrismaService } from '../../prisma/prisma.service';

/** What a Google sign-in tells us about a new account (the auth module's GoogleIdentity fits it). */
export interface NewGoogleAccount {
  sub: string;
  email: string;
  name: string | null;
}

/** Same limit the profile form allows. */
const NAME_MAX = 100;

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

  findByGoogleSub(sub: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { google_sub: sub } });
  }

  /**
   * Hands an account from before Google sign-in to the Google account whose
   * verified email it was given. Only when exactly one unclaimed account has
   * that email (any letter case); otherwise nothing changes and null comes back.
   */
  async claimByEmail(sub: string, email: string): Promise<User | null> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "users" SET "google_sub" = ${sub}, "updated_at" = now()
      WHERE "google_sub" IS NULL AND lower("email") = lower(${email})
        AND (SELECT count(*) FROM "users"
             WHERE "google_sub" IS NULL AND lower("email") = lower(${email})) = 1
      RETURNING "id"`;
    return rows[0] ? this.findById(rows[0].id) : null;
  }

  /**
   * The account for this Google id, created on first sign-in with Google's name.
   * Safe when two first sign-ins race: the loser of the unique-id race reads the winner's row.
   */
  async createFromGoogle(
    identity: NewGoogleAccount,
  ): Promise<{ user: User; created: boolean }> {
    try {
      const user = await this.prisma.user.create({
        data: {
          google_sub: identity.sub,
          email: identity.email,
          name: identity.name?.trim().slice(0, NAME_MAX) || null,
        },
      });
      return { user, created: true };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const winner = await this.findByGoogleSub(identity.sub);
      if (!winner) throw err;
      return { user: winner, created: false };
    }
  }

  /** Keeps the stored email in step with the Google account. */
  updateEmail(userId: string, email: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { email } });
  }

  setAvatarKey(userId: string, avatarKey: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar_key: avatarKey },
    });
  }

  /** Signs the user out everywhere; their phones stop getting reminders too. */
  async bumpTokenVersion(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { token_version: { increment: 1 } },
      }),
      this.prisma.pushDevice.deleteMany({ where: { user_id: userId } }),
    ]);
  }

  /**
   * Starts the notice period and signs the user out everywhere. A repeat
   * request keeps the first dates: only an account with nothing pending changes.
   */
  async markForDeletion(
    userId: string,
    requestedAt: Date,
    dueAt: Date,
  ): Promise<{ user: User; marked: boolean }> {
    const [{ count }] = await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { id: userId, deletion_due_at: null },
        data: {
          deletion_requested_at: requestedAt,
          deletion_due_at: dueAt,
          token_version: { increment: 1 },
        },
      }),
      // Signed out everywhere means no reminders either, even if the account is kept later.
      this.prisma.pushDevice.deleteMany({ where: { user_id: userId } }),
    ]);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return { user, marked: count === 1 };
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
