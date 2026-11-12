import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyRazorpaySignature } from './razorpay-signature';
import { UnauthorizedError } from '../../common/errors';

type RawBodyRequest = Request & { rawBody?: Buffer };

/** Authenticates Razorpay webhook calls by their HMAC signature. */
@Injectable()
export class RazorpaySignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest>();
    const header = req.headers['x-razorpay-signature'];
    const signature = Array.isArray(header) ? header[0] : header;
    const valid = verifyRazorpaySignature(
      req.rawBody ?? Buffer.alloc(0),
      signature,
      this.config.get<string>('RAZORPAY_WEBHOOK_SECRET'),
    );
    if (!valid) {
      throw new UnauthorizedError(
        'WEBHOOK_SIGNATURE_INVALID',
        'Webhook signature is missing or invalid',
      );
    }
    return true;
  }
}
