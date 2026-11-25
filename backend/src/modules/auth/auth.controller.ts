import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RateLimit } from '../../common/rate-limit';
import { JWT_ALLOW_PENDING } from '../../common/auth/allow-pending-deletion';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
    @Ip() callerIp: string,
  ) {
    return this.authService.requestOtp(requestOtpDto.phone_number, callerIp);
  }

  @Post('verify-otp')
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.phone_number,
      verifyOtpDto.otp,
    );
  }

  /** Signs out everywhere (every device's token stops working); open to accounts waiting to be deleted. */
  @Post('sign-out')
  @UseGuards(AuthGuard(JWT_ALLOW_PENDING))
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@Request() req: AuthedRequest): Promise<void> {
    await this.authService.signOut(req.user.id);
  }
}
