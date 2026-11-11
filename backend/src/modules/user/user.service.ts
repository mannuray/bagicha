import { BadRequestException, Injectable } from '@nestjs/common';
import { parseMediaKey } from '../media';
import { UserRepository } from './user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.avatar_key) assertOwnAvatar(userId, dto.avatar_key);
    return this.users.updateProfile(userId, {
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
      region_cluster: dto.region_cluster,
      garden_types: dto.garden_types ?? undefined,
      language_pref: dto.language_pref ?? undefined,
      avatar_key: dto.avatar_key,
    });
  }
}

/** A profile photo must be an avatar image this user uploaded. */
function assertOwnAvatar(userId: string, key: string): void {
  const parsed = parseMediaKey(key);
  if (parsed?.kind !== 'avatar' || parsed.ownerId !== userId) {
    throw new BadRequestException('avatar_key must be your own avatar upload');
  }
}
