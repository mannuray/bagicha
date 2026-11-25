import { Injectable } from '@nestjs/common';
import type { Plant, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_ACCOUNT } from '../user';

export type AudienceUser = Pick<
  User,
  'id' | 'latitude' | 'longitude' | 'district' | 'region_cluster'
> & {
  plants: Array<
    Pick<Plant, 'id' | 'record_kind' | 'lifecycle_stage' | 'crop_stage'>
  >;
};

/** Gardeners with at least one plant that hasn't ended: who the daily weather run looks at. */
@Injectable()
export class WeatherAudienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The next `size` such users after `after` (by id), with their living plants. */
  batch(after: string | null, size: number): Promise<AudienceUser[]> {
    const living = { ended_at: null };
    return this.prisma.user.findMany({
      // id > last seen, not a Prisma cursor: a cursor row that leaves the filter
      // mid-run (account deleted, last plant ended) would end or shift the run.
      where: {
        ...(after ? { id: { gt: after } } : {}),
        plants: { some: living },
        ...ACTIVE_ACCOUNT,
      },
      orderBy: { id: 'asc' },
      take: size,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        district: true,
        region_cluster: true,
        plants: {
          where: living,
          select: {
            id: true,
            record_kind: true,
            lifecycle_stage: true,
            crop_stage: true,
          },
        },
      },
    });
  }
}
