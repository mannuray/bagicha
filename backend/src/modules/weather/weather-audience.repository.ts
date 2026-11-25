import { Injectable } from '@nestjs/common';
import type { Plant, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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
      where: { plants: { some: living } },
      orderBy: { id: 'asc' },
      take: size,
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
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
