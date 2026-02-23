export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public override message: string,
    public details?: unknown,
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

// Common errors
export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource.toUpperCase()}_NOT_FOUND`, 404, `${resource} not found`),
  unauthorized: (message = 'Unauthorized') =>
    new AppError('UNAUTHORIZED', 401, message),
  forbidden: (message = 'Forbidden') =>
    new AppError('FORBIDDEN', 403, message),
  conflict: (message: string) =>
    new AppError('CONFLICT', 409, message),
  validationError: (details: unknown) =>
    new AppError('VALIDATION_ERROR', 400, 'Invalid request', details),
  rateLimited: () =>
    new AppError('RATE_LIMITED', 429, 'Too many requests'),
  internal: (message = 'Something went wrong') =>
    new AppError('INTERNAL_ERROR', 500, message),
} as const;
