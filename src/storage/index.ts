/**
 * In-memory storage implementation using Map
 * Provides fast key-value access for products, users, and authorization codes
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AuthCodeStorage,
  AuthorizationCode,
  Product,
  ProductStorage,
  User,
  UserStorage,
} from '../types/index.js';

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
export const authCodesStorage: AuthCodeStorage = new Map<string, AuthorizationCode>();

/**
 * Storage health status flag
 */
let storageHealthy = false;

// ==================== Initialization Functions ====================

/**
 * Loads initial product data from JSON file into storage
 * Does not throw errors - logs them and continues with empty storage
 * @returns Number of products loaded successfully
 */
export function loadInitialProducts(): number {
  try {
    const dataPath = join(process.cwd(), 'data', 'products.json');
    const fileContent = readFileSync(dataPath, 'utf-8');
    const products: Product[] = JSON.parse(fileContent);

    // Clear existing data and load new products
    productsStorage.clear();

    for (const product of products) {
      productsStorage.set(product.id, product);
    }

    storageHealthy = true;
    console.log(`✓ Successfully loaded ${productsStorage.size} products into storage`);
    return productsStorage.size;
  } catch (error) {
    storageHealthy = false;
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('✗ Product data file not found: data/products.json');
        console.error('✗ Server will start with empty product catalogue');
        console.error('✗ Please ensure data/products.json exists or connect to a database');
      } else if (error instanceof SyntaxError) {
        console.error('✗ Failed to parse products.json: Invalid JSON format');
        console.error(`✗ Error: ${error.message}`);
      } else {
        console.error('✗ Failed to load product data:', error.message);
      }
    } else {
      console.error('✗ Failed to load product data: Unknown error');
    }

    console.warn('⚠ Application will continue with empty product storage');
    console.warn('⚠ Product-related endpoints will return empty results');
    
    return 0;
  }
}

/**
 * Checks if storage has been successfully initialized with data
 * @returns True if storage is healthy and has data
 */
export function isStorageHealthy(): boolean {
  return storageHealthy && productsStorage.size > 0;
}

/**
 * Gets storage health status with details
 * @returns Object containing health status and details
 */
export function getStorageHealth(): {
  healthy: boolean;
  hasProducts: boolean;
  message: string;
} {
  const hasProducts = productsStorage.size > 0;
  
  return {
    healthy: storageHealthy,
    hasProducts,
    message: hasProducts
      ? 'Storage is healthy and operational'
      : 'Storage is empty - no product data available',
  };
}

/**
 * Clears all storage (useful for testing)
 */
export function clearAllStorage(): void {
  productsStorage.clear();
  usersStorage.clear();
  authCodesStorage.clear();
  storageHealthy = false;
}

/**
 * Gets storage statistics for monitoring
 * @returns Object containing counts of stored entities
 */
export function getStorageStats(): {
  products: number;
  users: number;
  authCodes: number;
  healthy: boolean;
} {
  return {
    products: productsStorage.size,
    users: usersStorage.size,
    authCodes: authCodesStorage.size,
    healthy: storageHealthy,
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
