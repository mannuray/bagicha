import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Tx } from '../../common/prisma/transaction';
import { PrismaService } from '../../prisma/prisma.service';

export type EraseOutcome = 'erased' | 'not-due';

/** The keys blanked in kept report events (the migration's trigger allows only this). */
const REDACTED_WORDS = Prisma.sql`'{"reason": null, "content_excerpt": null}'::jsonb`;
/** Long enough for a large garden's rows; Prisma's default is 5 s. */
const ERASE_TIMEOUT_MS = 60_000;

/**
 * Deletes one account and everything it owns, in one transaction, child rows
 * first (the schema has no cascades). Kept on purpose: applied_payments (tax
 * records) and audit_events (security log), with the person's words removed.
 */
@Injectable()
export class AccountEraserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Due user ids after `after`, oldest id first. */
  async dueBatch(
    now: Date,
    after: string | null,
    size: number,
  ): Promise<string[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        deletion_due_at: { lte: now },
        ...(after ? { id: { gt: after } } : {}),
      },
      orderBy: { id: 'asc' },
      take: size,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  erase(userId: string, now: Date): Promise<EraseOutcome> {
    return this.prisma.$transaction(
      async (tx) => {
        // Locks the row: a "keep my account" racing this run either lands
        // first (and this sees nothing due) or waits until the account is gone.
        const [row] = await tx.$queryRaw<
          Array<{ deletion_due_at: Date | null }>
        >`
          SELECT deletion_due_at FROM users WHERE id = ${userId} FOR UPDATE`;
        if (!row?.deletion_due_at || row.deletion_due_at > now)
          return 'not-due';
        await this.eraseGarden(tx, userId);
        await this.eraseCommunity(tx, userId);
        await this.eraseMessages(tx, userId);
        await tx.expertVerification.deleteMany({ where: { user_id: userId } });
        await tx.user.delete({ where: { id: userId } });
        return 'erased';
      },
      { timeout: ERASE_TIMEOUT_MS },
    );
  }

  private async eraseGarden(tx: Tx, userId: string) {
    const plantIds = (
      await tx.plant.findMany({
        where: { user_id: userId },
        select: { id: true },
      })
    ).map((p) => p.id);
    const sessionIds = (
      await tx.diagnosisSession.findMany({
        where: {
          OR: [
            { plant_id: { in: plantIds } },
            { subject_id: { in: plantIds } },
          ],
        },
        select: { id: true },
      })
    ).map((s) => s.id);
    const outcomeIds = (
      await tx.diagnosisOutcome.findMany({
        where: {
          OR: [
            { session_id: { in: sessionIds } },
            { plant_id: { in: plantIds } },
          ],
        },
        select: { id: true },
      })
    ).map((o) => o.id);
    const overlayIds = (
      await tx.personalizedOverlay.findMany({
        where: { OR: [{ user_id: userId }, { plant_id: { in: plantIds } }] },
        select: { id: true },
      })
    ).map((o) => o.id);

    await tx.task.deleteMany({
      where: {
        OR: [
          { plant_id: { in: plantIds } },
          { diagnosis_outcome_id: { in: outcomeIds } },
          { personalized_overlay_id: { in: overlayIds } },
        ],
      },
    });
    await tx.journalEntry.deleteMany({
      where: {
        OR: [
          { plant_id: { in: plantIds } },
          { diagnosis_outcome_id: { in: outcomeIds } },
        ],
      },
    });
    await tx.personalizedOverlay.deleteMany({
      where: { id: { in: overlayIds } },
    });
    await tx.diagnosisOutcome.deleteMany({ where: { id: { in: outcomeIds } } });
    await tx.diagnosisSession.deleteMany({ where: { id: { in: sessionIds } } });
    await tx.plantCycle.deleteMany({ where: { plant_id: { in: plantIds } } });
    await tx.plant.deleteMany({ where: { id: { in: plantIds } } });
    await tx.gardenPlace.deleteMany({ where: { user_id: userId } });
  }

  private async eraseCommunity(tx: Tx, userId: string) {
    const postIds = (
      await tx.post.findMany({
        where: { author_id: userId },
        select: { id: true },
      })
    ).map((p) => p.id);
    // Their own comments anywhere, and every comment under their posts.
    const commentIds = (
      await tx.comment.findMany({
        where: { OR: [{ author_id: userId }, { post_id: { in: postIds } }] },
        select: { id: true },
      })
    ).map((c) => c.id);
    const contentIds = [...postIds, ...commentIds];

    await tx.$executeRaw`
      UPDATE audit_events SET snapshot = snapshot || ${REDACTED_WORDS}
      WHERE action = 'COMMUNITY_REPORT_FILED'
        AND (actor_user_id = ${userId} OR target_id = ANY(${contentIds}::text[]))`;
    await tx.report.deleteMany({
      where: {
        OR: [
          { reporter_id: userId },
          { target_type: 'POST', target_id: { in: postIds } },
          { target_type: 'COMMENT', target_id: { in: commentIds } },
        ],
      },
    });
    await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
    await tx.post.deleteMany({ where: { id: { in: postIds } } });
  }

  private async eraseMessages(tx: Tx, userId: string) {
    // Conversations point at their latest message: they go first.
    await tx.conversation.deleteMany({
      where: { OR: [{ user_a: userId }, { user_b: userId }] },
    });
    await tx.message.deleteMany({
      where: { OR: [{ sender_id: userId }, { receiver_id: userId }] },
    });
    await tx.userBlock.deleteMany({
      where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
    });
  }
}
