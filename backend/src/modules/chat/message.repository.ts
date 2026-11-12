import { Injectable } from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const inboxInclude = {
  sender: { select: { id: true, name: true } },
  receiver: { select: { id: true, name: true } },
} satisfies Prisma.MessageInclude;

export type InboxMessage = Prisma.MessageGetPayload<{
  include: typeof inboxInclude;
}>;
type SkipTake = { skip: number; take: number };

/** Messages are only ever read by one of their two participants. */
@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async userExists(userId: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id: userId } })) > 0;
  }

  async hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const row = await this.prisma.userBlock.findUnique({
      where: {
        blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
      },
    });
    return row !== null;
  }

  async block(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.createMany({
      data: [{ blocker_id: blockerId, blocked_id: blockedId }],
      skipDuplicates: true,
    });
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({
      where: { blocker_id: blockerId, blocked_id: blockedId },
    });
  }

  /** Messages the user can see: never ones sent by someone they blocked. */
  private async visibleTo(userId: string): Promise<Prisma.MessageWhereInput> {
    const blocked = await this.prisma.userBlock.findMany({
      where: { blocker_id: userId },
      select: { blocked_id: true },
    });
    if (blocked.length === 0) return {};
    return {
      NOT: {
        receiver_id: userId,
        sender_id: { in: blocked.map((b) => b.blocked_id) },
      },
    };
  }

  create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  /** Latest message per (sender, receiver) pair the user is part of. */
  async inbox(
    userId: string,
    page: SkipTake,
  ): Promise<{ rows: InboxMessage[]; total: number }> {
    const where: Prisma.MessageWhereInput = {
      OR: [{ sender_id: userId }, { receiver_id: userId }],
      ...(await this.visibleTo(userId)),
    };
    const [rows, pairs] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { created_at: 'desc' },
        distinct: ['sender_id', 'receiver_id'],
        include: inboxInclude,
        ...page,
      }),
      this.prisma.message.groupBy({ by: ['sender_id', 'receiver_id'], where }),
    ]);
    return { rows, total: pairs.length };
  }

  async conversation(
    userId: string,
    otherUserId: string,
    page: SkipTake,
  ): Promise<{ rows: Message[]; total: number }> {
    const where: Prisma.MessageWhereInput = {
      OR: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId },
      ],
      ...(await this.visibleTo(userId)),
    };
    const [rows, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { created_at: 'asc' },
        ...page,
      }),
      this.prisma.message.count({ where }),
    ]);
    return { rows, total };
  }
}
