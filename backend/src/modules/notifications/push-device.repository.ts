import { Injectable } from '@nestjs/common';
import type { PushPlatform } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The phones that receive reminders. Tokens are never logged. */
@Injectable()
export class PushDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Records a phone for the user; a token seen before moves to them (a shared phone). */
  async upsert(
    userId: string,
    token: string,
    platform: PushPlatform,
    now: Date,
  ): Promise<void> {
    await this.prisma.pushDevice.upsert({
      where: { token },
      create: { user_id: userId, token, platform, last_seen_at: now },
      update: { user_id: userId, platform, last_seen_at: now },
    });
  }

  /** Forgets one phone, only if it is the user's. */
  async removeOwn(userId: string, token: string): Promise<void> {
    await this.prisma.pushDevice.deleteMany({
      where: { user_id: userId, token },
    });
  }

  /** Tokens FCM no longer accepts. */
  async removeTokens(tokens: string[]): Promise<number> {
    if (tokens.length === 0) return 0;
    const { count } = await this.prisma.pushDevice.deleteMany({
      where: { token: { in: tokens } },
    });
    return count;
  }

  /** Phones that stopped registering (the app was uninstalled or never opened). */
  async removeStale(before: Date): Promise<number> {
    const { count } = await this.prisma.pushDevice.deleteMany({
      where: { last_seen_at: { lt: before } },
    });
    return count;
  }

  /** Each user's tokens. */
  async tokensFor(userIds: string[]): Promise<Map<string, string[]>> {
    const rows = await this.prisma.pushDevice.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, token: true },
    });
    const out = new Map<string, string[]>();
    for (const r of rows)
      out.set(r.user_id, [...(out.get(r.user_id) ?? []), r.token]);
    return out;
  }
}
