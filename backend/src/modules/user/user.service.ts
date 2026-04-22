import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        district: dto.district,
        garden_types: dto.garden_types ?? undefined,
        language_pref: dto.language_pref ?? undefined,
      },
    });
  }
}
