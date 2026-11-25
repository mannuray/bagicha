import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JWT_ALLOW_PENDING } from '../../../common/auth/allow-pending-deletion';
import { UserRepository } from '../../user';
import { jwtOptions, userForToken, type TokenPayload } from './token-user';

/** Like the default guard, but also admits an account waiting to be deleted. */
@Injectable()
export class JwtAllowPendingStrategy extends PassportStrategy(
  Strategy,
  JWT_ALLOW_PENDING,
) {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
  ) {
    super(jwtOptions(config));
  }

  validate(payload: TokenPayload) {
    return userForToken(this.users, payload);
  }
}
