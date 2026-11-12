import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { otpKey } from './otp-keys';

const PHONE = '+916202042225';

function build(env: Record<string, string | undefined>) {
  const store = new Map<string, string>();
  const redis = {
    set: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    del: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
    incrWithTtl: jest.fn((k: string) => {
      const next = Number(store.get(k) ?? '0') + 1;
      store.set(k, String(next));
      return Promise.resolve(next);
    }),
  };
  const user = { id: 'u1', phone_number: PHONE };
  const prisma = {
    findByPhone: jest.fn(() => Promise.resolve(user)),
    createWithPhone: jest.fn(() => Promise.resolve(user)),
    findOrCreateByPhone: jest.fn(() =>
      Promise.resolve({ user, created: false }),
    ),
  };
  const jwt = { sign: jest.fn(() => 'token') };
  const audit = { record: jest.fn(() => Promise.resolve()) };
  const config = { get: (k: string) => env[k] } as unknown as ConfigService;
  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const service = new AuthService(
    prisma as any,
    redis as any,
    jwt as any,
    config,
    logger as any,
    audit as any,
  );
  return { service, store, audit, prisma, jwt, logger };
}

describe('AuthService', () => {
  it('returns the issued OTP for on-screen testing when AUTH_EXPOSE_OTP is on', async () => {
    const { service, store } = build({
      NODE_ENV: 'development',
      AUTH_EXPOSE_OTP: 'true',
    });
    const res = await service.requestOtp(PHONE);
    expect(res).toEqual({
      message: 'OTP sent successfully',
      dev_otp: store.get(otpKey(PHONE)),
    });
  });

  it('never returns the OTP unless AUTH_EXPOSE_OTP is on', async () => {
    const { service } = build({ NODE_ENV: 'development' });
    expect(await service.requestOtp(PHONE)).toEqual({
      message: 'OTP sent successfully',
    });
  });

  it('never returns the OTP in production, even if AUTH_EXPOSE_OTP is set', async () => {
    const { service } = build({
      NODE_ENV: 'production',
      AUTH_EXPOSE_OTP: 'true',
    });
    expect(await service.requestOtp(PHONE)).toEqual({
      message: 'OTP sent successfully',
    });
  });

  it('rejects the old hard-coded backdoor when no dev OTP is configured', async () => {
    const { service } = build({ NODE_ENV: 'development' });
    await expect(service.verifyOtp(PHONE, '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts the configured dev OTP outside production', async () => {
    const { service } = build({
      NODE_ENV: 'development',
      AUTH_DEV_OTP_PHONE: PHONE,
      AUTH_DEV_OTP_CODE: '123456',
    });
    await expect(service.verifyOtp(PHONE, '123456')).resolves.toMatchObject({
      access_token: 'token',
    });
  });

  it('ignores the dev OTP in production', async () => {
    const { service } = build({
      NODE_ENV: 'production',
      AUTH_DEV_OTP_PHONE: PHONE,
      AUTH_DEV_OTP_CODE: '123456',
    });
    await expect(service.verifyOtp(PHONE, '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('never puts the phone number in a Redis key (Redis keys reach traces)', async () => {
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    await service.verifyOtp(PHONE, '000000').catch(() => undefined);
    const digits = PHONE.replace(/\D/g, '');
    expect([...store.keys()].some((k) => k.includes(digits))).toBe(false);
    expect(store.size).toBeGreaterThan(0);
  });

  it('signs a token carrying only the user id, never the phone number', async () => {
    const { service, store, jwt } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    await service.verifyOtp(PHONE, store.get(otpKey(PHONE)) as string);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1' });
  });

  it('logs the issued code only when AUTH_LOG_OTP is explicitly on (and never in production)', async () => {
    const quiet = build({ NODE_ENV: 'staging', AUTH_EXPOSE_OTP: 'true' });
    await quiet.service.requestOtp(PHONE);
    expect(quiet.logger.debug).not.toHaveBeenCalled();
    const loud = build({ NODE_ENV: 'development', AUTH_LOG_OTP: 'true' });
    await loud.service.requestOtp(PHONE);
    expect(loud.logger.debug).toHaveBeenCalled();
    const prod = build({ NODE_ENV: 'production', AUTH_LOG_OTP: 'true' });
    await prod.service.requestOtp(PHONE);
    expect(prod.logger.debug).not.toHaveBeenCalled();
  });

  it('stores a 6-digit OTP without using Math.random', async () => {
    const spy = jest.spyOn(Math, 'random');
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    expect(spy).not.toHaveBeenCalled();
    expect(store.get(otpKey(PHONE))).toMatch(/^\d{6}$/);
    spy.mockRestore();
  });

  it('accepts the OTP it stored, once', async () => {
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    const otp = store.get(otpKey(PHONE)) as string;
    await expect(service.verifyOtp(PHONE, otp)).resolves.toBeDefined();
    await expect(service.verifyOtp(PHONE, otp)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('records one AUTH_SIGNED_IN audit event without the OTP', async () => {
    const { service, store, audit } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    const otp = store.get(otpKey(PHONE)) as string;
    await service.verifyOtp(PHONE, otp);
    expect(audit.record).toHaveBeenCalledTimes(1);
    const [event] = audit.record.mock.calls[0] as unknown as [any];
    expect(event).toMatchObject({
      actorUserId: 'u1',
      action: 'AUTH_SIGNED_IN',
      targetType: 'user',
      targetId: 'u1',
      snapshot: {
        user_id: 'u1',
        phone_number_last4: '2225',
        is_new_user: false,
      },
    });
    expect(JSON.stringify(event)).not.toContain(otp);
  });

  it('burns the OTP after 5 wrong guesses, so the right code then fails', async () => {
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    const otp = store.get(otpKey(PHONE)) as string;
    const wrong = otp === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await expect(service.verifyOtp(PHONE, wrong)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }
    expect(store.has(otpKey(PHONE))).toBe(false);
    await expect(service.verifyOtp(PHONE, otp)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('a fresh OTP request resets the failure count', async () => {
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    for (let i = 0; i < 4; i++) {
      await service.verifyOtp(PHONE, 'nope').catch(() => undefined);
    }
    await service.requestOtp(PHONE);
    const otp = store.get(otpKey(PHONE)) as string;
    await expect(service.verifyOtp(PHONE, otp)).resolves.toMatchObject({
      access_token: 'token',
    });
  });
});
