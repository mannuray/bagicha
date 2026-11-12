import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { AppError } from '../errors';
import { routePattern } from '../http/route-pattern';

interface ErrorBody {
  code: string;
  message: string;
  request_id: string;
  timestamp: string;
  path: string;
  details: Record<string, unknown> | null;
  validation_errors: Array<{ field: string; message: string }> | null;
}

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

/** Fixed wording per status for errors that don't bring their own. */
const FIXED_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Request too large',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service unavailable, try again shortly',
};

/**
 * A database error no repository translated: a safety net so it is never a bare 500.
 * A timeout means "try again"; a duplicate is a conflict; a missing reference or row,
 * not found.
 */
function fromPrismaError(
  err: unknown,
): { status: number; code: string; message: string } | null {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code !== 'string' || !/^P\d{4}$/.test(code)) return null;
  if (code === 'P1008' || code === 'P2024')
    return { status: 503, code: 'DB_TIMEOUT', message: FIXED_MESSAGES[503] };
  if (code === 'P2002')
    return {
      status: 409,
      code: 'ALREADY_EXISTS',
      message: 'That already exists',
    };
  if (code === 'P2003' || code === 'P2025')
    return { status: 404, code: 'NOT_FOUND', message: FIXED_MESSAGES[404] };
  return null;
}

/** The shared error envelope, for handlers that run outside Nest's filters. */
export function errorEnvelope(
  request: Request,
  code: string,
  message: string,
): { success: false; error: ErrorBody } {
  const header = request.headers['x-request-id'];
  return {
    success: false,
    error: {
      code,
      message,
      request_id: (Array.isArray(header) ? header[0] : header) ?? randomUUID(),
      timestamp: new Date().toISOString(),
      path: routePattern(request),
      details: null,
      validation_errors: null,
    },
  };
}

type NestErrorResponse = {
  code?: unknown;
  error?: unknown;
  message?: unknown;
};

/** Turns every thrown value into the shared error envelope. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const header = request.headers['x-request-id'];
    const base = {
      request_id: (Array.isArray(header) ? header[0] : header) ?? randomUUID(),
      timestamp: new Date().toISOString(),
      // The route pattern, never the real URL (ids, query strings).
      path: routePattern(request),
    };

    const { status, body } = this.toEnvelope(exception, base);
    response.status(status).json({ success: false, error: body });
  }

  private toEnvelope(
    exception: unknown,
    base: Pick<ErrorBody, 'request_id' | 'timestamp' | 'path'>,
  ): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      const log = {
        err: exception,
        reason: exception.reason,
        status: exception.httpStatus,
      };
      if (exception.kind === 'operational') {
        this.logger.warn(log, 'request failed');
      } else {
        this.logger.error(log, 'request failed');
      }
      return {
        status: exception.httpStatus,
        body: {
          ...base,
          code: exception.reason,
          message: exception.message,
          details: exception.details ?? null,
          validation_errors: null,
        },
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, base);
    }

    const db = fromPrismaError(exception);
    if (db) {
      this.logger.warn(
        { err: exception, reason: db.code, status: db.status },
        'request failed',
      );
      return {
        status: db.status,
        body: {
          ...base,
          code: db.code,
          message: db.message,
          details: null,
          validation_errors: null,
        },
      };
    }

    this.logger.error({ err: exception }, 'unhandled exception');
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        ...base,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error occurred',
        details: null,
        validation_errors: null,
      },
    };
  }

  private fromHttpException(
    exception: HttpException,
    base: Pick<ErrorBody, 'request_id' | 'timestamp' | 'path'>,
  ): { status: number; body: ErrorBody } {
    const status: number = exception.getStatus();
    const raw = exception.getResponse();
    const res: NestErrorResponse =
      typeof raw === 'object' && raw !== null
        ? (raw as NestErrorResponse)
        : { message: raw };
    const messages = Array.isArray(res.message)
      ? (res.message as unknown[]).map(String)
      : null;
    const isValidation =
      status === 422 || (status === 400 && messages !== null);

    const fallbackCode = STATUS_CODES[status] ?? 'ERROR';
    const code = isValidation
      ? 'VALIDATION_ERROR'
      : typeof res.code === 'string'
        ? res.code
        : fallbackCode;
    // Our own throws carry a code and fixed wording; Nest's defaults ("Cannot GET
    // /api/v1/…") can echo the URL and ids, so they get fixed wording per status.
    const ownMessage =
      typeof res.code === 'string' && typeof res.message === 'string';
    const message = isValidation
      ? 'Request validation failed'
      : ownMessage
        ? (res.message as string)
        : (FIXED_MESSAGES[status] ?? 'Request failed');

    const log = { err: exception, reason: code, status };
    if (status >= 500) this.logger.error(log, 'request failed');
    else this.logger.warn(log, 'request failed');

    return {
      status,
      body: {
        ...base,
        code,
        message,
        details: null,
        validation_errors: messages
          ? messages.map((m) => ({ field: 'unknown', message: m }))
          : null,
      },
    };
  }
}
