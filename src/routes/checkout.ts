/**
 * Checkout routes
 * API endpoints for order processing and payment
 */

import type { FastifyInstance } from 'fastify';
import { authenticationMiddleware } from '../middleware/auth.js';
import { processCheckout } from '../services/checkout.js';
import type { CheckoutRequest, CheckoutResponse, ErrorResponse } from '../types/index.js';
import { validateCheckoutRequest } from '../utils/validation.js';

/**
 * Registers checkout routes with Fastify instance
 * @param fastify - Fastify application instance
 */
export async function checkoutRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /checkout
   * Processes checkout request and creates payment intent
   * Requires authentication
   * Body: { items: [{ productId, quantity }] }
   */
  fastify.post<{
    Body: CheckoutRequest;
    Reply: CheckoutResponse | ErrorResponse;
  }>(
    '/checkout',
    {
      preHandler: authenticationMiddleware,
    },
    async (request, reply) => {
      // Validate request body
      const validation = validateCheckoutRequest(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: validation.error ?? 'Invalid checkout request',
          },
        });
      }

      try {
        if (!validation.data) {
          return reply.code(400).send({
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid checkout request',
            },
          });
        }

        const checkoutResult = processCheckout(validation.data.items);
        return reply.code(200).send(checkoutResult);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Checkout failed';

        // Determine if error is client-side (e.g., insufficient inventory) or server-side
        const isClientError =
          error instanceof Error &&
          (errorMessage.includes('not found') ||
            errorMessage.includes('not available') ||
            errorMessage.includes('Insufficient inventory'));

        const statusCode = isClientError ? 400 : 500;

        request.log.error(error, 'Checkout processing failed');

        return reply.code(statusCode).send({
          error: {
            code: isClientError ? 'CHECKOUT_FAILED' : 'INTERNAL_ERROR',
            message: errorMessage,
          },
        });
      }
    }
  );
}
