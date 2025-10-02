/**
 * In-memory storage implementation using Map
 * Provides fast key-value access for products, users, and authorization codes
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
	AuthCodeStorage,
	AuthorizationCode,
	Product,
	ProductStorage,
	User,
	UserStorage,
} from "../types/index.js";

// ==================== Storage Instances ====================

/**
 * Products storage - Maps product ID to Product entity
 */
export const productsStorage: ProductStorage = new Map<string, Product>();

/**
 * Users storage - Maps email to User entity
 */
export const usersStorage: UserStorage = new Map<string, User>();

/**
 * Authorization codes storage - Maps code to AuthorizationCode entity
 */
export const authCodesStorage: AuthCodeStorage = new Map<
	string,
	AuthorizationCode
>();

// ==================== Initialization Functions ====================

/**
 * Loads initial product data from JSON file into storage
 * @throws {Error} If file cannot be read or parsed
 */
export function loadInitialProducts(): void {
	try {
		const dataPath = join(process.cwd(), "data", "products.json");
		const fileContent = readFileSync(dataPath, "utf-8");
		const products: Product[] = JSON.parse(fileContent);

		// Clear existing data and load new products
		productsStorage.clear();

		for (const product of products) {
			productsStorage.set(product.id, product);
		}

		console.log(`Loaded ${productsStorage.size} products into storage`);
	} catch (error) {
		console.error("Failed to load initial products:", error);
		throw new Error("Could not initialise product storage");
	}
}

/**
 * Clears all storage (useful for testing)
 */
export function clearAllStorage(): void {
	productsStorage.clear();
	usersStorage.clear();
	authCodesStorage.clear();
}

/**
 * Gets storage statistics for monitoring
 * @returns Object containing counts of stored entities
 */
export function getStorageStats(): {
	products: number;
	users: number;
	authCodes: number;
} {
	return {
		products: productsStorage.size,
		users: usersStorage.size,
		authCodes: authCodesStorage.size,
	};
}

// ==================== Cleanup Functions ====================

/**
 * Removes expired authorization codes from storage
 * Should be called periodically to prevent memory leaks
 * @returns Number of expired codes removed
 */
export function cleanupExpiredAuthCodes(): number {
	const now = new Date();
	let removedCount = 0;

	for (const [code, authCode] of authCodesStorage.entries()) {
		if (authCode.expiresAt < now || authCode.used) {
			authCodesStorage.delete(code);
			removedCount++;
		}
	}

	if (removedCount > 0) {
		console.log(`Cleaned up ${removedCount} expired/used authorization codes`);
	}

	return removedCount;
}

/**
 * Initialises periodic cleanup of expired auth codes
 * Runs every 5 minutes
 * @returns Interval ID for potential cleanup
 */
export function startAuthCodeCleanup(): NodeJS.Timeout {
	const cleanupInterval = 5 * 60 * 1000; // 5 minutes
	return setInterval(() => {
		cleanupExpiredAuthCodes();
	}, cleanupInterval);
}
