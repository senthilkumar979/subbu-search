import { NextRequest, NextResponse } from 'next/server';
import { withApiProtection, withApiProtectionAndBody } from '@/lib/api-middleware';

/**
 * Example protected GET endpoint
 *
 * This endpoint requires HMAC signature authentication.
 * Direct access via Postman/curl will be blocked unless proper signatures are provided.
 *
 * Usage from client:
 * ```typescript
 * import { signedFetch } from '@/lib/client-hmac';
 *
 * const response = await signedFetch('/api/example/protected');
 * const data = await response.json();
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleGET(_request: NextRequest) {
  // Your protected logic here
  return NextResponse.json({
    success: true,
    message: 'This is a protected endpoint',
    timestamp: new Date().toISOString(),
    data: {
      example: 'This data can only be accessed with valid HMAC signature',
    },
  });
}

/**
 * Example protected POST endpoint with body validation
 *
 * This endpoint requires HMAC signature authentication including the request body.
 *
 * Usage from client:
 * ```typescript
 * import { signedFetch } from '@/lib/client-hmac';
 *
 * const response = await signedFetch('/api/example/protected', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John', email: 'john@example.com' })
 * });
 * ```
 */
async function handlePOST(
  request: NextRequest,
  body: { name: string; email: string }
) {
  // Validate body data
  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email' },
      { status: 400 }
    );
  }

  // Your protected logic here
  return NextResponse.json({
    success: true,
    message: 'Data received and processed securely',
    receivedData: body,
    timestamp: new Date().toISOString(),
  });
}

// Export protected endpoints
export const GET = withApiProtection(handleGET);
export const POST = withApiProtectionAndBody<{ name: string; email: string }>(handlePOST);
