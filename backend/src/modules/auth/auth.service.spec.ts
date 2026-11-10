import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

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
  };
  const user = { id: 'u1', phone_number: PHONE };
  const prisma = {
    user: {
      findUnique: jest.fn(() => Promise.resolve(user)),
      create: jest.fn(() => Promise.resolve(user)),
    },
  };
  const jwt = { sign: jest.fn(() => 'token') };
  const config = { get: (k: string) => env[k] } as unknown as ConfigService;
  const service = new AuthService(
    prisma as any,
    redis as any,
    jwt as any,
    config,
    {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any,
  );
  return { service, store };
}

describe('AuthService', () => {
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

  it('stores a 6-digit OTP without using Math.random', async () => {
    const spy = jest.spyOn(Math, 'random');
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    expect(spy).not.toHaveBeenCalled();
    expect(store.get(`otp:${PHONE}`)).toMatch(/^\d{6}$/);
    spy.mockRestore();
  });

  it('accepts the OTP it stored, once', async () => {
    const { service, store } = build({ NODE_ENV: 'development' });
    await service.requestOtp(PHONE);
    const otp = store.get(`otp:${PHONE}`) as string;
    await expect(service.verifyOtp(PHONE, otp)).resolves.toBeDefined();
    await expect(service.verifyOtp(PHONE, otp)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
