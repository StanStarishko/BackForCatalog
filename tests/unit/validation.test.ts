/**
 * Validation utilities unit tests
 */

import { describe, expect, it } from "vitest";
import {
	validateCheckoutItem,
	validateEmail,
	validateLoginRequest,
	validatePaginationQuery,
	validateTokenRequest,
} from "../../src/utils/validation.js";

describe("Validation Utilities", () => {
	describe("validateEmail", () => {
		it("should accept valid email addresses", () => {
			const result = validateEmail("user@example.com");
			expect(result.success).toBe(true);
			expect(result.data).toBe("user@example.com");
		});

		it("should normalise email to lowercase", () => {
			const result = validateEmail("User@Example.COM");
			expect(result.success).toBe(true);
			expect(result.data).toBe("user@example.com");
		});

		it("should reject invalid email formats", () => {
			const result = validateEmail("invalid-email");
			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid email format");
		});

		it("should reject non-string values", () => {
			const result = validateEmail(123);
			expect(result.success).toBe(false);
			expect(result.error).toContain("must be a string");
		});

		it("should reject empty emails", () => {
			const result = validateEmail("");
			expect(result.success).toBe(false);
			expect(result.error).toContain("cannot be empty");
		});
	});

	describe("validatePaginationQuery", () => {
		it("should accept valid pagination parameters", () => {
			const result = validatePaginationQuery({ page: 2, limit: 20 });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ page: 2, limit: 20 });
		});

		it("should use defaults when parameters not provided", () => {
			const result = validatePaginationQuery({});
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ page: 1, limit: 10 });
		});

		it("should parse string numbers", () => {
			const result = validatePaginationQuery({ page: "3", limit: "15" });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ page: 3, limit: 15 });
		});

		it("should reject negative page numbers", () => {
			const result = validatePaginationQuery({ page: -1 });
			expect(result.success).toBe(false);
			expect(result.error).toContain("positive integer");
		});

		it("should reject limit over 100", () => {
			const result = validatePaginationQuery({ limit: 150 });
			expect(result.success).toBe(false);
			expect(result.error).toContain("between 1 and 100");
		});
	});

	describe("validateCheckoutItem", () => {
		it("should accept valid checkout items", () => {
			const result = validateCheckoutItem({ productId: "prod_1", quantity: 5 });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ productId: "prod_1", quantity: 5 });
		});

		it("should reject items without productId", () => {
			const result = validateCheckoutItem({ quantity: 5 });
			expect(result.success).toBe(false);
			expect(result.error).toContain("Product ID");
		});

		it("should reject non-integer quantities", () => {
			const result = validateCheckoutItem({
				productId: "prod_1",
				quantity: 3.5,
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("positive integer");
		});

		it("should reject quantities over 1000", () => {
			const result = validateCheckoutItem({
				productId: "prod_1",
				quantity: 1500,
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("exceeds maximum");
		});
	});

	describe("validateLoginRequest", () => {
		it("should accept valid login requests", () => {
			const result = validateLoginRequest({ email: "user@test.com" });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ email: "user@test.com" });
		});

		it("should reject requests without email", () => {
			const result = validateLoginRequest({});
			expect(result.success).toBe(false);
		});
	});

	describe("validateTokenRequest", () => {
		it("should accept valid token requests", () => {
			const result = validateTokenRequest({ code: "auth_code_123" });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ code: "auth_code_123" });
		});

		it("should reject requests without code", () => {
			const result = validateTokenRequest({});
			expect(result.success).toBe(false);
			expect(result.error).toContain("Authorization code");
		});

		it("should reject empty codes", () => {
			const result = validateTokenRequest({ code: "" });
			expect(result.success).toBe(false);
			expect(result.error).toContain("non-empty");
		});
	});
});
