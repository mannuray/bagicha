export type ErrorKind = 'operational' | 'programmer';

/**
 * Base for every error the app throws on purpose. `reason` is the
 * machine-readable code clients branch on; `kind` decides log severity.
 */
export abstract class AppError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly kind: ErrorKind;

  protected constructor(
    readonly reason: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

abstract class OperationalError extends AppError {
  readonly kind = 'operational' as const;

  constructor(
    reason: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(reason, message, details);
  }
}

export class NotFoundError extends OperationalError {
  readonly httpStatus = 404;
}

export class ValidationError extends OperationalError {
  readonly httpStatus = 422;
}

export class ConflictError extends OperationalError {
  readonly httpStatus = 409;
}

export class UnauthorizedError extends OperationalError {
  readonly httpStatus = 401;
}

export class ForbiddenError extends OperationalError {
  readonly httpStatus = 403;
}

export class RateLimitedError extends OperationalError {
  readonly httpStatus = 429;
}

/** An external dependency (AI provider, storage, payments) failed or misbehaved. */
export class UpstreamError extends OperationalError {
  readonly httpStatus = 502;
}

/** A bug: an assumption the code relies on did not hold. */
export class InvariantError extends AppError {
  readonly httpStatus = 500;
  readonly kind = 'programmer' as const;

  constructor(message: string, details?: Record<string, unknown>) {
    super('INTERNAL_INVARIANT', message, details);
  }
}
