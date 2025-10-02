/**
 * Checkout service
 * Handles order processing, payment intent creation, and inventory updates
 */

import { randomBytes } from "node:crypto";
import type { CheckoutItem, CheckoutResponse } from "../types/index.js";
import {
	checkProductAvailability,
	getProductById,
	updateProductInventory,
} from "./catalog.js";

/**
 * Generates a mock payment intent ID
 * @returns Unique payment intent identifier
 */
function generatePaymentIntentId(): string {
	return `pi_${randomBytes(16).toString("hex")}`;
}

/**
 * Processes checkout request and creates payment intent
 * @param items - Array of checkout items with product IDs and quantities
 * @returns Checkout response with payment details or error
 * @throws {Error} If validation fails or products unavailable
 */
export function processCheckout(items: CheckoutItem[]): CheckoutResponse {
	// Validate all items first
	for (const item of items) {
		const availability = checkProductAvailability(
			item.productId,
			item.quantity,
		);
		if (!availability.available) {
			throw new Error(`${item.productId}: ${availability.error}`);
		}
	}

	// Calculate total amount and prepare response items
	let totalAmount = 0;
	const responseItems: CheckoutResponse["items"] = [];

	for (const item of items) {
		const product = getProductById(item.productId);

		if (!product) {
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
		status: "pending" as const,
		amount: totalAmount,
	};

	// Update inventory for all items
	for (const item of items) {
		const updated = updateProductInventory(item.productId, item.quantity);
		if (!updated) {
			throw new Error(`Failed to update inventory for ${item.productId}`);
		}
	}

	return {
		success: true,
		totalAmount,
		currency: "GBP",
		paymentIntent,
		items: responseItems,
	};
}

/**
 * Simulates payment processing (mock implementation)
 * In production, this would integrate with payment provider
 * @param _paymentIntentId - Payment intent identifier (unused in mock)
 * @returns Payment status
 */
export function simulatePaymentProcessing(
	_paymentIntentId: string,
): "succeeded" | "failed" | "pending" {
	// Mock: 90% success rate
	const random = Math.random();
	if (random > 0.9) {
		return "failed";
	}
	return "succeeded";
}
