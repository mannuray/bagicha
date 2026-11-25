import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_ALLOW_PENDING } from '../../common/auth/allow-pending-deletion';
import { AccountDeletionService } from './account-deletion.service';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly deletion: AccountDeletionService,
  ) {}

  /** The profile is one resource: PATCH user/profile. */
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Request() req: AuthedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  /** Asks to delete the account: erased 30 days from now, signed out everywhere. */
  @Post('deletion')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  requestDeletion(@Request() req: AuthedRequest) {
    return this.deletion.request(req.user.id);
  }

  /** Keeps the account during the notice period (204, like every DELETE). */
  @Delete('deletion')
  @UseGuards(AuthGuard(JWT_ALLOW_PENDING))
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelDeletion(@Request() req: AuthedRequest): Promise<void> {
    await this.deletion.cancel(req.user.id);
  }
}
