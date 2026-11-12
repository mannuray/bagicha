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

  countPending(
    type: ReportTargetType,
    targetId: string,
    tx?: Tx,
  ): Promise<number> {
    return (tx ?? this.prisma).report.count({
      where: { target_type: type, target_id: targetId, status: 'PENDING' },
    });
  }
}
