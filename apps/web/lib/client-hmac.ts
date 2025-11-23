/**
 * Client-side signing utilities for API signature authentication
 * Uses Web Crypto API - compatible with browser environments
 *
 * SECURITY MODEL:
 * - Client sends a signing request to a server-side API endpoint
 * - Server generates HMAC signature using API_SECRET (never exposed)
 * - Client includes this signature in subsequent API requests
 * - This prevents direct API access via Postman/curl without the signing endpoint
 */

/**
 * Generates a random nonce for request uniqueness
 * @returns Random base64-encoded nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Requests a signature from the server-side signing endpoint
 * @param payload - Data to be signed
 * @returns Server-generated HMAC signature
 */
async function getServerSignature(payload: string): Promise<string> {
  const response = await fetch("/api/auth/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    throw new Error("Failed to get signature from server");
  }

  const { signature } = await response.json();
  return signature;
}

/**
 * Creates signed headers for API requests
 * @param requestData - Optional request payload to include in signature
 * @returns Headers object with timestamp, nonce, signature, and API key
 */
export async function createSignedHeaders(
  requestData?: Record<string, unknown>
): Promise<HeadersInit> {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_API_KEY environment variable is not configured"
    );
  }

  const timestamp = Date.now();
  const nonce = generateNonce();

  // Create signature payload: combine timestamp, nonce, API key, and optional data
  const signaturePayload = JSON.stringify({
    timestamp,
    nonce,
    apiKey,
    data: requestData || null,
  });

  // Get HMAC signature from server (uses API_SECRET server-side)
  const signature = await getServerSignature(signaturePayload);

  return {
    "X-Timestamp": timestamp.toString(),
    "X-Nonce": nonce,
    "X-Signature": signature,
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch wrapper that automatically adds signed headers
 * @param url - URL to fetch
 * @param options - Standard fetch options
 * @returns Fetch response
 */
export async function signedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Extract request data from body if present
  let requestData: Record<string, unknown> | undefined;

  if (options?.body) {
    try {
      if (typeof options.body === "string") {
        requestData = JSON.parse(options.body);
      }
    } catch {
      // If body is not JSON, proceed without including it in signature
    }
  }

  // Generate signed headers
  const signedHeaders = await createSignedHeaders(requestData);

  // Merge with existing headers
  const mergedHeaders = {
    ...signedHeaders,
    ...(options?.headers || {}),
  };

  // Perform fetch with signed headers
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}

/**
 * Creates signed headers for use with custom fetch implementations
 * Useful when you need the headers separately (e.g., for axios, SWR, etc.)
 * @param method - HTTP method (GET, POST, etc.)
 * @param body - Optional request body
 * @returns Signed headers object
 */
export async function getSignedHeaders(
  method: string = "GET",
  body?: unknown
): Promise<Record<string, string>> {
  let requestData: Record<string, unknown> | undefined;

  if (body && method !== "GET" && method !== "HEAD") {
    try {
      requestData =
        typeof body === "string"
          ? JSON.parse(body)
          : (body as Record<string, unknown>);
    } catch {
      // If body is not parseable, proceed without it
    }
  }

  const headers = await createSignedHeaders(requestData);
  return headers as Record<string, string>;
}
