import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(phoneNumber: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis for 5 minutes
    await this.redisService.set(`otp:${phoneNumber}`, otp, 300);
    
    // Log OTP for development (later integrate with SMS provider)
    console.log(`[AUTH] OTP for ${phoneNumber}: ${otp}`);
    
    return 'OTP sent successfully';
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const storedOtp = await this.redisService.get(`otp:${phoneNumber}`);
    
    // BACKDOOR for testing with mock data
    const isMockUser = phoneNumber === '+916202042225' && otp === '123456';

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
          id: uuidv4(),
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
