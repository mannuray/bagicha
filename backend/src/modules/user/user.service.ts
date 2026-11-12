import { Injectable } from '@nestjs/common';
import { ValidationError } from '../../common/errors';
import { parseMediaKey } from '../media';
import { UserRepository } from './user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toUserView, type UserView } from './user-view';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserView> {
    if (dto.avatar_key) assertOwnAvatar(userId, dto.avatar_key);
    const user = await this.users.updateProfile(userId, {
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
      region_cluster: dto.region_cluster,
      garden_types: dto.garden_types ?? undefined,
      language_pref: dto.language_pref ?? undefined,
      avatar_key: dto.avatar_key,
    });
    return toUserView(user);
  }
}

/** A profile photo must be an avatar image this user uploaded. */
function assertOwnAvatar(userId: string, key: string): void {
  const parsed = parseMediaKey(key);
  if (parsed?.kind !== 'avatar' || parsed.ownerId !== userId) {
    throw new ValidationError(
      'AVATAR_KEY_INVALID',
      'avatar_key must be your own avatar upload',
    );
  }
}
