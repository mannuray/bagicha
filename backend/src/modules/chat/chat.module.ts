import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessageRepository } from './message.repository';

@Module({
  controllers: [ChatController],
  providers: [ChatService, MessageRepository],
})
export class ChatModule {}
