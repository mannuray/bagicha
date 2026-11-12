import { createHash } from 'crypto';

/**
 * Redis keys for OTP state. The phone number is hashed: Redis keys reach logs and
 * trace spans (the ioredis instrumentation records the command and its key), and a
 * phone number must never appear there.
 */
const phoneHash = (phoneNumber: string) =>
  createHash('sha256').update(phoneNumber).digest('hex').slice(0, 32);

export const otpKey = (phoneNumber: string) => `otp:${phoneHash(phoneNumber)}`;
export const otpFailKey = (phoneNumber: string) =>
  `otp_fail:${phoneHash(phoneNumber)}`;
export const otpCooldownKey = (phoneNumber: string) =>
  `otp_cooldown:${phoneHash(phoneNumber)}`;
/** Per phone and caller: someone else asking for codes can't use up the owner's day. */
export const otpDailyKey = (phoneNumber: string, callerIp: string) =>
  `otp_daily:${phoneHash(`${phoneNumber}|${callerIp}`)}`;
