import { JwtService } from '@nestjs/jwt';
import { BearerIdentity } from './bearer-identity';

const SECRET = 'test-secret';
const jwt = new JwtService({ secret: SECRET });
const identity = new BearerIdentity(SECRET);
const bearer = (token: string) => `Bearer ${token}`;

describe('BearerIdentity', () => {
  it('reads the user id from a valid HS256 token', () => {
    expect(identity.userIdOf(bearer(jwt.sign({ sub: 'u1' })))).toBe('u1');
  });

  it('ignores a token signed with another secret (a forged sub)', () => {
    const forged = new JwtService({ secret: 'other' }).sign({ sub: 'victim' });
    expect(identity.userIdOf(bearer(forged))).toBeNull();
  });

  it('ignores an expired token', () => {
    const expired = jwt.sign({ sub: 'u1' }, { expiresIn: -10 });
    expect(identity.userIdOf(bearer(expired))).toBeNull();
  });

  it('ignores another algorithm and non-bearer headers', () => {
    expect(
      identity.userIdOf(
        bearer(jwt.sign({ sub: 'u1' }, { algorithm: 'HS512' })),
      ),
    ).toBeNull();
    expect(identity.userIdOf(undefined)).toBeNull();
    expect(identity.userIdOf('Basic abc')).toBeNull();
    expect(identity.userIdOf(bearer('junk'))).toBeNull();
  });
});
