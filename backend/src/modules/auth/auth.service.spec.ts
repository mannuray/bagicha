import { AuditAction } from '../audit';
import { AuthService } from './auth.service';
import type { GoogleIdentity } from './google-token-verifier';

const IDENTITY: GoogleIdentity = {
  sub: 'google-sub-1',
  email: 'asha@example.com',
  name: 'Asha Devi',
  picture: 'https://lh3.googleusercontent.com/a/photo',
};

const userRow = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  google_sub: 'google-sub-1',
  email: 'asha@example.com',
  name: 'Asha Devi',
  avatar_key: null,
  token_version: 3,
  garden_types: [],
  ...over,
});

function build(
  opts: {
    bySub?: ReturnType<typeof userRow> | null;
    claimed?: ReturnType<typeof userRow> | null;
    created?: ReturnType<typeof userRow>;
    createdIsNew?: boolean;
    avatarKey?: string | null;
    identity?: GoogleIdentity;
  } = {},
) {
  const users = {
    findByGoogleSub: jest.fn(() => Promise.resolve(opts.bySub ?? null)),
    claimByEmail: jest.fn(() => Promise.resolve(opts.claimed ?? null)),
    createFromGoogle: jest.fn(() =>
      Promise.resolve({
        user: opts.created ?? userRow(),
        created: opts.createdIsNew ?? true,
      }),
    ),
    updateEmail: jest.fn((id: string, email: string) =>
      Promise.resolve(userRow({ id, email })),
    ),
    setAvatarKey: jest.fn((id: string, key: string) =>
      Promise.resolve(userRow({ id, avatar_key: key })),
    ),
  };
  const verifier = {
    verify: jest.fn(() => Promise.resolve(opts.identity ?? IDENTITY)),
  };
  const avatars = {
    importFrom: jest.fn(() =>
      Promise.resolve(
        opts.avatarKey === undefined ? 'avatars/u1/x.jpg' : opts.avatarKey,
      ),
    ),
  };
  const jwt = { sign: jest.fn(() => 'token') };
  const audit = { record: jest.fn(() => Promise.resolve()) };
  const service = new AuthService(
    users as never,
    verifier as never,
    avatars as never,
    jwt as never,
    audit as never,
  );
  return { service, users, verifier, avatars, jwt, audit };
}

describe('AuthService.signInWithGoogle', () => {
  it('signs in an existing Google account and refreshes its email', async () => {
    const t = build({
      bySub: userRow({ email: 'old@example.com' }),
      identity: { ...IDENTITY, email: 'new@example.com' },
    });
    const res = await t.service.signInWithGoogle('tok');
    expect(t.verifier.verify).toHaveBeenCalledWith('tok');
    expect(t.users.updateEmail).toHaveBeenCalledWith('u1', 'new@example.com');
    expect(t.users.createFromGoogle).not.toHaveBeenCalled();
    expect(t.avatars.importFrom).not.toHaveBeenCalled();
    expect(res).toEqual({
      access_token: 'token',
      user: expect.objectContaining({ id: 'u1', email: 'new@example.com' }),
    });
  });

  it('claims the one unclaimed account with the same email, keeping its name and photo', async () => {
    const t = build({
      claimed: userRow({
        id: 'old',
        name: 'Mannu',
        avatar_key: 'avatars/old/a.jpg',
      }),
    });
    const res = await t.service.signInWithGoogle('tok');
    expect(t.users.claimByEmail).toHaveBeenCalledWith(
      'google-sub-1',
      'asha@example.com',
    );
    expect(t.users.createFromGoogle).not.toHaveBeenCalled();
    expect(t.avatars.importFrom).not.toHaveBeenCalled();
    expect(res.user).toEqual(
      expect.objectContaining({
        id: 'old',
        name: 'Mannu',
        avatar_key: 'avatars/old/a.jpg',
      }),
    );
  });

  it('creates an account with the Google name and photo when nothing matches', async () => {
    const t = build({ created: userRow({ id: 'new', avatar_key: null }) });
    const res = await t.service.signInWithGoogle('tok');
    expect(t.users.createFromGoogle).toHaveBeenCalledWith(IDENTITY);
    expect(t.avatars.importFrom).toHaveBeenCalledWith(
      'new',
      'https://lh3.googleusercontent.com/a/photo',
    );
    expect(t.users.setAvatarKey).toHaveBeenCalledWith(
      'new',
      'avatars/u1/x.jpg',
    );
    expect(res.user.avatar_key).toBe('avatars/u1/x.jpg');
  });

  it('does not import a photo when the race was lost to an earlier sign-in', async () => {
    const t = build({ createdIsNew: false });
    await t.service.signInWithGoogle('tok');
    expect(t.avatars.importFrom).not.toHaveBeenCalled();
  });

  it('skips the photo when Google has none', async () => {
    const t = build({ identity: { ...IDENTITY, picture: null } });
    await t.service.signInWithGoogle('tok');
    expect(t.avatars.importFrom).not.toHaveBeenCalled();
  });

  it('still signs in when the photo import fails', async () => {
    const t = build({ avatarKey: null, created: userRow({ id: 'new' }) });
    const res = await t.service.signInWithGoogle('tok');
    expect(t.users.setAvatarKey).not.toHaveBeenCalled();
    expect(res.access_token).toBe('token');
    expect(res.user.avatar_key).toBeNull();
  });

  it('audits sign-in with user id, is_new_user and claimed_existing only', async () => {
    const t = build({ claimed: userRow({ id: 'old' }) });
    await t.service.signInWithGoogle('tok');
    expect(t.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'old',
        action: AuditAction.AUTH_SIGNED_IN,
        snapshot: {
          user_id: 'old',
          is_new_user: false,
          claimed_existing: true,
        },
      }),
    );
  });

  it('token carries sub and token version only', async () => {
    const t = build({ bySub: userRow() });
    await t.service.signInWithGoogle('tok');
    expect(t.jwt.sign).toHaveBeenCalledWith({ sub: 'u1', tv: 3 });
  });

  it('does not sign in when the token is refused', async () => {
    const t = build();
    t.verifier.verify.mockRejectedValueOnce(new Error('AUTH_GOOGLE_INVALID'));
    await expect(t.service.signInWithGoogle('bad')).rejects.toThrow();
    expect(t.jwt.sign).not.toHaveBeenCalled();
  });
});
