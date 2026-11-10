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
      path: request.url,
    };

    const { status, body } = this.toEnvelope(exception, base);
    response.status(status).json({ success: false, error: body });
  }

  private toEnvelope(
    exception: unknown,
    base: Pick<ErrorBody, 'request_id' | 'timestamp' | 'path'>,
  ): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      const log = { err: exception, reason: exception.reason };
      if (exception.kind === 'operational') {
        this.logger.warn(log, exception.message);
      } else {
        this.logger.error(log, exception.message);
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

    this.logger.error({ err: exception }, 'Unhandled exception');
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
    const message = isValidation
      ? 'Request validation failed'
      : typeof res.message === 'string'
        ? res.message
        : exception.message;

    const log = { err: exception, reason: code };
    if (status >= 500) this.logger.error(log, message);
    else this.logger.warn(log, message);

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
