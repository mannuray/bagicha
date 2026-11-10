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

  create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  /** Latest message per (sender, receiver) pair the user is part of. */
  async inbox(
    userId: string,
    page: SkipTake,
  ): Promise<{ rows: InboxMessage[]; total: number }> {
    const where = { OR: [{ sender_id: userId }, { receiver_id: userId }] };
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
    const where = {
      OR: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId },
      ],
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
