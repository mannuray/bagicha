import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../common/pagination';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { mapPage } from '../../common/pagination';
import { toMessageView } from './message-view';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async sendMessage(
    @Request() req: AuthedRequest,
    @Body() dto: SendMessageDto,
  ) {
    return toMessageView(await this.chatService.sendMessage(req.user.id, dto));
  }

  /** Blocks a user: they can't message you, and their messages are hidden from you. */
  @Post('blocks/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async block(
    @Request() req: AuthedRequest,
    @Param('userId') otherUserId: string,
  ): Promise<void> {
    await this.chatService.block(req.user.id, otherUserId);
  }

  @Delete('blocks/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(
    @Request() req: AuthedRequest,
    @Param('userId') otherUserId: string,
  ): Promise<void> {
    await this.chatService.unblock(req.user.id, otherUserId);
  }

  @Get('inbox')
  async getInbox(
    @Request() req: AuthedRequest,
    @Query() q: PaginationQueryDto,
  ) {
    return mapPage(
      await this.chatService.getInbox(req.user.id, q),
      toMessageView,
    );
  }

  @Get('messages/:userId')
  async getMessages(
    @Request() req: AuthedRequest,
    @Param('userId') otherUserId: string,
    @Query() q: PaginationQueryDto,
  ) {
    return mapPage(
      await this.chatService.getMessages(req.user.id, otherUserId, q),
      toMessageView,
    );
  }
}
