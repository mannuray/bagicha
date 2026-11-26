import { Injectable } from '@nestjs/common';
import type { ReminderSlot, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_ACCOUNT } from '../user';

export type ReminderUser = Pick<
  User,
  'id' | 'language_pref' | 'region_cluster' | 'district'
>;

const COLUMN = {
  MORNING: 'reminder_morning_min',
  EVENING: 'reminder_evening_min',
} as const;

/** Gardeners whose reminder for a slot is set to a given minute and who have a phone to send it to. */
@Injectable()
export class ReminderAudienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The next `size` such users after `after` (by id). */
  batch(
    slot: ReminderSlot,
    minute: number,
    after: string | null,
    size: number,
  ): Promise<ReminderUser[]> {
    return this.prisma.user.findMany({
      where: {
        [COLUMN[slot]]: minute,
        ...(after ? { id: { gt: after } } : {}),
        push_devices: { some: {} },
        ...ACTIVE_ACCOUNT,
      },
      orderBy: { id: 'asc' },
      take: size,
      select: {
        id: true,
        language_pref: true,
        region_cluster: true,
        district: true,
      },
    });
  }
}
