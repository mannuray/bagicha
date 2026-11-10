import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 's3cret',
};

describe('validateEnv', () => {
  it('accepts the required keys', () => {
    expect(validateEnv(base)).toMatchObject(base);
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() => validateEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('throws when JWT_SECRET is blank', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: '  ' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_SECRET: 's' })).toThrow(/DATABASE_URL/);
  });

  it('refuses the fake AI provider in production', () => {
    expect(() =>
      validateEnv({ ...base, AI_PROVIDER: 'fake', NODE_ENV: 'production' }),
    ).toThrow(/AI_PROVIDER/);
  });

  it('allows the fake AI provider outside production', () => {
    expect(
      validateEnv({ ...base, AI_PROVIDER: 'fake', NODE_ENV: 'test' }),
    ).toMatchObject({
      AI_PROVIDER: 'fake',
    });
  });

  it('rejects unknown AI providers', () => {
    expect(() => validateEnv({ ...base, AI_PROVIDER: 'gpt' })).toThrow(
      /AI_PROVIDER/,
    );
  });

  it('refuses AUTH_EXPOSE_OTP in production', () => {
    expect(() =>
      validateEnv({ ...base, AUTH_EXPOSE_OTP: 'true', NODE_ENV: 'production' }),
    ).toThrow(/AUTH_EXPOSE_OTP/);
  });
});
