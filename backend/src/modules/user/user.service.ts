import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, {
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
      region_cluster: dto.region_cluster,
      garden_types: dto.garden_types ?? undefined,
      language_pref: dto.language_pref ?? undefined,
    });
  }
}
