import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { ReportTargetDto } from './dto/report-target.dto';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit } from '../../common/rate-limit';

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  getFeed(@Request() req: { user: { id: string } }, @Query() q: FeedQueryDto) {
    return this.communityService.getFeed(req.user.id, q.district, q);
  }

  @Post('posts')
  async createPost(@Request() req, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.id, dto);
  }

  @Post('posts/:id/comments')
  async addComment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.addComment(req.user.id, id, dto);
  }

  @Post('ask-ai')
  @RateLimit('ai')
  async askAi(@Request() req, @Body() dto: AskAiDto) {
    return this.communityService.askAi(req.user.id, dto);
  }

  @Post('posts/:id/report')
  async reportPost(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReportTargetDto,
  ) {
    return this.communityService.reportPost(req.user.id, id, dto);
  }

  @Post('comments/:id/report')
  async reportComment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReportTargetDto,
  ) {
    return this.communityService.reportComment(req.user.id, id, dto);
  }
}
