import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExpertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isApprovedExpert(userId: string): Promise<boolean> {
    const verification = await this.prisma.expertVerification.findUnique({
      where: { user_id: userId },
      select: { status: true },
    });
    return verification?.status === 'APPROVED';
  }
}
