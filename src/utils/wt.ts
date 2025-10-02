/**
 * JWT token generation and verification utilities using jose library
 * Provides secure token handling with modern cryptographic standards
 */

import { SignJWT, jwtVerify } from 'jose';
import type { JwtPayload } from '../types/index.js';
import { loadConfig, parseDuration } from './config.js';

const config = loadConfig();

/**
 * Converts JWT secret string to Uint8Array for jose library
 * @param secret - JWT secret string
 * @returns Uint8Array representation of the secret
 */
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Generates a JWT access token for authenticated user
 * @param email - User email address
 * @returns Signed JWT token string
 */
export async function generateAccessToken(email: string): Promise<string> {
  const secretKey = getSecretKey(config.jwtSecret);
  const expirationMs = parseDuration(config.jwtExpiration);
  const expirationSeconds = Math.floor(expirationMs / 1000);

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: email,
    iss: config.jwtIssuer,
    aud: config.jwtAudience,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirationSeconds}s`)
    .sign(secretKey);

  return token;
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload if valid
 * @throws {Error} If token is invalid or expired
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  try {
    const secretKey = getSecretKey(config.jwtSecret);

    const { payload } = await jwtVerify(token, secretKey, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    return payload as JwtPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed: Unknown error');
  }
}

/**
 * Extracts token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns Extracted token or null if invalid format
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null;
}

/**
 * Gets token expiration time in seconds
 * @returns Number of seconds until token expires
 */
export function getTokenExpirationSeconds(): number {
  const expirationMs = parseDuration(config.jwtExpiration);
  return Math.floor(expirationMs / 1000);
}
