import { Injectable } from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACTIVE_ACCOUNT } from '../../user';

const feedInclude = {
  author: { select: { id: true, name: true, badge_level: true } },
  _count: { select: { comments: { where: { is_hidden: false } } } },
} satisfies Prisma.PostInclude;

export type FeedPost = Prisma.PostGetPayload<{ include: typeof feedInclude }>;

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listVisible(
    district: string | null | undefined,
    page: { skip: number; take: number },
  ): Promise<{ rows: FeedPost[]; total: number }> {
    const where: Prisma.PostWhereInput = {
      is_hidden: false,
      author: ACTIVE_ACCOUNT,
      ...(district ? { district } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: feedInclude,
        orderBy: { created_at: 'desc' },
        ...page,
      }),
      this.prisma.post.count({ where }),
    ]);
    return { rows, total };
  }

  findById(postId: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { id: postId } });
  }

  /** A post others may see and reply to: not hidden, author not leaving. */
  findVisible(postId: string): Promise<Post | null> {
    return this.prisma.post.findFirst({
      where: { id: postId, is_hidden: false, author: ACTIVE_ACCOUNT },
    });
  }

  create(data: Prisma.PostUncheckedCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async hide(postId: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).post.update({
      where: { id: postId },
      data: { is_hidden: true },
    });
  }
}
