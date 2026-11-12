import { Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../common/errors';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private users: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; tv?: number }) {
    const user = await this.users.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError(
        'AUTH_USER_NOT_FOUND',
        'The user associated with this token no longer exists',
      );
    }
    // Tokens from before sign-out existed carry no version: they count as 0.
    if ((payload.tv ?? 0) !== user.token_version) {
      throw new UnauthorizedError(
        'AUTH_TOKEN_REVOKED',
        'This sign-in has ended; please sign in again',
      );
    }

    return user;
  }
}
