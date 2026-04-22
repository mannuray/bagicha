import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  async getFeed(
    @Request() req,
    @Query('district') district?: string,
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
  ) {
    return this.communityService.getFeed(req.user.id, district, Number(page), Number(pageSize));
  }

  @Post('posts')
  async createPost(@Request() req, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.id, dto);
  }

  @Post('posts/:id/comments')
  async addComment(@Request() req, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.communityService.addComment(req.user.id, id, dto);
  }

  @Post('ask-ai')
  async askAi(@Request() req, @Body() dto: AskAiDto) {
    return this.communityService.askAi(req.user.id, dto);
  }
}
