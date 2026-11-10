import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Razorpay signs webhooks with HMAC-SHA256 (hex) over the raw request body.
 * Fails closed: any missing input is treated as an invalid signature.
 */
export function verifyRazorpaySignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !signature) return false;
  const expected = Buffer.from(
    createHmac('sha256', secret).update(rawBody).digest('hex'),
  );
  const received = Buffer.from(signature);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}
