import { Injectable } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
import { NotFoundError } from '../../../common/errors';
import { Tx, TransactionRunner } from '../../../common/prisma/transaction';
import { addDays, Clock } from '../../../common/time';
import { AuditAction, AuditService } from '../../audit';
import { ReportTargetDto } from '../dto/report-target.dto';
import { CommentRepository } from '../repositories/comment.repository';
import { PostRepository } from '../repositories/post.repository';
import { ReportRepository } from '../repositories/report.repository';

const HIDE_REPORT_THRESHOLD = 3;
/** Only reports from accounts at least this old count towards hiding. */
const ESTABLISHED_ACCOUNT_DAYS = 7;
const AUDIT_EXCERPT_CHARS = 200;

interface ReportTarget {
  type: ReportTargetType;
  id: string;
  content: string;
  isHidden: boolean;
  hide: (tx: Tx) => Promise<void>;
}

/** Reports on posts and comments: one per user per target, enough of them hide it. */
@Injectable()
export class ReportService {
  constructor(
    private readonly posts: PostRepository,
    private readonly comments: CommentRepository,
    private readonly reports: ReportRepository,
    private readonly audit: AuditService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async reportPost(userId: string, postId: string, dto: ReportTargetDto) {
    const post = await this.posts.findById(postId);
    if (!post) throw new NotFoundError('POST_NOT_FOUND', 'Post not found');
    return this.recordReport(userId, dto.reason, {
      type: ReportTargetType.POST,
      id: post.id,
      content: post.content,
      isHidden: post.is_hidden,
      hide: (tx) => this.posts.hide(post.id, tx),
    });
  }

  async reportComment(userId: string, commentId: string, dto: ReportTargetDto) {
    const comment = await this.comments.findById(commentId);
    if (!comment)
      throw new NotFoundError('COMMENT_NOT_FOUND', 'Comment not found');
    return this.recordReport(userId, dto.reason, {
      type: ReportTargetType.COMMENT,
      id: comment.id,
      content: comment.content,
      isHidden: comment.is_hidden,
      hide: (tx) => this.comments.hide(comment.id, tx),
    });
  }

  /** One report per user per target; the report and its audit row commit together. */
  private recordReport(
    reporterId: string,
    reason: string | undefined,
    target: ReportTarget,
  ) {
    return this.transactions.run(async (tx) => {
      const trimmedReason = reason?.trim() || null;
      const filed = await this.reports.createIfNew(
        {
          target_type: target.type,
          target_id: target.id,
          reporter_id: reporterId,
          reason: trimmedReason,
        },
        tx,
      );
      if (filed) {
        await this.audit.record(
          {
            actorUserId: reporterId,
            action: AuditAction.COMMUNITY_REPORT_FILED,
            targetType: target.type,
            targetId: target.id,
            snapshot: {
              target_type: target.type,
              target_id: target.id,
              reason: trimmedReason,
              reporter_id: reporterId,
              content_excerpt: target.content.slice(0, AUDIT_EXCERPT_CHARS),
            },
          },
          tx,
        );
      }

      const count = await this.reports.countPendingFromEstablished(
        target.type,
        target.id,
        addDays(this.clock.now(), -ESTABLISHED_ACCOUNT_DAYS),
        tx,
      );
      if (count >= HIDE_REPORT_THRESHOLD && !target.isHidden)
        await target.hide(tx);
      return !filed ? { already_reported: true } : { pending_reports: count };
    });
  }
}
