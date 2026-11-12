import { Injectable } from '@nestjs/common';
import { Prisma, ReportTargetType } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Files the report unless this reporter already reported this target (a unique
   * index guards it, so a double tap can't file two). True when it was filed now.
   */
  async createIfNew(
    data: Prisma.ReportCreateManyInput,
    tx?: Tx,
  ): Promise<boolean> {
    const { count } = await (tx ?? this.prisma).report.createMany({
      data: [data],
      skipDuplicates: true,
    });
    return count === 1;
  }

  /**
   * Pending reports on the target from accounts created before `createdBefore`:
   * fresh accounts are cheap to make, so they can't hide someone's post.
   */
  async countPendingFromEstablished(
    type: ReportTargetType,
    targetId: string,
    createdBefore: Date,
    tx?: Tx,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const reports = await db.report.findMany({
      where: { target_type: type, target_id: targetId, status: 'PENDING' },
      select: { reporter_id: true },
    });
    if (reports.length === 0) return 0;
    return db.user.count({
      where: {
        id: { in: reports.map((r) => r.reporter_id) },
        created_at: { lt: createdBefore },
      },
    });
  }
}
