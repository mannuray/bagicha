import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { randomInt, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
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

    // Store OTP in Redis for 5 minutes
    await this.redisService.set(`otp:${phoneNumber}`, otp, 300);

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
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_OTP',
        message: 'Invalid or expired OTP',
      });
    }

    // Clear OTP from Redis
    if (!isMockUser) {
      await this.redisService.del(`otp:${phoneNumber}`);
    }

    // Register or find user
    let user = await this.prisma.user.findUnique({
      where: { phone_number: phoneNumber },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone_number: phoneNumber,
          id: randomUUID(),
        },
      });
    }

    const payload = { sub: user.id, phoneNumber: user.phone_number };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user,
    };
  }
}
