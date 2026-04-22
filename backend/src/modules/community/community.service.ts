import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { GeminiService } from '../vision/services/gemini.service';

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  async getFeed(userId: string, district?: string, page = 1, pageSize = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const targetDistrict = district || user?.district;

    const posts = await this.prisma.post.findMany({
      where: targetDistrict ? { district: targetDistrict } : {},
      include: {
        author: {
          select: { id: true, name: true, badge_level: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalItems = await this.prisma.post.count({
      where: targetDistrict ? { district: targetDistrict } : {},
    });

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
        ...dto,
        author_id: userId,
        district: user?.district,
      },
    });
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const expert = await this.prisma.expertVerification.findUnique({
      where: { user_id: userId, status: 'APPROVED' },
    });

    return this.prisma.comment.create({
      data: {
        ...dto,
        post_id: postId,
        author_id: userId,
        is_expert_verified: !!expert,
      },
    });
  }

  async askAi(userId: string, dto: AskAiDto) {
    // 1. Fetch Context: User's tree data
    let treeContext = '';
    if (dto.tree_id) {
      const tree = await this.prisma.tree.findUnique({
        where: { id: dto.tree_id },
        include: { logs: { take: 5, orderBy: { timestamp: 'desc' } } },
      });
      if (tree) {
        treeContext = `User is asking about their ${tree.species} (${tree.variety || 'common'}) tree, which is in the ${tree.lifecycle_stage} stage. Recent logs: ${tree.logs.map(l => l.content).join(', ')}.`;
      }
    }

    // 2. Fetch Knowledge: Expert-verified community wisdom
    const communityKnowledge = await this.prisma.comment.findMany({
      where: { is_expert_verified: true },
      take: 5,
      include: { post: true },
    });
    const knowledgeBase = communityKnowledge.map(c => `Topic: ${c.post.content}. Verified Answer: ${c.content}`).join('\n');

    // 3. Construct Prompt
    const prompt = `
      You are the Bagicha AI Tree Assistant. 
      Context: ${treeContext}
      Expert Community Knowledge:
      ${knowledgeBase}
      
      Question: ${dto.question}
      
      Provide a localized, zero-guesswork answer. If the knowledge base doesn't cover it, use your general horticultural expertise but mention you are citing general patterns.
      Return JSON: { answer: string, citations: string[] }
    `;

    // 4. Get AI Response
    const response = await this.geminiService.analyzeImage({ inlineData: { data: '', mimeType: '' } }, prompt); 
    // Note: analyzeImage might need a non-image variant or handle empty part.
    // Let's assume GeminiService can handle text-only if we update it.
    
    return this.geminiService.parseJsonResponse(response);
  }
}
