import { Injectable } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
import { NotFoundError } from '../../common/errors';
import { Page, PageQuery, toPage, toSkipTake } from '../../common/pagination';
import { Tx, TransactionRunner } from '../../common/prisma/transaction';
import { AiProvider } from '../ai';
import { AuditAction, AuditService } from '../audit';
import { JournalRepository, PlantRecordService } from '../plant-ledger';
import { UserRepository } from '../user';
import { AskAiDto } from './dto/ask-ai.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportTargetDto } from './dto/report-target.dto';
import { CommentRepository } from './repositories/comment.repository';
import { ExpertRepository } from './repositories/expert.repository';
import { FeedPost, PostRepository } from './repositories/post.repository';
import { ReportRepository } from './repositories/report.repository';

const HIDE_REPORT_THRESHOLD = 3;
const MAX_KNOWLEDGE_SNIPPETS = 3;
const KNOWLEDGE_POOL_SIZE = 50;
const AUDIT_EXCERPT_CHARS = 200;
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'can',
  'shall',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'from',
  'about',
  'as',
  'this',
  'that',
  'these',
  'those',
  'i',
  'my',
  'me',
  'we',
  'us',
  'our',
  'you',
  'your',
  'it',
  'its',
  'they',
  'them',
  'their',
  'what',
  'why',
  'how',
  'when',
  'where',
  'who',
  'which',
  'plant',
  'tree',
  'flower',
  'crop',
  'help',
  'please',
  'kindly',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

interface ReportTarget {
  type: ReportTargetType;
  id: string;
  content: string;
  isHidden: boolean;
  hide: (tx: Tx) => Promise<void>;
}

@Injectable()
export class CommunityService {
  constructor(
    private readonly posts: PostRepository,
    private readonly comments: CommentRepository,
    private readonly reports: ReportRepository,
    private readonly experts: ExpertRepository,
    private readonly users: UserRepository,
    private readonly plants: PlantRecordService,
    private readonly ai: AiProvider,
    private readonly audit: AuditService,
    private readonly transactions: TransactionRunner,
    private readonly journal: JournalRepository,
  ) {}

  async getFeed(
    userId: string,
    district: string | undefined,
    q: PageQuery,
  ): Promise<Page<FeedPost>> {
    const targetDistrict =
      district || (await this.users.findById(userId))?.district;
    const { rows, total } = await this.posts.listVisible(
      targetDistrict,
      toSkipTake(q),
    );
    return toPage(rows, total, q);
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const user = await this.users.findById(userId);
    return this.posts.create({
      content: dto.content,
      plant_id: dto.plant_id,
      is_alert: dto.is_alert ?? false,
      image_urls: dto.image_urls ?? [],
      author_id: userId,
      district: user?.district,
    });
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    return this.comments.create({
      ...dto,
      post_id: postId,
      author_id: userId,
      is_expert_verified: await this.experts.isApprovedExpert(userId),
    });
  }

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

  async askAi(userId: string, dto: AskAiDto) {
    let plantContext = '';
    let speciesFamily: string | null = null;
    if (dto.plant_id) {
      const plant = await this.plants.getOwnedOrThrow(userId, dto.plant_id);
      const recent = await this.journal.recent(userId, plant.id, 5);
      speciesFamily = plant.species_family;
      const recentEvents = recent
        .map(
          (j) => `${j.type.toLowerCase()}${j.content ? `: ${j.content}` : ''}`,
        )
        .join('; ');
      plantContext = `User is asking about their ${plant.species}${
        plant.variety ? ` (${plant.variety})` : ''
      } ${plant.record_kind.toLowerCase()} in ${plant.lifecycle_stage.toLowerCase()} stage.${
        recentEvents ? ` Recent journal: ${recentEvents}` : ''
      }`;
    }

    const knowledge = await this.relevantKnowledge(dto.question, speciesFamily);
    const prompt = `
You are the Bagicha AI plant assistant for Indian gardeners and small orchards.

Plant context:
${plantContext || '(no specific plant context provided)'}

Expert community knowledge (topic-relevant snippets only — may be empty):
${knowledge || '(no relevant verified community knowledge)'}

Question: ${dto.question}

Answer concisely and practically. Cite the community knowledge inline when you use it. If the knowledge base does not address this directly, answer from general horticultural expertise and say so.

Return strict JSON:
{ "answer": string, "citations": string[] }
    `.trim();

    return this.ai.generateJson({ feature: 'ask_ai', prompt });
  }

  /** One report per user per target; the report and its audit row commit together. */
  private recordReport(
    reporterId: string,
    reason: string | undefined,
    target: ReportTarget,
  ) {
    return this.transactions.run(async (tx) => {
      const existing = await this.reports.findByReporter(
        target.type,
        target.id,
        reporterId,
        tx,
      );
      if (!existing) {
        const trimmedReason = reason?.trim() || null;
        await this.reports.create(
          {
            target_type: target.type,
            target_id: target.id,
            reporter_id: reporterId,
            reason: trimmedReason,
          },
          tx,
        );
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

      const count = await this.reports.countPending(target.type, target.id, tx);
      if (count >= HIDE_REPORT_THRESHOLD && !target.isHidden)
        await target.hide(tx);
      return existing
        ? { success: true, already_reported: true }
        : { success: true, pending_reports: count };
    });
  }

  private async relevantKnowledge(
    question: string,
    speciesFamily: string | null,
  ) {
    const keywords = tokenize(question);
    if (keywords.length === 0 && !speciesFamily) return '';

    const candidates = await this.comments.recentVerified(KNOWLEDGE_POOL_SIZE);
    const scored = candidates
      .filter((c) => c.post && !c.post.is_hidden)
      .map((c) => {
        const haystack = `${c.post.content} ${c.content}`.toLowerCase();
        const keywordHits = keywords.reduce(
          (acc, kw) => acc + (haystack.includes(kw) ? 1 : 0),
          0,
        );
        const familyHit =
          speciesFamily && haystack.includes(speciesFamily.toLowerCase())
            ? 2
            : 0;
        return { comment: c, score: keywordHits + familyHit };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_KNOWLEDGE_SNIPPETS);

    return scored
      .map(
        (entry, idx) =>
          `[${idx + 1}] Topic: ${truncate(entry.comment.post.content, 160)}\n    Verified answer: ${truncate(entry.comment.content, 240)}`,
      )
      .join('\n');
  }
}
