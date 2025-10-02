/**
 * BackForCatalog Server
 * Main application entry point
 */

import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRoutes } from "./routes/auth.js";
import { catalogueRoutes } from "./routes/catalog.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { loadInitialProducts, startAuthCodeCleanup } from "./storage/index.js";
import { loadConfig } from "./utils/config.js";

/**
 * Creates and configures Fastify application instance
 * @returns Configured Fastify instance
 */
async function buildApp() {
	const config = await loadConfig();

	// Create logger configuration
	const loggerConfig =
		config.nodeEnv === "development"
			? {
					level: config.logLevel,
					transport: {
						target: "pino-pretty",
						options: {
							translateTime: "HH:MM:ss Z",
							ignore: "pid,hostname",
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
				code: "RATE_LIMIT_EXCEEDED",
				message: "Too many requests. Please try again later.",
			},
		}),
	});

	// Health check endpoint
	fastify.get("/health", async () => ({
		status: "healthy",
		timestamp: new Date().toISOString(),
	}));

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

		// Load initial data
		fastify.log.info("Loading initial product data...");
		loadInitialProducts();

		// Start auth code cleanup
		startAuthCodeCleanup();
		fastify.log.info("Started authorization code cleanup service");

		// Start server
		await fastify.listen({
			port: config.port,
			host: config.host,
		});

		fastify.log.info(`Server running on http://${config.host}:${config.port}`);
		fastify.log.info(`Environment: ${config.nodeEnv}`);
	} catch (error) {
		fastify.log.error(error, "Failed to start server");
		process.exit(1);
	}
}

// Build app
const fastify = await buildApp();

// Start server if not in test mode
if (process.env.NODE_ENV !== "test") {
	start();
}

// Export for testing
export { fastify, buildApp };
