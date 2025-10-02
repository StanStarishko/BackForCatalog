/**
 * Catalogue service
 * Handles product retrieval and catalogue operations
 */

import { productsStorage } from '../storage/index.js';
import type { CatalogueResponse, PaginationQuery, Product } from '../types/index.js';

/**
 * Retrieves paginated catalogue of active products
 * Works correctly even with empty storage
 * @param paginationQuery - Pagination parameters (page and limit)
 * @returns Paginated catalogue response with products and metadata
 */
export function getCatalogue(paginationQuery: PaginationQuery): CatalogueResponse {
  const page = paginationQuery.page ?? 1;
  const limit = paginationQuery.limit ?? 10;

  // Filter only active products
  const activeProducts: Product[] = [];
  
  // Handle empty storage gracefully
  if (productsStorage.size === 0) {
    console.warn('Product storage is empty - returning empty catalogue');
    return {
      products: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
      },
    };
  }

  for (const product of productsStorage.values()) {
    if (product.status === 'active') {
      activeProducts.push(product);
    }
  }

  // Calculate pagination
  const totalItems = activeProducts.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;

  // Get products for current page
  const paginatedProducts = activeProducts.slice(startIdx, endIdx);

  return {
    products: paginatedProducts,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

/**
 * Retrieves a single product by ID
 * @param productId - Product identifier
 * @returns Product if found and active, null otherwise
 */
export function getProductById(productId: string): Product | null {
  // Handle empty storage
  if (productsStorage.size === 0) {
    console.warn(`Product lookup failed: storage is empty (productId: ${productId})`);
    return null;
  }

  const product = productsStorage.get(productId);

  if (!product) {
    return null;
  }

  if (product.status !== 'active') {
    return null;
  }

  return product;
}

/**
 * Checks if product exists and has sufficient inventory
 * @param productId - Product identifier
 * @param requestedQuantity - Quantity requested
 * @returns Object indicating availability and error message if unavailable
 */
export function checkProductAvailability(
  productId: string,
  requestedQuantity: number
): { available: boolean; error?: string } {
  // Handle empty storage
  if (productsStorage.size === 0) {
    return {
      available: false,
      error: 'Product catalogue is currently unavailable. Please try again later.',
    };
  }

  const product = productsStorage.get(productId);

  if (!product) {
    return { available: false, error: 'Product not found' };
  }

  if (product.status !== 'active') {
    return { available: false, error: 'Product is not available for purchase' };
  }

  if (product.inventory < requestedQuantity) {
    return {
      available: false,
      error: `Insufficient inventory. Available: ${product.inventory}, Requested: ${requestedQuantity}`,
    };
  }

  return { available: true };
}

/**
 * Updates product inventory after purchase
 * @param productId - Product identifier
 * @param quantity - Quantity to deduct from inventory
 * @returns True if update successful, false otherwise
 */
export function updateProductInventory(productId: string, quantity: number): boolean {
  // Handle empty storage
  if (productsStorage.size === 0) {
    console.error(`Inventory update failed: storage is empty (productId: ${productId})`);
    return false;
  }

  const product = productsStorage.get(productId);

  if (!product) {
    console.error(`Inventory update failed: product not found (productId: ${productId})`);
    return false;
  }

  // Validate inventory before update
  if (product.inventory < quantity) {
    console.error(
      `Inventory update failed: insufficient stock (productId: ${productId}, available: ${product.inventory}, requested: ${quantity})`
    );
    return false;
  }

  product.inventory -= quantity;
  productsStorage.set(productId, product);

  console.log(`Inventory updated: ${productId} - reduced by ${quantity} (remaining: ${product.inventory})`);
  return true;
}
