import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { AuditAction, AuditService } from '../audit';
import { toUserView, UserRepository, type UserView } from '../user';
import { GoogleAvatarImporter } from './google-avatar';
import {
  GoogleTokenVerifier,
  type GoogleIdentity,
} from './google-token-verifier';

type Arrival = { user: User; isNewUser: boolean; claimedExisting: boolean };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly google: GoogleTokenVerifier,
    private readonly avatars: GoogleAvatarImporter,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Signs in with a Google ID token: the account with this Google id, else the
   * one older account waiting to be claimed by this verified email, else a new
   * account named and pictured from Google.
   */
  async signInWithGoogle(
    idToken: string,
  ): Promise<{ access_token: string; user: UserView }> {
    const identity = await this.google.verify(idToken);
    const { user, isNewUser, claimedExisting } = await this.arrive(identity);

    await this.audit.record({
      actorUserId: user.id,
      action: AuditAction.AUTH_SIGNED_IN,
      targetType: 'user',
      targetId: user.id,
      snapshot: {
        user_id: user.id,
        is_new_user: isNewUser,
        claimed_existing: claimedExisting,
      },
    });

    // Only the user id and its sign-out version: a token is readable by anyone who holds it.
    const access_token = this.jwtService.sign({
      sub: user.id,
      tv: user.token_version,
    });
    return { access_token, user: toUserView(user) };
  }

  private async arrive(identity: GoogleIdentity): Promise<Arrival> {
    const known = await this.users.findByGoogleSub(identity.sub);
    if (known) {
      const user = await this.users.updateEmail(known.id, identity.email);
      return { user, isNewUser: false, claimedExisting: false };
    }
    const claimed = await this.users.claimByEmail(identity.sub, identity.email);
    if (claimed)
      return { user: claimed, isNewUser: false, claimedExisting: true };

    const { user, created } = await this.users.createFromGoogle(identity);
    if (!created || !identity.picture) {
      return { user, isNewUser: created, claimedExisting: false };
    }
    const key = await this.avatars.importFrom(user.id, identity.picture);
    const withPhoto = key ? await this.users.setAvatarKey(user.id, key) : user;
    return { user: withPhoto, isNewUser: true, claimedExisting: false };
  }

  /** Ends every sign-in of this user (all devices): their tokens' version is now stale. */
  async signOut(userId: string): Promise<void> {
    await this.users.bumpTokenVersion(userId);
    await this.audit.record({
      actorUserId: userId,
      action: AuditAction.AUTH_SIGNED_OUT,
      targetType: 'user',
      targetId: userId,
      snapshot: { user_id: userId },
    });
  }
}
