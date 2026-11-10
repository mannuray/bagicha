import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { ReportTargetDto } from './dto/report-target.dto';
import { GeminiService } from '../vision/services/gemini.service';

const HIDE_REPORT_THRESHOLD = 3;
const MAX_KNOWLEDGE_SNIPPETS = 3;
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

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  async getFeed(userId: string, district?: string, page = 1, pageSize = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const targetDistrict = district || user?.district;

    const where = {
      is_hidden: false,
      ...(targetDistrict ? { district: targetDistrict } : {}),
    };

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, badge_level: true },
        },
        _count: {
          select: { comments: { where: { is_hidden: false } } },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalItems = await this.prisma.post.count({ where });

    return {
      items: posts,
      pagination: {
        page,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / pageSize),
        has_next: page * pageSize < totalItems,
        has_previous: page > 1,
      },
    };
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.prisma.post.create({
      data: {
        content: dto.content,
        plant_id: dto.plant_id,
        is_alert: dto.is_alert ?? false,
        image_urls: dto.image_urls ?? [],
        author_id: userId,
        district: user?.district,
      },
    });
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const expert = await this.prisma.expertVerification.findUnique({
      where: { user_id: userId },
    });

    return this.prisma.comment.create({
      data: {
        ...dto,
        post_id: postId,
        author_id: userId,
        is_expert_verified: expert?.status === 'APPROVED',
      },
    });
  }

  async reportPost(userId: string, postId: string, dto: ReportTargetDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} not found`);

    return this.recordReport(
      ReportTargetType.POST,
      postId,
      userId,
      dto.reason,
      async (count) => {
        if (count >= HIDE_REPORT_THRESHOLD && !post.is_hidden) {
          await this.prisma.post.update({
            where: { id: postId },
            data: { is_hidden: true },
          });
        }
      },
    );
  }

  async reportComment(userId: string, commentId: string, dto: ReportTargetDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    return this.recordReport(
      ReportTargetType.COMMENT,
      commentId,
      userId,
      dto.reason,
      async (count) => {
        if (count >= HIDE_REPORT_THRESHOLD && !comment.is_hidden) {
          await this.prisma.comment.update({
            where: { id: commentId },
            data: { is_hidden: true },
          });
        }
      },
    );
  }

  async askAi(userId: string, dto: AskAiDto) {
    // 1. Fetch the user's plant context if requested.
    let plantContext = '';
    let plantSpeciesFamily: string | null = null;
    if (dto.plant_id) {
      const plant = await this.prisma.plant.findFirst({
        where: { id: dto.plant_id, user_id: userId },
        include: {
          journal_entries: { take: 5, orderBy: { timestamp: 'desc' } },
        },
      });
      if (!plant) throw new NotFoundException('Plant not found');
      {
        plantSpeciesFamily = plant.species_family;
        const recentEvents = plant.journal_entries
          .map(
            (j) =>
              `${j.type.toLowerCase()}${j.content ? `: ${j.content}` : ''}`,
          )
          .join('; ');
        plantContext = `User is asking about their ${plant.species}${
          plant.variety ? ` (${plant.variety})` : ''
        } ${plant.record_kind.toLowerCase()} in ${plant.lifecycle_stage.toLowerCase()} stage.${
          recentEvents ? ` Recent journal: ${recentEvents}` : ''
        }`;
      }
    }

    // 2. Pull expert-verified comments scoped to the topic.
    const knowledgeBase = await this.fetchRelevantKnowledge(
      dto.question,
      plantSpeciesFamily,
    );

    // 3. Build prompt and call Gemini.
    const prompt = `
You are the Bagicha AI plant assistant for Indian gardeners and small orchards.

Plant context:
${plantContext || '(no specific plant context provided)'}

Expert community knowledge (topic-relevant snippets only — may be empty):
${knowledgeBase || '(no relevant verified community knowledge)'}

Question: ${dto.question}

Answer concisely and practically. Cite the community knowledge inline when you use it. If the knowledge base does not address this directly, answer from general horticultural expertise and say so.

Return strict JSON:
{ "answer": string, "citations": string[] }
    `.trim();

    const response = await this.geminiService.generateText(prompt);
    return this.geminiService.parseJsonResponse(response);
  }

  // --- helpers ---

  private async recordReport(
    type: ReportTargetType,
    targetId: string,
    reporterId: string,
    reason: string | undefined,
    onCount: (count: number) => Promise<void>,
  ) {
    const existing = await this.prisma.report.findFirst({
      where: {
        target_type: type,
        target_id: targetId,
        reporter_id: reporterId,
      },
    });
    if (existing) {
      // Idempotent: a user can only report a target once. Keep their first reason.
      const count = await this.prisma.report.count({
        where: { target_type: type, target_id: targetId, status: 'PENDING' },
      });
      await onCount(count);
      return { success: true, already_reported: true };
    }

    await this.prisma.report.create({
      data: {
        target_type: type,
        target_id: targetId,
        reporter_id: reporterId,
        reason: reason?.trim() || null,
      },
    });
    const count = await this.prisma.report.count({
      where: { target_type: type, target_id: targetId, status: 'PENDING' },
    });
    await onCount(count);

    return { success: true, pending_reports: count };
  }

  private async fetchRelevantKnowledge(
    question: string,
    speciesFamily: string | null,
  ): Promise<string> {
    const keywords = this.tokenize(question);
    if (keywords.length === 0 && !speciesFamily) {
      return '';
    }

    // Pull a small candidate pool of expert-verified comments and their parent posts.
    const candidates = await this.prisma.comment.findMany({
      where: {
        is_expert_verified: true,
        is_hidden: false,
      },
      include: {
        post: {
          select: { id: true, content: true, is_hidden: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

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

    if (scored.length === 0) return '';

    return scored
      .map(
        (entry, idx) =>
          `[${idx + 1}] Topic: ${this.truncate(entry.comment.post.content, 160)}\n    Verified answer: ${this.truncate(entry.comment.content, 240)}`,
      )
      .join('\n');
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  }

  private truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + '…';
  }
}
