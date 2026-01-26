/**
 * API Response Helpers
 *
 * Standardized response formatting for API routes.
 */

import { NextResponse } from 'next/server';
import { ApiError } from './errors';
import type { ApiResult, ErrorCode } from '@/types/api';

/**
 * Create a success response
 */
export function success<T>(data: T, status: number = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Create an error response from an ApiError
 */
export function error(err: ApiError): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    },
    { status: err.statusCode }
  );
}

/**
 * Create an error response from code and message
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Handle unknown errors uniformly
 */
export function handleError(err: unknown): NextResponse<ApiResult<never>> {
  if (err instanceof ApiError) {
    return error(err);
  }

  // Log unexpected errors
  console.error('Unexpected API error:', err);

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
