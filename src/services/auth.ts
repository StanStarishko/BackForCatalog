/**
 * Authentication service
 * Handles OAuth 2.0 flow with authorization codes and JWT tokens
 */

import { randomBytes } from "node:crypto";
import { authCodesStorage, usersStorage } from "../storage/index.js";
import type {
	AuthorizationCode,
	LoginResponse,
	TokenResponse,
	User,
} from "../types/index.js";
import { loadConfig, parseDuration } from "../utils/config.js";
import { generateAccessToken, getTokenExpirationSeconds } from "../utils/wt.js";

const config = await loadConfig();

/**
 * Generates a cryptographically secure authorization code
 * @returns Random authorization code string
 */
function generateAuthorizationCode(): string {
	return randomBytes(32).toString("base64url");
}

/**
 * Calculates expiration date based on configuration
 * @param durationString - Duration string (e.g., "10m")
 * @returns Date object representing expiration time
 */
function calculateExpirationDate(durationString: string): Date {
	const durationMs = parseDuration(durationString);
	return new Date(Date.now() + durationMs);
}

/**
 * Handles user login and generates authorization code
 * Creates user if doesn't exist (auto-registration)
 * @param email - User email address
 * @returns Login response with authorization code
 */
export function handleLogin(email: string): LoginResponse {
	// Create or get user
	let user = usersStorage.get(email);
	if (!user) {
		user = {
			email,
			createdAt: new Date(),
		};
		usersStorage.set(email, user);
	}

	// Generate authorization code
	const authCode = generateAuthorizationCode();
	const expiresAt = calculateExpirationDate(config.oauthCodeExpiration);

	const authorizationCode: AuthorizationCode = {
		code: authCode,
		email,
		expiresAt,
		used: false,
	};

	authCodesStorage.set(authCode, authorizationCode);

	const expirationMs = parseDuration(config.oauthCodeExpiration);
	const expiresInSeconds = Math.floor(expirationMs / 1000);

	return {
		authorizationCode: authCode,
		expiresIn: expiresInSeconds,
	};
}

/**
 * Exchanges authorization code for access token
 * @param code - Authorization code from login
 * @returns Token response with JWT access token
 * @throws {Error} If code is invalid, expired, or already used
 */
export async function exchangeCodeForToken(
	code: string,
): Promise<TokenResponse> {
	const authCode = authCodesStorage.get(code);

	if (!authCode) {
		throw new Error("Invalid authorization code");
	}

	if (authCode.used) {
		throw new Error("Authorization code has already been used");
	}

	if (authCode.expiresAt < new Date()) {
		authCodesStorage.delete(code);
		throw new Error("Authorization code has expired");
	}

	// Mark code as used
	authCode.used = true;
	authCodesStorage.set(code, authCode);

	// Generate JWT access token
	const accessToken = await generateAccessToken(authCode.email);
	const expiresIn = getTokenExpirationSeconds();

	return {
		accessToken,
		tokenType: "Bearer",
		expiresIn,
	};
}

/**
 * Validates that user exists in system
 * @param email - User email address
 * @returns True if user exists, false otherwise
 */
export function validateUserExists(email: string): boolean {
	return usersStorage.has(email);
}

/**
 * Retrieves user by email
 * @param email - User email address
 * @returns User object if found, null otherwise
 */
export function getUserByEmail(email: string): User | null {
	return usersStorage.get(email) ?? null;
}
