import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { AuthService } from './auth.service';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { RateLimit } from '../../common/rate-limit';
import { JWT_ALLOW_PENDING } from '../../common/auth/allow-pending-deletion';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Signs in (or up) with a Google ID token; returns our own session token and the user. */
  @Post('google')
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleSignInDto) {
    return this.authService.signInWithGoogle(dto.id_token);
  }

  /** Signs out everywhere (every device's token stops working); open to accounts waiting to be deleted. */
  @Post('sign-out')
  @UseGuards(AuthGuard(JWT_ALLOW_PENDING))
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@Request() req: AuthedRequest): Promise<void> {
    await this.authService.signOut(req.user.id);
  }
}
