import { UnauthorizedError } from '../../src/common/errors';
import {
  GoogleTokenVerifier,
  type GoogleIdentity,
} from '../../src/modules/auth/google-token-verifier';

/**
 * Stands in for Google in e2e tests (in-process only; nothing like it ships).
 * A token is `fake:<sub>:<email>`; anything else is refused like a bad token.
 */
export class FakeGoogleVerifier extends GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleIdentity> {
    const [scheme, sub, email] = idToken.split(':');
    if (scheme !== 'fake' || !sub || !email) {
      return Promise.reject(
        new UnauthorizedError('AUTH_GOOGLE_INVALID', 'Google sign-in failed'),
      );
    }
    return Promise.resolve({
      sub,
      email,
      name: 'Fake Gardener',
      picture: null,
    });
  }
}

export const fakeGoogleToken = (sub: string, email: string) =>
  `fake:${sub}:${email}`;
