/**
 * Catalogue routes
 * API endpoints for product catalogue access
 */

import type { FastifyInstance } from 'fastify';
import { getCatalogue } from '../services/catalog.js';
import { isStorageHealthy } from '../storage/index.js';
import type { CatalogueResponse, ErrorResponse } from '../types/index.js';
import { validatePaginationQuery } from '../utils/validation.js';

/**
 * Registers catalogue routes with Fastify instance
 * @param fastify - Fastify application instance
 */
export async function catalogueRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /catalog
   * Retrieves paginated list of active products
   * Query parameters: page (default: 1), limit (default: 10, max: 100)
   * Works even with empty storage, returns empty array
   */
  fastify.get<{
    Querystring: { page?: string; limit?: string };
    Reply: CatalogueResponse | ErrorResponse;
  }>('/catalog', async (request, reply) => {
    // Validate pagination query
    const validation = validatePaginationQuery(request.query);

    if (!validation.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_QUERY',
          message: validation.error ?? 'Invalid query parameters',
        },
      });
    }

    try {
      const catalogue = getCatalogue(validation.data ?? { page: 1, limit: 10 });

      // If storage is not healthy, add a warning header
      if (!isStorageHealthy()) {
        reply.header('X-Storage-Warning', 'Product data unavailable - returning empty catalogue');
        request.log.warn('Catalogue request processed with empty storage');
      }

      return reply.code(200).send(catalogue);
    } catch (error) {
      request.log.error(error, 'Failed to retrieve catalogue');
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve catalogue',
        },
      });
    }
  });
}
