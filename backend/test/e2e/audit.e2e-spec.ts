import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TransactionRunner } from '../../src/common/prisma/transaction';
import { AuditAction, AuditService } from '../../src/modules/audit';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser } from './fixtures';

describe('audit trail', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let audit: AuditService;
  let tx: TransactionRunner;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    audit = app.get(AuditService);
    tx = app.get(TransactionRunner);
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('writes an event with its snapshot', async () => {
    const user = await seedUser(prisma);
    await audit.record({
      actorUserId: user.id,
      action: AuditAction.AUTH_SIGNED_IN,
      targetType: 'user',
      targetId: user.id,
      snapshot: { is_new_user: false },
    });
    const rows = await prisma.auditEvent.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor_user_id: user.id,
      action: 'AUTH_SIGNED_IN',
      target_type: 'user',
      snapshot: { is_new_user: false },
    });
  });

  it('leaves no event behind when the surrounding transaction rolls back', async () => {
    await expect(
      tx.run(async (client) => {
        await audit.record(
          {
            actorUserId: null,
            action: AuditAction.SUBSCRIPTION_CHANGED,
            targetType: 'user',
            targetId: 'u-x',
            snapshot: {},
          },
          client,
        );
        throw new Error('mutation failed');
      }),
    ).rejects.toThrow('mutation failed');
    expect(await prisma.auditEvent.count()).toBe(0);
  });
});
