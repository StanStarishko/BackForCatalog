/**
 * Authentication routes
 * OAuth 2.0 flow endpoints for login and token exchange
 */

import type { FastifyInstance } from 'fastify';
import { exchangeCodeForToken, handleLogin } from '../services/auth.js';
import type {
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  TokenRequest,
  TokenResponse,
} from '../types/index.js';
import { validateLoginRequest, validateTokenRequest } from '../utils/validation.js';

/**
 * Registers authentication routes with Fastify instance
 * @param fastify - Fastify application instance
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /auth/login
   * Initiates OAuth flow by generating authorization code
   * Body: { email: string }
   * Returns: { authorizationCode, expiresIn }
   */
  fastify.post<{
    Body: LoginRequest;
    Reply: LoginResponse | ErrorResponse;
  }>('/auth/login', async (request, reply) => {
    // Validate request body
    const validation = validateLoginRequest(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: validation.error ?? 'Invalid login request',
        },
      });
    }

    try {
      if (!validation.data) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid login request',
          },
        });
      }

      const loginResponse = handleLogin(validation.data.email);
      return reply.code(200).send(loginResponse);
    } catch (error) {
      request.log.error(error, 'Login failed');
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login processing failed',
        },
      });
    }
  });

  /**
   * POST /auth/token
   * Exchanges authorization code for JWT access token
   * Body: { code: string }
   * Returns: { accessToken, tokenType, expiresIn }
   */
  fastify.post<{
    Body: TokenRequest;
    Reply: TokenResponse | ErrorResponse;
  }>('/auth/token', async (request, reply) => {
    // Validate request body
    const validation = validateTokenRequest(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: validation.error ?? 'Invalid token request',
        },
      });
    }

    try {
      if (!validation.data) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid token request',
          },
        });
      }

      const tokenResponse = await exchangeCodeForToken(validation.data.code);
      return reply.code(200).send(tokenResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token exchange failed';

      // Determine if error is client-side (invalid/expired code) or server-side
      const isClientError =
        error instanceof Error &&
        (errorMessage.includes('Invalid') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('used'));

      const statusCode = isClientError ? 400 : 500;

      request.log.error(error, 'Token exchange failed');

      return reply.code(statusCode).send({
        error: {
          code: isClientError ? 'INVALID_CODE' : 'INTERNAL_ERROR',
          message: errorMessage,
        },
      });
    }
  });
}
