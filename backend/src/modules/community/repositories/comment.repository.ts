import { Injectable } from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';

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
      where: { is_expert_verified: true, is_hidden: false },
      include: withPost,
      orderBy: { created_at: 'desc' },
      take,
    });
  }
}
