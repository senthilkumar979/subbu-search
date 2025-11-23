import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, verifyTimestamp } from './hmac';

/**
 * Required headers for API signature authentication
 */
const REQUIRED_HEADERS = [
  'x-timestamp',
  'x-nonce',
  'x-signature',
  'x-api-key',
] as const;

/**
 * Verification result interface
 */
export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Verifies API request signature and headers
 * @param request - Next.js request object
 * @returns Verification result with validity status and optional error message
 */
export function verifyApiRequest(request: NextRequest): VerificationResult {
  // Check for required headers
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !request.headers.get(header)
  );

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      error: `Missing required headers: ${missingHeaders.join(', ')}`,
    };
  }

  // Extract headers
  const timestamp = request.headers.get('x-timestamp');
  const nonce = request.headers.get('x-nonce');
  const signature = request.headers.get('x-signature');
  const apiKey = request.headers.get('x-api-key');

  // Verify API key
  const expectedApiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!expectedApiKey) {
    return {
      isValid: false,
      error: 'Server configuration error: API key not configured',
    };
  }

  if (apiKey !== expectedApiKey) {
    return {
      isValid: false,
      error: 'Invalid API key',
    };
  }

  // Verify timestamp
  const timestampNum = parseInt(timestamp!, 10);
  if (isNaN(timestampNum)) {
    return {
      isValid: false,
      error: 'Invalid timestamp format',
    };
  }

  if (!verifyTimestamp(timestampNum)) {
    return {
      isValid: false,
      error: 'Request timestamp expired or invalid (must be within 5 minutes)',
    };
  }

  // Verify signature
  // Reconstruct the signature payload to match what the client sent
  const signaturePayload = JSON.stringify({
    timestamp: timestampNum,
    nonce,
    apiKey,
    data: null, // For GET requests or when body is not included in signature
  });

  if (!verifySignature(signaturePayload, signature!)) {
    return {
      isValid: false,
      error: 'Invalid signature',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Verifies API request with body data included in signature
 * @param request - Next.js request object
 * @param bodyData - Parsed request body to include in signature verification
 * @returns Verification result with validity status and optional error message
 */
export async function verifyApiRequestWithBody(
  request: NextRequest,
  bodyData?: Record<string, unknown>
): Promise<VerificationResult> {
  // Check for required headers
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !request.headers.get(header)
  );

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      error: `Missing required headers: ${missingHeaders.join(', ')}`,
    };
  }

  // Extract headers
  const timestamp = request.headers.get('x-timestamp');
  const nonce = request.headers.get('x-nonce');
  const signature = request.headers.get('x-signature');
  const apiKey = request.headers.get('x-api-key');

  // Verify API key
  const expectedApiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!expectedApiKey) {
    return {
      isValid: false,
      error: 'Server configuration error: API key not configured',
    };
  }

  if (apiKey !== expectedApiKey) {
    return {
      isValid: false,
      error: 'Invalid API key',
    };
  }

  // Verify timestamp
  const timestampNum = parseInt(timestamp!, 10);
  if (isNaN(timestampNum)) {
    return {
      isValid: false,
      error: 'Invalid timestamp format',
    };
  }

  if (!verifyTimestamp(timestampNum)) {
    return {
      isValid: false,
      error: 'Request timestamp expired or invalid (must be within 5 minutes)',
    };
  }

  // Verify signature with body data
  const signaturePayload = JSON.stringify({
    timestamp: timestampNum,
    nonce,
    apiKey,
    data: bodyData || null,
  });

  if (!verifySignature(signaturePayload, signature!)) {
    return {
      isValid: false,
      error: 'Invalid signature',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Higher-order function that wraps API route handlers with signature verification
 * @param handler - Original API route handler function
 * @returns Wrapped handler with signature verification
 */
export function withApiProtection(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    // Verify the request
    const verification = verifyApiRequest(request);

    if (!verification.isValid) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: verification.error || 'Invalid API request signature',
        },
        { status: 403 }
      );
    }

    // Call the original handler if verification succeeds
    return handler(request, context);
  };
}

/**
 * Higher-order function for POST/PUT/PATCH requests that includes body in verification
 * @param handler - Original API route handler function that receives parsed body
 * @returns Wrapped handler with signature verification including body
 */
export function withApiProtectionAndBody<T = Record<string, unknown>>(
  handler: (request: NextRequest, body: T, context?: unknown) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    // Parse request body
    let bodyData: T;
    try {
      bodyData = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }

    // Verify the request with body
    const verification = await verifyApiRequestWithBody(request, bodyData as Record<string, unknown>);

    if (!verification.isValid) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: verification.error || 'Invalid API request signature',
        },
        { status: 403 }
      );
    }

    // Call the original handler if verification succeeds
    return handler(request, bodyData, context);
  };
}
