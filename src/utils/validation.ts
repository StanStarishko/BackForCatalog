/**
 * Input validation utilities
 * Provides type-safe validation for API requests
 */

import type {
	CheckoutItem,
	LoginRequest,
	PaginationQuery,
	TokenRequest,
	ValidationResult,
} from "../types/index.js";

/**
 * Email validation regex pattern
 * Matches standard email format
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: unknown): ValidationResult<string> {
	if (typeof email !== "string") {
		return { success: false, error: "Email must be a string" };
	}

	if (email.length === 0) {
		return { success: false, error: "Email cannot be empty" };
	}

	if (!EMAIL_REGEX.test(email)) {
		return { success: false, error: "Invalid email format" };
	}

	if (email.length > 320) {
		return { success: false, error: "Email exceeds maximum length" };
	}

	return { success: true, data: email.toLowerCase().trim() };
}

/**
 * Validates pagination query parameters
 * @param query - Query object containing page and limit
 * @returns Validation result with normalized pagination params
 */
export function validatePaginationQuery(
	query: unknown,
): ValidationResult<PaginationQuery> {
	if (typeof query !== "object" || query === null) {
		return { success: false, error: "Query must be an object" };
	}

	const { page, limit } = query as Record<string, unknown>;

	// Validate page number
	let pageNumber = 1;
	if (page !== undefined) {
		if (typeof page === "string") {
			pageNumber = Number.parseInt(page, 10);
		} else if (typeof page === "number") {
			pageNumber = page;
		} else {
			return { success: false, error: "Page must be a number" };
		}

		if (Number.isNaN(pageNumber) || pageNumber < 1) {
			return { success: false, error: "Page must be a positive integer" };
		}
	}

	// Validate limit
	let limitNumber = 10;
	if (limit !== undefined) {
		if (typeof limit === "string") {
			limitNumber = Number.parseInt(limit, 10);
		} else if (typeof limit === "number") {
			limitNumber = limit;
		} else {
			return { success: false, error: "Limit must be a number" };
		}

		if (Number.isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
			return { success: false, error: "Limit must be between 1 and 100" };
		}
	}

	return {
		success: true,
		data: { page: pageNumber, limit: limitNumber },
	};
}

/**
 * Validates checkout item structure
 * @param item - Item to validate
 * @returns Validation result with validated item
 */
export function validateCheckoutItem(
	item: unknown,
): ValidationResult<CheckoutItem> {
	if (typeof item !== "object" || item === null) {
		return { success: false, error: "Item must be an object" };
	}

	const { productId, quantity } = item as Record<string, unknown>;

	if (typeof productId !== "string" || productId.length === 0) {
		return { success: false, error: "Product ID must be a non-empty string" };
	}

	if (
		typeof quantity !== "number" ||
		!Number.isInteger(quantity) ||
		quantity < 1
	) {
		return { success: false, error: "Quantity must be a positive integer" };
	}

	if (quantity > 1000) {
		return { success: false, error: "Quantity exceeds maximum allowed (1000)" };
	}

	return {
		success: true,
		data: { productId, quantity },
	};
}

/**
 * Validates login request body
 * @param body - Request body to validate
 * @returns Validation result with validated login data
 */
export function validateLoginRequest(
	body: unknown,
): ValidationResult<LoginRequest> {
	if (typeof body !== "object" || body === null) {
		return { success: false, error: "Request body must be an object" };
	}

	const { email } = body as Record<string, unknown>;
	const emailValidation = validateEmail(email);

	if (!emailValidation.success) {
		return {
			success: false,
			error: emailValidation.error ?? "Email validation failed",
		};
	}

	if (!emailValidation.data) {
		return { success: false, error: "Email validation failed" };
	}

	return {
		success: true,
		data: { email: emailValidation.data },
	};
}

/**
 * Validates token exchange request body
 * @param body - Request body to validate
 * @returns Validation result with validated token request
 */
export function validateTokenRequest(
	body: unknown,
): ValidationResult<TokenRequest> {
	if (typeof body !== "object" || body === null) {
		return { success: false, error: "Request body must be an object" };
	}

	const { code } = body as Record<string, unknown>;

	if (typeof code !== "string" || code.length === 0) {
		return {
			success: false,
			error: "Authorization code must be a non-empty string",
		};
	}

	if (code.length > 500) {
		return {
			success: false,
			error: "Authorization code exceeds maximum length",
		};
	}

	return {
		success: true,
		data: { code },
	};
}

/**
 * Validates checkout request body with multiple items
 * @param body - Request body to validate
 * @returns Validation result with validated checkout items
 */
export function validateCheckoutRequest(
	body: unknown,
): ValidationResult<{ items: CheckoutItem[] }> {
	if (typeof body !== "object" || body === null) {
		return { success: false, error: "Request body must be an object" };
	}

	const { items } = body as Record<string, unknown>;

	if (!Array.isArray(items)) {
		return { success: false, error: "Items must be an array" };
	}

	if (items.length === 0) {
		return { success: false, error: "Items array cannot be empty" };
	}

	if (items.length > 50) {
		return {
			success: false,
			error: "Cannot checkout more than 50 items at once",
		};
	}

	const validatedItems: CheckoutItem[] = [];

	for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
		const item = items[itemIdx];
		const itemValidation = validateCheckoutItem(item);

		if (!itemValidation.success) {
			return {
				success: false,
				error: `Invalid item at index ${itemIdx}: ${itemValidation.error}`,
			};
		}

		if (itemValidation.data) {
			validatedItems.push(itemValidation.data);
		}
	}

	return {
		success: true,
		data: { items: validatedItems },
	};
}
