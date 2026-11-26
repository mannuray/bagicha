import { Injectable } from '@nestjs/common';
import type { ReminderSlot } from '@prisma/client';
import { isUniqueViolation } from '../../common/prisma/unique-violation';
import { PrismaService } from '../../prisma/prisma.service';

/** Which reminder slots were handled for whom on which IST date: the guard against a double send. */
@Injectable()
export class ReminderSendsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** True if this run may handle the slot; false if it was already handled today. */
  async claim(
    userId: string,
    slot: ReminderSlot,
    istDate: string,
  ): Promise<boolean> {
    try {
      await this.prisma.reminderSend.create({
        data: { user_id: userId, slot, ist_date: istDate },
      });
      return true;
    } catch (err) {
      if (isUniqueViolation(err)) return false;
      throw err;
    }
  }

  /** Gives a slot back so a retry can send it (nothing reached any phone). */
  async release(
    userId: string,
    slot: ReminderSlot,
    istDate: string,
  ): Promise<void> {
    await this.prisma.reminderSend.deleteMany({
      where: { user_id: userId, slot, ist_date: istDate },
    });
  }

  async pruneBefore(date: Date): Promise<number> {
    const { count } = await this.prisma.reminderSend.deleteMany({
      where: { created_at: { lt: date } },
    });
    return count;
  }
}
