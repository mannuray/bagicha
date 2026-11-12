import { Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../common/errors';
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
    if (await this.messages.hasBlocked(dto.receiver_id, userId)) {
      throw new ForbiddenError(
        'CHAT_BLOCKED',
        'This gardener is not accepting your messages',
      );
    }
    return this.messages.create({ ...dto, sender_id: userId });
  }

  async block(userId: string, otherUserId: string): Promise<void> {
    if (otherUserId === userId) {
      throw new ValidationError('CHAT_BLOCK_SELF', 'You cannot block yourself');
    }
    if (!(await this.messages.userExists(otherUserId))) {
      throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    }
    await this.messages.block(userId, otherUserId);
  }

  unblock(userId: string, otherUserId: string): Promise<void> {
    return this.messages.unblock(userId, otherUserId);
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
