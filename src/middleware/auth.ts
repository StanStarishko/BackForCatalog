/**
 * Authentication middleware
 * Validates JWT tokens and protects routes
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/wt.js';

/**
 * Authentication middleware for protected routes
 * Verifies JWT token from Authorization header
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 * @throws {Error} If token is missing, invalid, or expired
 */
export async function authenticationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Expected format: Bearer <token>',
        },
      });
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    // Attach user info to request for downstream handlers
    (request as FastifyRequest & { user: { email: string } }).user = {
      email: payload.sub,
    };
  } catch (error) {
    return reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Token validation failed',
      },
    });
  }
}

/**
 * Type declaration for request with authenticated user
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    email: string;
  };
}
