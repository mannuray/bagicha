import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditService } from '../audit';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user';
import { RedisService } from '../../common/redis/redis.service';
import { randomInt } from 'crypto';
import { otpFailKey, otpKey } from './otp-keys';

const OTP_TTL_SECONDS = 300;
/** Wrong guesses allowed per issued OTP before it is burned. */
const MAX_OTP_FAILURES = 5;

@Injectable()
export class AuthService {
  constructor(
    private users: UserRepository,
    private redisService: RedisService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly audit: AuditService,
  ) {}

  private isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  /** Fixed OTP for local mock data; only honoured when configured and not in production. */
  private isDevOtp(phoneNumber: string, otp: string): boolean {
    const phone = this.config.get<string>('AUTH_DEV_OTP_PHONE');
    const code = this.config.get<string>('AUTH_DEV_OTP_CODE');
    if (this.isProduction() || !phone || !code) return false;
    return phoneNumber === phone && otp === code;
  }

  /** Local testing only: hand the OTP to the client so the verify screen can show it. */
  private exposesOtp(): boolean {
    return (
      !this.isProduction() &&
      this.config.get<string>('AUTH_EXPOSE_OTP') === 'true'
    );
  }

  async requestOtp(
    phoneNumber: string,
  ): Promise<{ message: string; dev_otp?: string }> {
    const otp = randomInt(100000, 1000000).toString();

    await this.redisService.set(otpKey(phoneNumber), otp, OTP_TTL_SECONDS);
    await this.redisService.del(otpFailKey(phoneNumber));

    // No SMS provider yet: a developer can opt in to seeing the code in the log
    // (AUTH_LOG_OTP=true), never in production. Staging shows it on screen instead.
    if (!this.isProduction() && this.config.get<string>('AUTH_LOG_OTP') === 'true') {
      this.logger.debug({ otp }, 'Development OTP issued');
    }

    const message = 'OTP sent successfully';
    return this.exposesOtp() ? { message, dev_otp: otp } : { message };
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const storedOtp = await this.redisService.get(otpKey(phoneNumber));

    const isMockUser = this.isDevOtp(phoneNumber, otp);

    if (!isMockUser && (!storedOtp || storedOtp !== otp)) {
      // Per-phone guess limit (IP rate limits alone don't stop a distributed brute force).
      const failures = await this.redisService.incrWithTtl(
        otpFailKey(phoneNumber),
        OTP_TTL_SECONDS,
      );
      if (failures >= MAX_OTP_FAILURES) {
        await this.redisService.del(otpKey(phoneNumber));
      }
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_OTP',
        message: 'Invalid or expired OTP',
      });
    }

    if (!isMockUser) {
      await this.redisService.del(otpKey(phoneNumber));
      await this.redisService.del(otpFailKey(phoneNumber));
    }

    // Register or find user
    const existing = await this.users.findByPhone(phoneNumber);
    const isNewUser = !existing;
    const user = existing ?? (await this.users.createWithPhone(phoneNumber));

    await this.audit.record({
      actorUserId: user.id,
      action: AuditAction.AUTH_SIGNED_IN,
      targetType: 'user',
      targetId: user.id,
      snapshot: {
        user_id: user.id,
        phone_number_last4: user.phone_number.slice(-4),
        is_new_user: isNewUser,
      },
    });

    // Only the user id: a token is readable by anyone who holds it.
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user,
    };
  }
}
