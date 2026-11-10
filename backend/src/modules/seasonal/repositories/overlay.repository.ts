import { Injectable } from '@nestjs/common';
import { PersonalizedOverlay, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

type OverlayData = Omit<
  Prisma.PersonalizedOverlayUncheckedCreateInput,
  'user_id' | 'plant_id' | 'seasonal_pack_id'
>;

/** A user's personalized overlays; every query is filtered by the owner. */
@Injectable()
export class OverlayRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive(
    userId: string,
    plantId: string,
    packId: string,
    now: Date,
  ): Promise<PersonalizedOverlay | null> {
    return this.prisma.personalizedOverlay.findFirst({
      where: {
        user_id: userId,
        plant_id: plantId,
        seasonal_pack_id: packId,
        plant: { user_id: userId },
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async update(
    userId: string,
    overlayId: string,
    data: OverlayData,
  ): Promise<PersonalizedOverlay | null> {
    const { count } = await this.prisma.personalizedOverlay.updateMany({
      where: { id: overlayId, user_id: userId },
      data,
    });
    return count === 0
      ? null
      : this.prisma.personalizedOverlay.findUnique({
          where: { id: overlayId },
        });
  }

  async create(
    userId: string,
    plantId: string,
    packId: string,
    data: OverlayData,
  ): Promise<PersonalizedOverlay | null> {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, user_id: userId },
      select: { id: true },
    });
    if (!plant) return null;
    return this.prisma.personalizedOverlay.create({
      data: {
        ...data,
        user_id: userId,
        plant_id: plantId,
        seasonal_pack_id: packId,
      },
    });
  }
}
