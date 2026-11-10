import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiver_id },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    return this.prisma.message.create({
      data: {
        ...dto,
        sender_id: userId,
      },
    });
  }

  async getInbox(userId: string) {
    // Fetches the last message from each conversation
    // This is a simplified version for the MVP
    return this.prisma.message.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      orderBy: { created_at: 'desc' },
      distinct: ['sender_id', 'receiver_id'], // This might need more complex logic for true inbox
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });
  }

  async getMessages(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId },
        ],
      },
      orderBy: { created_at: 'asc' },
    });
  }
}
