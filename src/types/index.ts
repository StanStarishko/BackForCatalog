/**
 * Core type definitions for BackForCatalog
 * All interfaces and types used across the application
 */

// ==================== Product Types ====================

/**
 * Product variant representation
 */
export interface ProductVariant {
	id: string;
	title: string;
}

/**
 * Product status enumeration
 */
export type ProductStatus = "active" | "draft" | "archived";

/**
 * Complete product entity
 */
export interface Product {
	id: string;
	title: string;
	status: ProductStatus;
	price: number;
	inventory: number;
	variants: ProductVariant[];
}

// ==================== User & Authentication Types ====================

/**
 * User entity for authentication
 */
export interface User {
	email: string;
	createdAt: Date;
}

/**
 * OAuth authorization code entity
 * Temporary code exchanged for access token
 */
export interface AuthorizationCode {
	code: string;
	email: string;
	expiresAt: Date;
	used: boolean;
}

/**
 * JWT token payload structure
 */
export interface JwtPayload {
	sub: string; // Subject (user email)
	iat: number; // Issued at
	exp: number; // Expiration time
	iss: string; // Issuer
	aud: string; // Audience
}

// ==================== API Request Types ====================

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
	page?: number;
	limit?: number;
}

/**
 * Checkout item in request body
 */
export interface CheckoutItem {
	productId: string;
	quantity: number;
}

/**
 * Checkout request body
 */
export interface CheckoutRequest {
	items: CheckoutItem[];
}

/**
 * Login request body
 */
export interface LoginRequest {
	email: string;
}

/**
 * Token exchange request body
 */
export interface TokenRequest {
	code: string;
}

// ==================== API Response Types ====================

/**
 * Paginated catalogue response
 */
export interface CatalogueResponse {
	products: Product[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
	};
}

/**
 * Checkout response with payment intent
 */
export interface CheckoutResponse {
	success: boolean;
	totalAmount: number;
	currency: string;
	paymentIntent: {
		id: string;
		status: "pending" | "succeeded" | "failed";
		amount: number;
	};
	items: Array<{
		productId: string;
		quantity: number;
		unitPrice: number;
		subtotal: number;
	}>;
}

/**
 * Login response with authorization code
 */
export interface LoginResponse {
	authorizationCode: string;
	expiresIn: number; // Seconds until expiration
}

/**
 * Token response with JWT access token
 */
export interface TokenResponse {
	accessToken: string;
	tokenType: "Bearer";
	expiresIn: number; // Seconds until expiration
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

// ==================== Storage Types ====================

/**
 * In-memory storage structure for products
 */
export type ProductStorage = Map<string, Product>;

/**
 * In-memory storage structure for users
 */
export type UserStorage = Map<string, User>;

/**
 * In-memory storage structure for authorization codes
 */
export type AuthCodeStorage = Map<string, AuthorizationCode>;

// ==================== Utility Types ====================

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
	nodeEnv: string;
	port: number;
	host: string;
	jwtSecret: string;
	jwtIssuer: string;
	jwtAudience: string;
	jwtExpiration: string;
	oauthCodeExpiration: string;
	rateLimitMax: number;
	rateLimitTimeWindow: string;
	logLevel: string;
}

/**
 * Validation result with typed error
 */
export interface ValidationResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}
