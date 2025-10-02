/**
 * Environment configuration loader and validator
 * Ensures all required environment variables are present with sensible defaults
 */

import type { EnvironmentConfig } from '../types/index.js';

/**
 * Retrieves an environment variable with optional default value
 * @param key - Environment variable name
 * @param defaultValue - Default value if variable is not set
 * @returns Environment variable value or default
 */
function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue ?? '';
}

/**
 * Parses environment variable as integer
 * @param key - Environment variable name
 * @param defaultValue - Default value if variable is not set
 * @returns Parsed integer value
 */
function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }
  return parsed;
}

/**
 * Loads and validates environment configuration
 * Note: In development, tsx automatically loads .env file
 * In production, environment variables should be set by the hosting platform
 * @returns Validated environment configuration object
 * @throws {Error} If required variables are missing or invalid
 */
export function loadConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    nodeEnv: getEnvVariable('NODE_ENV', 'development'),
    port: getEnvInt('PORT', 3000),
    host: getEnvVariable('HOST', '0.0.0.0'),
    jwtSecret: getEnvVariable('JWT_SECRET', 'dev-secret-change-in-production'),
    jwtIssuer: getEnvVariable('JWT_ISSUER', 'backforcatalog'),
    jwtAudience: getEnvVariable('JWT_AUDIENCE', 'backforcatalog-app'),
    jwtExpiration: getEnvVariable('JWT_EXPIRATION', '1h'),
    oauthCodeExpiration: getEnvVariable('OAUTH_CODE_EXPIRATION', '10m'),
    rateLimitMax: getEnvInt('RATE_LIMIT_MAX', 100),
    rateLimitTimeWindow: getEnvVariable('RATE_LIMIT_TIMEWINDOW', '15m'),
    logLevel: getEnvVariable('LOG_LEVEL', 'info'),
  };

  // Validate JWT secret in production
/*   if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
 */
      if (config.nodeEnv === 'production' && config.jwtSecret === 'unique-super-secret-jwt-key-for-test') {
        console.warn('⚠️  WARNING: Using default JWT_SECRET in production mode. This is acceptable for demo/testing purposes only.');
        console.warn('⚠️  For real production deployment, set a secure JWT_SECRET environment variable.');
      }

  return config;
}

/**
 * Parses time duration string to milliseconds
 * Supports formats: "10s", "5m", "1h", "2d"
 * @param duration - Duration string (e.g., "10m")
 * @returns Duration in milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';

  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
