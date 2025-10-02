/**
 * API integration tests
 * Tests complete request/response cycles
 */

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/server.js";
import {
	clearAllStorage,
	loadInitialProducts,
} from "../../src/storage/index.js";

describe("API Integration Tests", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		// Set test environment
		process.env.NODE_ENV = "test";
		process.env.JWT_SECRET = "test-secret-key";

		// Build app and load data
		app = await buildApp();
		loadInitialProducts();
	});

	afterAll(async () => {
		await app.close();
		clearAllStorage();
	});

	describe("Health Check", () => {
		it("should return healthy status", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/health",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.status).toBe("healthy");
			expect(body.timestamp).toBeDefined();
		});
	});

	describe("Authentication Flow", () => {
		let authCode: string;
		let accessToken: string;

		it("should login and receive authorization code", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: {
					email: "test@example.com",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.authorizationCode).toBeDefined();
			expect(body.expiresIn).toBeGreaterThan(0);

			authCode = body.authorizationCode;
		});

		it("should exchange code for access token", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/auth/token",
				payload: {
					code: authCode,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.accessToken).toBeDefined();
			expect(body.tokenType).toBe("Bearer");
			expect(body.expiresIn).toBeGreaterThan(0);

			accessToken = body.accessToken;
		});

		it("should reject reused authorization code", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/auth/token",
				payload: {
					code: authCode,
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error.message).toContain("already been used");
		});

		it("should access protected endpoint with valid token", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/checkout",
				headers: {
					authorization: `Bearer ${accessToken}`,
				},
				payload: {
					items: [{ productId: "prod_1", quantity: 1 }],
				},
			});

			expect(response.statusCode).toBe(200);
		});

		it("should reject protected endpoint without token", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/checkout",
				payload: {
					items: [{ productId: "prod_1", quantity: 1 }],
				},
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("Catalogue Endpoint", () => {
		it("should retrieve catalogue with default pagination", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/catalog",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.products).toBeInstanceOf(Array);
			expect(body.pagination).toBeDefined();
			expect(body.pagination.currentPage).toBe(1);
		});

		it("should apply custom pagination parameters", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/catalog?page=1&limit=5",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.products.length).toBeLessThanOrEqual(5);
			expect(body.pagination.itemsPerPage).toBe(5);
		});

		it("should return only active products", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/catalog",
			});

			const body = JSON.parse(response.body);
			for (const product of body.products) {
				expect(product.status).toBe("active");
			}
		});
	});

	describe("Checkout Endpoint", () => {
		let token: string;

		beforeAll(async () => {
			// Get authentication token
			const loginResponse = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: "checkout@test.com" },
			});
			const loginBody = JSON.parse(loginResponse.body);

			const tokenResponse = await app.inject({
				method: "POST",
				url: "/auth/token",
				payload: { code: loginBody.authorizationCode },
			});
			const tokenBody = JSON.parse(tokenResponse.body);
			token = tokenBody.accessToken;
		});

		it("should process valid checkout", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/checkout",
				headers: {
					authorization: `Bearer ${token}`,
				},
				payload: {
					items: [
						{ productId: "prod_1", quantity: 2 },
						{ productId: "prod_2", quantity: 1 },
					],
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.success).toBe(true);
			expect(body.totalAmount).toBeGreaterThan(0);
			expect(body.paymentIntent).toBeDefined();
			expect(body.items).toHaveLength(2);
		});

		it("should reject checkout with invalid product", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/checkout",
				headers: {
					authorization: `Bearer ${token}`,
				},
				payload: {
					items: [{ productId: "invalid_product", quantity: 1 }],
				},
			});

			expect(response.statusCode).toBe(400);
		});

		it("should reject empty items array", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/checkout",
				headers: {
					authorization: `Bearer ${token}`,
				},
				payload: {
					items: [],
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
