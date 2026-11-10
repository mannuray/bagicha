import { createHmac } from 'crypto';
import { verifyRazorpaySignature } from './razorpay-signature';

const SECRET = 'whsec';
const body = Buffer.from(JSON.stringify({ event: 'order.paid' }));
const sign = (b: Buffer, s = SECRET) =>
  createHmac('sha256', s).update(b).digest('hex');

describe('verifyRazorpaySignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyRazorpaySignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const tampered = Buffer.from(body);
    tampered[0] = tampered[0] ^ 1;
    expect(verifyRazorpaySignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyRazorpaySignature(body, undefined, SECRET)).toBe(false);
  });

  it('rejects when no secret is configured (fail closed)', () => {
    expect(verifyRazorpaySignature(body, sign(body), undefined)).toBe(false);
    expect(verifyRazorpaySignature(body, sign(body, ''), '')).toBe(false);
  });

  it('rejects a signature of a different length without throwing', () => {
    expect(verifyRazorpaySignature(body, 'abc', SECRET)).toBe(false);
  });
});
