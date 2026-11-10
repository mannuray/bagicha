import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditService } from '../audit';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user';
import { RedisService } from '../../common/redis/redis.service';
import { randomInt } from 'crypto';

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

  async requestOtp(phoneNumber: string): Promise<string> {
    const otp = randomInt(100000, 1000000).toString();

    await this.redisService.set(`otp:${phoneNumber}`, otp, OTP_TTL_SECONDS);
    await this.redisService.del(`otp_fail:${phoneNumber}`);

    // No SMS provider yet: surface the code locally, never in production.
    if (!this.isProduction()) {
      this.logger.debug({ otp }, 'Development OTP issued');
    }

    return 'OTP sent successfully';
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const storedOtp = await this.redisService.get(`otp:${phoneNumber}`);

    const isMockUser = this.isDevOtp(phoneNumber, otp);

    if (!isMockUser && (!storedOtp || storedOtp !== otp)) {
      // Per-phone guess limit (IP rate limits alone don't stop a distributed brute force).
      const failures = await this.redisService.incrWithTtl(
        `otp_fail:${phoneNumber}`,
        OTP_TTL_SECONDS,
      );
      if (failures >= MAX_OTP_FAILURES) {
        await this.redisService.del(`otp:${phoneNumber}`);
      }
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_OTP',
        message: 'Invalid or expired OTP',
      });
    }

    if (!isMockUser) {
      await this.redisService.del(`otp:${phoneNumber}`);
      await this.redisService.del(`otp_fail:${phoneNumber}`);
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

    const payload = { sub: user.id, phoneNumber: user.phone_number };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user,
    };
  }
}
