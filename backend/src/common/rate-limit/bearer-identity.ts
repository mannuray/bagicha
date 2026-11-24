import { JwtService } from '@nestjs/jwt';

/**
 * Who a bearer token belongs to, for rate limiting only: global guards run
 * before the auth guard, so they verify the token themselves (signature,
 * algorithm and expiry; no database). Anything unverifiable is anonymous.
 */
export class BearerIdentity {
  private readonly jwt: JwtService;

  constructor(secret: string) {
    this.jwt = new JwtService({ secret });
  }

  userIdOf(authorization: string | string[] | undefined): string | null {
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    const match = /^Bearer (\S+)$/.exec(header ?? '');
    if (!match) return null;
    try {
      const payload = this.jwt.verify<{ sub?: unknown }>(match[1], {
        algorithms: ['HS256'],
      });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null; // forged, expired or malformed: limited by IP instead
    }
  }
}
