import { Injectable } from '@nestjs/common';
import { Prisma, Report, ReportTargetType } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByReporter(
    type: ReportTargetType,
    targetId: string,
    reporterId: string,
    tx?: Tx,
  ): Promise<Report | null> {
    return (tx ?? this.prisma).report.findFirst({
      where: {
        target_type: type,
        target_id: targetId,
        reporter_id: reporterId,
      },
    });
  }

  create(data: Prisma.ReportUncheckedCreateInput, tx?: Tx): Promise<Report> {
    return (tx ?? this.prisma).report.create({ data });
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
