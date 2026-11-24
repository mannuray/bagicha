import type { AuthedRequest } from '../../common/auth/authed-request';
import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** The profile is one resource: PATCH user/profile. */
  @Patch('profile')
  async updateProfile(
    @Request() req: AuthedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }
}
