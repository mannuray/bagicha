import { Injectable } from '@nestjs/common';
import { Tx } from '../../common/prisma/transaction';
import { AuditEventInput } from './audit-action';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  /** Pass the caller's `tx` so the audit row commits or rolls back with the mutation. */
  record(event: AuditEventInput, tx?: Tx): Promise<void> {
    return this.repository.insert(event, tx);
  }
}
