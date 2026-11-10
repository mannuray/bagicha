import { InvariantError } from '../common/errors';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
  AUTH_DEV_OTP_PHONE?: string;
  AUTH_DEV_OTP_CODE?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_SERVICE_NAME?: string;
  LOG_LEVEL?: string;
  [key: string]: unknown;
}

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

/** ConfigModule validator: fails startup when required secrets are absent. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const missing = REQUIRED.filter((key) => {
    const value = raw[key];
    return typeof value !== 'string' || value.trim() === '';
  });
  if (missing.length > 0) {
    throw new InvariantError(
      `Missing required environment variables: ${missing.join(', ')}`,
      { missing },
    );
  }
  return raw as Env;
}
