import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LegacyPart from '@/lib/models/LegacyPart';
import { withApiProtection } from '@/lib/api-middleware';

async function handleGET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const tsc = searchParams.get('tsc');

    if (!tsc) {
      return NextResponse.json(
        {
          success: false,
          error: 'Constituency (tsc) parameter is required',
        },
        { status: 400 }
      );
    }

    // Extract AC number from tsc (e.g., "AC210" -> 210)
    const acNo = parseInt(tsc.replace('AC', ''));

    // Fetch polling stations for this constituency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pollingStations = await (LegacyPart as any).find({ acNo: acNo })
      .sort({ partNo: 1 })
      .select({ partNo: 1, partNameV1: 1, partNameEn: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: pollingStations,
    });
  } catch (error) {
    console.error('Polling stations fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching polling stations',
      },
      { status: 500 }
    );
  }
}

// Export with HMAC protection
export const GET = withApiProtection(handleGET);
