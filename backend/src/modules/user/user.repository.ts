import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionTier, User } from '@prisma/client';
import { Tx } from '../../common/prisma/transaction';
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

  findByPhone(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone_number: phoneNumber },
    });
  }

  createWithPhone(phoneNumber: string): Promise<User> {
    return this.prisma.user.create({ data: { phone_number: phoneNumber } });
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
