import type { User } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { UnauthorizedError } from '../../../common/errors';
import type { UserRepository } from '../../user';

export interface TokenPayload {
  sub: string;
  tv?: number;
}

export function jwtOptions(
  config: ConfigService,
): StrategyOptionsWithoutRequest {
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    // One algorithm only: a token signed any other way is refused.
    algorithms: ['HS256'],
    secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
  };
}

/** The token's user, if it still exists and the token wasn't signed out. */
export async function userForToken(
  users: UserRepository,
  payload: TokenPayload,
): Promise<User> {
  const user = await users.findById(payload.sub);
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
