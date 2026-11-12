import { FixedClock } from '../../common/time';
import { TransactionRunner } from '../../common/prisma/transaction';
import { AiProvider } from '../ai';
import { AuditService } from '../audit';
import { PlantRecordService } from '../plant-ledger';
import { CommunityService } from './community.service';
import { CommentRepository } from './repositories/comment.repository';
import { ExpertRepository } from './repositories/expert.repository';
import { PostRepository } from './repositories/post.repository';
import { ReportRepository } from './repositories/report.repository';

function build() {
  const reports: Array<{ reporter: string; target: string }> = [];
  const post = {
    id: 'post1',
    content: 'Leaves curling on my mango, what is it?',
    is_hidden: false,
  };
  const posts = {
    findById: jest.fn(() => Promise.resolve(post)),
    hide: jest.fn(() => Promise.resolve()),
  };
  const reportRepo = {
    createIfNew: jest.fn((data: { target_id: string; reporter_id: string }) => {
      const dup = reports.some(
        (r) => r.target === data.target_id && r.reporter === data.reporter_id,
      );
      if (!dup)
        reports.push({ target: data.target_id, reporter: data.reporter_id });
      return Promise.resolve(!dup);
    }),
    countPendingFromEstablished: jest.fn(() => Promise.resolve(reports.length)),
  };
  const audit = { record: jest.fn(() => Promise.resolve()) };
  const service = new CommunityService(
    posts as unknown as PostRepository,
    {} as unknown as CommentRepository,
    reportRepo as unknown as ReportRepository,
    {} as unknown as ExpertRepository,
    { findById: jest.fn() } as any,
    {} as unknown as PlantRecordService,
    {} as unknown as AiProvider,
    audit as unknown as AuditService,
    {
      run: (fn: (tx: unknown) => unknown) => fn('tx'),
    } as unknown as TransactionRunner,
    { recent: jest.fn(() => Promise.resolve([])) } as any,
    {} as any,
    new FixedClock(new Date('2026-11-12T00:00:00Z')),
  );
  return { service, audit, posts };
}

describe('CommunityService reports', () => {
  it('audits a new report with a snapshot of the reported content', async () => {
    const { service, audit } = build();
    const result = await service.reportPost('u1', 'post1', { reason: 'spam' });
    expect(result).toMatchObject({ success: true, pending_reports: 1 });
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect((audit.record.mock.calls[0] as unknown[])[0]).toMatchObject({
      actorUserId: 'u1',
      action: 'COMMUNITY_REPORT_FILED',
      targetType: 'POST',
      targetId: 'post1',
      snapshot: {
        target_type: 'POST',
        target_id: 'post1',
        reason: 'spam',
        reporter_id: 'u1',
        content_excerpt: 'Leaves curling on my mango, what is it?',
      },
    });
    expect((audit.record.mock.calls[0] as unknown[])[1]).toBe('tx');
  });

  it('is idempotent: reporting the same post again writes no new audit row', async () => {
    const { service, audit } = build();
    await service.reportPost('u1', 'post1', { reason: 'spam' });
    const again = await service.reportPost('u1', 'post1', { reason: 'spam' });
    expect(again).toMatchObject({ already_reported: true });
    expect(audit.record).toHaveBeenCalledTimes(1);
  });
});
