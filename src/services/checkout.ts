/**
 * Checkout service
 * Handles order processing, payment intent creation, and inventory updates
 */

import { randomBytes } from 'node:crypto';
import { productsStorage } from '../storage/index.js';
import type { CheckoutItem, CheckoutResponse } from '../types/index.js';
import {
  checkProductAvailability,
  getProductById,
  updateProductInventory,
} from './catalog.js';

/**
 * Generates a mock payment intent ID
 * @returns Unique payment intent identifier
 */
function generatePaymentIntentId(): string {
  return `pi_${randomBytes(16).toString('hex')}`;
}

/**
 * Processes checkout request and creates payment intent
 * Handles empty storage gracefully without crashing
 * @param items - Array of checkout items with product IDs and quantities
 * @returns Checkout response with payment details or error
 * @throws {Error} If validation fails or products unavailable
 */
export function processCheckout(items: CheckoutItem[]): CheckoutResponse {
  // Check if storage is available
  if (productsStorage.size === 0) {
    console.error('Checkout failed: product storage is empty');
    throw new Error(
      'Product catalogue is currently unavailable. Unable to process checkout. Please try again later.'
    );
  }

  // Validate all items first
  for (const item of items) {
    const availability = checkProductAvailability(item.productId, item.quantity);
    if (!availability.available) {
      console.warn(`Checkout validation failed for ${item.productId}: ${availability.error}`);
      throw new Error(`${item.productId}: ${availability.error}`);
    }
  }

  // Calculate total amount and prepare response items
  let totalAmount = 0;
  const responseItems: CheckoutResponse['items'] = [];

  for (const item of items) {
    const product = getProductById(item.productId);

    if (!product) {
      console.error(`Checkout failed: product ${item.productId} not found during processing`);
      throw new Error(`Product ${item.productId} not found`);
    }

    const subtotal = product.price * item.quantity;
    totalAmount += subtotal;

    responseItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal,
    });
  }

  // Create mock payment intent
  const paymentIntent = {
    id: generatePaymentIntentId(),
    status: 'pending' as const,
    amount: totalAmount,
  };

  // Update inventory for all items
  const inventoryUpdates: Array<{ productId: string; quantity: number }> = [];
  
  try {
    for (const item of items) {
      const updated = updateProductInventory(item.productId, item.quantity);
      
      if (!updated) {
        // Rollback previous inventory updates
        console.error(`Inventory update failed for ${item.productId}, rolling back...`);
        rollbackInventoryUpdates(inventoryUpdates);
        throw new Error(`Failed to update inventory for ${item.productId}`);
      }
      
      inventoryUpdates.push({ productId: item.productId, quantity: item.quantity });
    }
  } catch (error) {
    // Ensure rollback happened
    rollbackInventoryUpdates(inventoryUpdates);
    throw error;
  }

  console.log(`Checkout successful: ${items.length} items, total: £${totalAmount.toFixed(2)}`);

  return {
    success: true,
    totalAmount,
    currency: 'GBP',
    paymentIntent,
    items: responseItems,
  };
}

/**
 * Rolls back inventory updates in case of checkout failure
 * @param updates - Array of inventory updates to rollback
 */
function rollbackInventoryUpdates(
  updates: Array<{ productId: string; quantity: number }>
): void {
  if (updates.length === 0) {
    return;
  }

  console.warn(`Rolling back ${updates.length} inventory updates`);

  for (const update of updates) {
    const product = productsStorage.get(update.productId);
    if (product) {
      product.inventory += update.quantity; // Add back the quantity
      productsStorage.set(update.productId, product);
      console.log(`Rolled back inventory for ${update.productId}: +${update.quantity}`);
    }
  }
}

/**
 * Simulates payment processing (mock implementation)
 * In production, this would integrate with payment provider
 * @param _paymentIntentId - Payment intent identifier (unused in mock)
 * @returns Payment status
 */
export function simulatePaymentProcessing(
  _paymentIntentId: string
): 'succeeded' | 'failed' | 'pending' {
  // Mock: 90% success rate
  const random = Math.random();
  if (random > 0.9) {
    return 'failed';
  }
  return 'succeeded';
}
