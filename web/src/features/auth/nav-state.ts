import { z } from 'zod';

/** What other screens hand Login and the code screen in navigation state, checked. */
const loginStateSchema = z.object({ reason: z.string().optional() });
const otpStateSchema = z.object({ phone: z.string(), devOtp: z.string().optional() });

export type LoginState = z.infer<typeof loginStateSchema>;
export type OtpState = z.infer<typeof otpStateSchema>;

/** Login's state ("expired" after a 401); anything malformed counts as none. */
export function loginState(raw: unknown): LoginState {
  const parsed = loginStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

/** The phone (and test code) Login sent; null when missing or malformed. */
export function otpState(raw: unknown): OtpState | null {
  const parsed = otpStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
