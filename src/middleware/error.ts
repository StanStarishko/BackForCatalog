/**
 * Error handling middleware
 * Provides centralised error processing and consistent error responses
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ErrorResponse } from '../types/index.js';

/**
 * Global error handler for Fastify application
 * Transforms errors into consistent API responses
 * @param error - Error object
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const statusCode = error.statusCode ?? 500;

  // Log error details for debugging
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      code: getErrorCode(error),
      message: getErrorMessage(error, statusCode),
    },
  };

  // Include validation details if available
  if (error.validation) {
    errorResponse.error.details = error.validation;
  }

  return reply.code(statusCode).send(errorResponse);
}

/**
 * Determines error code based on error type
 * @param error - Error object
 * @returns Error code string
 */
function getErrorCode(error: FastifyError): string {
  if (error.code) {
    return error.code;
  }

  const statusCode = error.statusCode ?? 500;

  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
  };

  return codeMap[statusCode] ?? 'UNKNOWN_ERROR';
}

/**
 * Generates user-friendly error message
 * Hides internal details in production
 * @param error - Error object
 * @param statusCode - HTTP status code
 * @returns Error message string
 */
function getErrorMessage(error: FastifyError, statusCode: number): string {
  // In production, hide internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return 'An internal server error occurred';
  }

  return error.message || 'An unexpected error occurred';
}

/**
 * Not found handler for undefined routes
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  };

  return reply.code(404).send(errorResponse);
}
