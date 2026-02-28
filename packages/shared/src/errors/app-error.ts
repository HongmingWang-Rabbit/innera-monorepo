export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public override message: string,
    public details?: Record<string, unknown> | undefined,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'AppError';
    // Fix prototype chain for instanceof checks with ES5 targets
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
    };
  }
}

/**
 * Common error factories.
 * - `validationError`: for Zod/schema validation failures (structured details)
 * - `badRequest`: for general 400s with a custom message (e.g. business rule violations)
 */
export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, 404, `${resource} not found`),
  unauthorized: (message = 'Unauthorized') =>
    new AppError('UNAUTHORIZED', 401, message),
  forbidden: (message = 'Forbidden') =>
    new AppError('FORBIDDEN', 403, message),
  conflict: (message: string) =>
    new AppError('CONFLICT', 409, message),
  validationError: (details: Record<string, unknown> | string) =>
    new AppError('VALIDATION_ERROR', 400, 'Invalid request', typeof details === 'string' ? { message: details } : details),
  badRequest: (message: string, details?: Record<string, unknown> | string) =>
    new AppError('BAD_REQUEST', 400, message, typeof details === 'string' ? { message: details } : details),
  rateLimited: () =>
    new AppError('RATE_LIMITED', 429, 'Too many requests'),
  internal: (message = 'Something went wrong') =>
    new AppError('INTERNAL_ERROR', 500, message),
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new AppError('SERVICE_UNAVAILABLE', 503, message),
} as const;

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
