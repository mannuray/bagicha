/** A failed API call. `code` is the backend's machine-readable reason (e.g. PLANT_NOT_FOUND). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** A client-side problem the UI explains to the user (e.g. an unsupported photo). */
export class AppStateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AppStateError';
    this.code = code;
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;
