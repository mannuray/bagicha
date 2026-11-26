import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../common/errors';
import { GoogleAuthLibraryVerifier } from './google-token-verifier';

const CLIENT_ID = 'web-client.apps.googleusercontent.com';

function stubGoogle(payload: Record<string, unknown> | Error) {
  return jest
    .spyOn(OAuth2Client.prototype, 'verifyIdToken')
    .mockImplementation((() =>
      payload instanceof Error
        ? Promise.reject(payload)
        : Promise.resolve({ getPayload: () => payload })) as never);
}

async function reasonOf(p: Promise<unknown>): Promise<[string, number]> {
  try {
    await p;
  } catch (e) {
    const err = e as AppError;
    return [err.reason, err.httpStatus];
  }
  throw new Error('expected a rejection');
}

const verified = {
  sub: '1234567890',
  email: 'gardener@example.com',
  email_verified: true,
  name: 'Asha Devi',
  picture: 'https://lh3.googleusercontent.com/a/photo',
};

describe('GoogleAuthLibraryVerifier', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns sub, email, name and picture for a verified token', async () => {
    stubGoogle(verified);
    await expect(
      new GoogleAuthLibraryVerifier(CLIENT_ID).verify('tok'),
    ).resolves.toEqual({
      sub: '1234567890',
      email: 'gardener@example.com',
      name: 'Asha Devi',
      picture: 'https://lh3.googleusercontent.com/a/photo',
    });
  });

  it('gives null name and picture when Google sends none', async () => {
    stubGoogle({ sub: '1', email: 'a@b.c', email_verified: true });
    await expect(
      new GoogleAuthLibraryVerifier(CLIENT_ID).verify('tok'),
    ).resolves.toEqual({ sub: '1', email: 'a@b.c', name: null, picture: null });
  });

  it('refuses a token whose email is not verified', async () => {
    stubGoogle({ ...verified, email_verified: false });
    expect(
      await reasonOf(new GoogleAuthLibraryVerifier(CLIENT_ID).verify('tok')),
    ).toEqual(['AUTH_GOOGLE_INVALID', 401]);
  });

  it('refuses when Google rejects the token', async () => {
    stubGoogle(new Error('Wrong recipient, payload audience != requiredAudience'));
    expect(
      await reasonOf(new GoogleAuthLibraryVerifier(CLIENT_ID).verify('tok')),
    ).toEqual(['AUTH_GOOGLE_INVALID', 401]);
  });

  it('answers not configured without GOOGLE_CLIENT_ID', async () => {
    const spy = stubGoogle(verified);
    expect(
      await reasonOf(new GoogleAuthLibraryVerifier(undefined).verify('tok')),
    ).toEqual(['AUTH_GOOGLE_NOT_CONFIGURED', 503]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('passes GOOGLE_CLIENT_ID as the audience', async () => {
    const spy = stubGoogle(verified);
    await new GoogleAuthLibraryVerifier(CLIENT_ID).verify('tok');
    expect(spy).toHaveBeenCalledWith({ idToken: 'tok', audience: CLIENT_ID });
  });
});
