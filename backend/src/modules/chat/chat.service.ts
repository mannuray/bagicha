import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../common/errors';
import { PageQuery, toPage, toSkipTake } from '../../common/pagination';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageRepository } from './message.repository';

@Injectable()
export class ChatService {
  constructor(private readonly messages: MessageRepository) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    if (!(await this.messages.userExists(dto.receiver_id))) {
      throw new NotFoundError('RECEIVER_NOT_FOUND', 'Receiver not found');
    }
    return this.messages.create({ ...dto, sender_id: userId });
  }

  async getInbox(userId: string, q: PageQuery) {
    const { rows, total } = await this.messages.inbox(userId, toSkipTake(q));
    return toPage(rows, total, q);
  }

  async getMessages(userId: string, otherUserId: string, q: PageQuery) {
    const { rows, total } = await this.messages.conversation(
      userId,
      otherUserId,
      toSkipTake(q),
    );
    return toPage(rows, total, q);
  }
}
