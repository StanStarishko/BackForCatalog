/**
 * BackForCatalog Server
 * Main application entry point
 */

import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRoutes } from './routes/auth.js';
import { catalogueRoutes } from './routes/catalog.js';
import { checkoutRoutes } from './routes/checkout.js';
import {
  getStorageHealth,
  getStorageStats,
  loadInitialProducts,
  startAuthCodeCleanup,
} from './storage/index.js';
import { loadConfig } from './utils/config.js';

/**
 * Creates and configures Fastify application instance
 * @returns Configured Fastify instance
 */
async function buildApp() {
  const config = await loadConfig();

  // Create logger configuration
  const loggerConfig =
    config.nodeEnv === 'development'
      ? {
          level: config.logLevel,
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : {
          level: config.logLevel,
        };

  // Create Fastify instance with logging
  const fastify = Fastify({
    logger: loggerConfig,
  });

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Register rate limiting
  await fastify.register(fastifyRateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    }),
  });

  // Health check endpoint with storage status
  fastify.get('/health', async () => {
    const storageHealth = getStorageHealth();
    const stats = getStorageStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      storage: {
        healthy: storageHealth.healthy,
        message: storageHealth.message,
        stats: {
          products: stats.products,
          users: stats.users,
          authCodes: stats.authCodes,
        },
      },
    };
  });

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(catalogueRoutes);
  await fastify.register(checkoutRoutes);

  // Register error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}

/**
 * Starts the application server
 */
async function start() {
  try {
    const config = await loadConfig();

    // Attempt to load initial data
    // Server continues even if data loading fails
    fastify.log.info('Attempting to load initial product data...');
    const loadedCount = loadInitialProducts();

    if (loadedCount > 0) {
      fastify.log.info(`✓ Product data loaded successfully (${loadedCount} products)`);
    } else {
      fastify.log.warn('⚠ No product data loaded - server will operate with empty catalogue');
      fastify.log.warn('⚠ Ensure data/products.json exists or connect to a database');
    }

    // Start auth code cleanup service
    startAuthCodeCleanup();
    fastify.log.info('Started authorization code cleanup service');

    // Start server regardless of data loading status
    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    fastify.log.info(`Server running on http://${config.host}:${config.port}`);
    fastify.log.info(`Environment: ${config.nodeEnv}`);
    fastify.log.info('✓ Server started successfully');
  } catch (error) {
    fastify.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Build app
const fastify = await buildApp();

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}

// Export for testing
export { fastify, buildApp };
