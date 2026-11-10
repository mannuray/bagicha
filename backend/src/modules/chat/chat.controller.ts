import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../common/pagination';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  sendMessage(@Request() req: AuthedRequest, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Get('inbox')
  getInbox(@Request() req: AuthedRequest, @Query() q: PaginationQueryDto) {
    return this.chatService.getInbox(req.user.id, q);
  }

  @Get('messages/:userId')
  getMessages(
    @Request() req: AuthedRequest,
    @Param('userId') otherUserId: string,
    @Query() q: PaginationQueryDto,
  ) {
    return this.chatService.getMessages(req.user.id, otherUserId, q);
  }
}
