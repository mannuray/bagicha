import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Get('inbox')
  async getInbox(@Request() req) {
    return this.chatService.getInbox(req.user.id);
  }

  @Get('messages/:userId')
  async getMessages(@Request() req, @Param('userId') otherUserId: string) {
    return this.chatService.getMessages(req.user.id, otherUserId);
  }
}
