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

  /** Saves the message and makes it its conversation's latest, together. */
  create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    const [user_a, user_b] = [data.sender_id, data.receiver_id].sort();
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data });
      const latest = {
        last_message_id: message.id,
        last_at: message.created_at,
      };
      // ON CONFLICT DO NOTHING: two first messages at once both get through.
      await tx.conversation.createMany({
        data: [{ user_a, user_b, ...latest }],
        skipDuplicates: true,
      });
      // A message dated earlier (imports, tests) never replaces a newer one.
      await tx.conversation.updateMany({
        where: { user_a, user_b, last_at: { lte: message.created_at } },
        data: latest,
      });
      return message;
    });
  }

  /** The latest message of each conversation the user is part of, newest first. */
  async inbox(
    userId: string,
    page: SkipTake,
  ): Promise<{ rows: InboxMessage[]; total: number }> {
    // Someone the user blocked drops out of their inbox entirely.
    const blocked = (
      await this.prisma.userBlock.findMany({
        where: { blocker_id: userId },
        select: { blocked_id: true },
      })
    ).map((b) => b.blocked_id);
    const where: Prisma.ConversationWhereInput = {
      OR: [
        { user_a: userId, user_b: { notIn: blocked } },
        { user_b: userId, user_a: { notIn: blocked } },
      ],
    };
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: [{ last_at: 'desc' }, { last_message_id: 'desc' }],
        include: { last_message: { include: inboxInclude } },
        ...page,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { rows: conversations.map((c) => c.last_message), total };
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
