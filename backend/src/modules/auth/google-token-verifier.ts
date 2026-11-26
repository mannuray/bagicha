import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import {
  ServiceUnavailableError,
  UnauthorizedError,
} from '../../common/errors';

/** Who Google says signed in. `sub` is the account's permanent id; email can change. */
export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/** Checks a Google ID token. Behind an interface so tests never call Google. */
export abstract class GoogleTokenVerifier {
  abstract verify(idToken: string): Promise<GoogleIdentity>;
}

const invalid = () =>
  new UnauthorizedError('AUTH_GOOGLE_INVALID', 'Google sign-in failed');

/**
 * Verifies signature, issuer, expiry and audience with Google's library. The
 * audience is the web OAuth client id: the Android app asks Credential Manager
 * for a token for that same client, so one id covers both platforms.
 */
export class GoogleAuthLibraryVerifier extends GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  constructor(private readonly clientId: string | undefined) {
    super();
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (!this.clientId) {
      throw new ServiceUnavailableError(
        'AUTH_GOOGLE_NOT_CONFIGURED',
        'Google sign-in is not set up yet',
      );
    }
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw invalid();
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw invalid();
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  }
}
