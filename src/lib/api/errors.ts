/**
 * API Error Classes
 *
 * Custom error classes for API error handling.
 */

import { ErrorCodes, type ErrorCode } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(ErrorCodes.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCodes.NOT_FOUND, message, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(ErrorCodes.CONFLICT, message, 409);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(ErrorCodes.RATE_LIMITED, message, 429);
  }
}
