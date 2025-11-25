import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/hmac';
import { verifyTimestamp } from '@/lib/hmac';

/**
 * POST /api/auth/sign
 *
 * Server-side signing endpoint that generates HMAC signatures
 * This endpoint should be protected by your authentication system
 * (e.g., require user session, rate limiting, etc.)
 *
 * Security considerations:
 * - Only accessible from same-origin by default (CORS not enabled)
 * - Should implement rate limiting in production
 * - Should validate user session/authentication
 * - Timestamp validation prevents replay attacks
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { payload } = await request.json();
    if (!payload || typeof payload !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Parse and validate the payload
    let payloadData;
    try {
      payloadData = JSON.parse(payload);
    } catch {
      return NextResponse.json(
        { error: 'Payload must be valid JSON string' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payloadData.timestamp || !payloadData.nonce || !payloadData.apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, nonce, apiKey' },
        { status: 400 }
      );
    }

    // Verify API key
    // Ensure NEXT_PUBLIC_API_KEY is loaded server-side; use process.env directly
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (payloadData.apiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    // Verify timestamp (prevent old signature requests)
    if (!verifyTimestamp(payloadData.timestamp, 60000)) { // 1 minute window for signing
      return NextResponse.json(
        { error: 'Timestamp expired or invalid' },
        { status: 400 }
      );
    }

    // TODO: Add additional security checks:
    // - Rate limiting per IP/session
    // - User authentication verification
    // - CSRF token validation
    // - Request origin validation

    // Generate HMAC signature using server-side secret
    const signature = generateSignature(payload);
    console.log('Signature:', signature);

    return NextResponse.json(
      { signature },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        }
      }
    );

  } catch (error) {
    console.error('Signing endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
