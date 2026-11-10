import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Tx } from '../../common/prisma/transaction';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEventInput } from './audit-action';

/** Insert-only: audit rows are never updated or deleted. */
@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(event: AuditEventInput, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).auditEvent.create({
      data: {
        actor_user_id: event.actorUserId,
        action: event.action,
        target_type: event.targetType,
        target_id: event.targetId,
        snapshot: event.snapshot as Prisma.InputJsonValue,
      },
    });
  }
}
