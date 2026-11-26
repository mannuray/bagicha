import { InvariantError } from '../common/errors';
import { validateWeatherEnv } from '../modules/weather/providers/provider-config';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
  AUTH_DEV_OTP_PHONE?: string;
  AUTH_DEV_OTP_CODE?: string;
  /** "true" returns the OTP from request-otp for on-screen testing; refused in production. */
  AUTH_EXPOSE_OTP?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_SERVICE_NAME?: string;
  /** Ordered weather providers ("open-meteo"); unset means Open-Meteo, "none" turns weather off. */
  WEATHER_PROVIDERS?: string;
  /** Open-Meteo paid API key; required for commercial use. */
  OPEN_METEO_API_KEY?: string;
  /** OpenWeatherMap API key; required when WEATHER_PROVIDERS lists openweathermap. */
  OPENWEATHERMAP_API_KEY?: string;
  /** Sentry project DSN; crash reports are off without it. */
  SENTRY_DSN?: string;
  LOG_LEVEL?: string;
  WEB_ORIGINS?: string;
  AI_PROVIDER?: 'gemini' | 'fake';
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
  const provider = raw.AI_PROVIDER;
  if (provider !== undefined && provider !== 'gemini' && provider !== 'fake') {
    throw new InvariantError('AI_PROVIDER must be "gemini" or "fake"', {
      AI_PROVIDER: provider,
    });
  }
  if (provider === 'fake' && raw.NODE_ENV === 'production') {
    throw new InvariantError('AI_PROVIDER=fake is not allowed in production');
  }
  if (raw.AUTH_EXPOSE_OTP === 'true' && raw.NODE_ENV === 'production') {
    throw new InvariantError('AUTH_EXPOSE_OTP is not allowed in production');
  }
  validateWeatherEnv(raw as Record<string, string | undefined>);
  return raw as Env;
}
