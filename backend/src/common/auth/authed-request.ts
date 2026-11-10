import { User } from '@prisma/client';

/** The request behind AuthGuard('jwt'): JwtStrategy.validate attaches the user row. */
export interface AuthedRequest {
  user: User;
}
