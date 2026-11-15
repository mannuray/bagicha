import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** The languages the API answers in; English is the default. */
export type Lang = 'en' | 'hi';

/**
 * The language a request asks for, from its Accept-Language header. The
 * first listed tag decides (browsers list their preference first); anything
 * other than Hindi gets English.
 */
export function langOf(header: string | undefined): Lang {
  const first = (header ?? '').split(',')[0].trim().toLowerCase();
  return first === 'hi' || first.startsWith('hi-') ? 'hi' : 'en';
}

/** Controller parameter: the request's language. */
export const RequestLang = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Lang =>
    langOf(ctx.switchToHttp().getRequest<Request>().headers['accept-language']),
);
