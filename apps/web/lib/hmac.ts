import crypto from 'crypto';

/**
 * Server-side HMAC utilities for API signature authentication
 * Uses Node.js crypto module - NOT compatible with browser environments
 */

const getSecret = (): string => {
  const secret = process.env.API_SECRET;
  if (!secret) {
    throw new Error('API_SECRET environment variable is not configured');
  }
  if (secret.length < 32) {
    throw new Error('API_SECRET must be at least 32 characters long');
  }
  return secret;
};

/**
 * Generates HMAC-SHA256 signature for the given data
 * @param data - Data to sign (typically JSON stringified request data)
 * @returns Base64-encoded HMAC signature
 */
export function generateSignature(data: string): string {
  console.log('Generating signature for data:', data);
  const secret = getSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('base64');
}

/**
 * Verifies HMAC signature using timing-safe comparison
 * @param data - Original data that was signed
 * @param signature - Base64-encoded signature to verify
 * @returns true if signature is valid, false otherwise
 */
export function verifySignature(data: string, signature: string): boolean {
  try {
    const expectedSignature = generateSignature(data);
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    // Timing-safe comparison to prevent timing attacks
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Validates that a timestamp is within an acceptable time window
 * @param timestamp - Unix timestamp in milliseconds
 * @param maxAgeMs - Maximum age of the request in milliseconds (default: 5 minutes)
 * @returns true if timestamp is valid and recent, false otherwise
 */
export function verifyTimestamp(
  timestamp: number,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutes default
): boolean {
  if (!timestamp || typeof timestamp !== 'number') {
    return false;
  }

  const now = Date.now();
  const age = now - timestamp;

  // Check if timestamp is in the past and within acceptable window
  if (age < 0) {
    // Timestamp is in the future (clock skew or manipulation)
    return false;
  }

  if (age > maxAgeMs) {
    // Timestamp is too old
    return false;
  }

  return true;
}
