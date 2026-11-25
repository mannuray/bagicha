import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ForbiddenError } from '../../../common/errors';
import { UserRepository } from '../../user';
import { jwtOptions, userForToken, type TokenPayload } from './token-user';

/** The default guard: a signed-in user whose account isn't waiting to be deleted. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
  ) {
    super(jwtOptions(config));
  }

  async validate(payload: TokenPayload) {
    const user = await userForToken(this.users, payload);
    if (user.deletion_due_at) {
      throw new ForbiddenError(
        'ACCOUNT_DELETION_PENDING',
        'This account is waiting to be deleted; keep it to continue',
      );
    }
    return user;
  }
}
