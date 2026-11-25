import { Injectable } from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACTIVE_ACCOUNT } from '../../user';

const withPost = {
  post: { select: { id: true, content: true, is_hidden: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithPost = Prisma.CommentGetPayload<{
  include: typeof withPost;
}>;

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(commentId: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id: commentId } });
  }

  /** A comment that may be reported (hidden or not), unless its author is leaving. */
  findReportable(commentId: string): Promise<Comment | null> {
    return this.prisma.comment.findFirst({
      where: { id: commentId, author: ACTIVE_ACCOUNT },
    });
  }

  create(data: Prisma.CommentUncheckedCreateInput): Promise<Comment> {
    return this.prisma.comment.create({ data });
  }

  async hide(commentId: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).comment.update({
      where: { id: commentId },
      data: { is_hidden: true },
    });
  }

  /** Recent visible expert-verified answers: the ask-AI knowledge pool. */
  recentVerified(take: number): Promise<CommentWithPost[]> {
    return this.prisma.comment.findMany({
      where: {
        is_expert_verified: true,
        is_hidden: false,
        author: ACTIVE_ACCOUNT,
        post: { author: ACTIVE_ACCOUNT },
      },
      include: withPost,
      orderBy: { created_at: 'desc' },
      take,
    });
  }
}
