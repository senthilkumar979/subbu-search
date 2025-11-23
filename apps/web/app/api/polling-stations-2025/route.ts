import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LegacyPart2025 from '@/lib/models/LegacyPart2025';
import Map20252002Part from '@/lib/models/Map20252002Part';
import { withApiProtection } from '@/lib/api-middleware';

async function handleGET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const constituency = searchParams.get('constituency'); // e.g., "AC210" - for database mapping
    const acNo2025 = searchParams.get('acNo2025'); // Direct 2025 AC number

    let pollingStations;

    if (acNo2025) {
      // Direct fetch: Get all polling stations from the specified 2025 AC
      const acNumber = parseInt(acNo2025);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pollingStations = await (LegacyPart2025 as any).find({
        acNo: acNumber,
      })
        .sort({ acNo: 1, partNo: 1 })
        .select({ acNo: 1, partNo: 1, partNameV1: 1, partNameTn: 1, localityV1: 1, localityTn: 1 })
        .lean()
        .exec();
    } else if (constituency) {
      // Database mapping: Extract AC number from constituency (e.g., "AC210" -> 210)
      const acNo2002 = parseInt(constituency.replace('AC', ''));

      // Find all 2025 AC:Part combinations that map to this 2002 AC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappings = await (Map20252002Part as any).find({
        acNo2002: acNo2002,
      }).select({ acNo2025: 1, partNo2025: 1 }).lean().exec();

      if (mappings && mappings.length > 0) {
        // Filter out AC 213 for AC224
        let filteredMappings = mappings;
        if (acNo2002 === 224) {
          filteredMappings = mappings.filter((m: any) => m.acNo2025 !== 213);
        }

        if (filteredMappings.length > 0) {
          // Create filter conditions for specific 2025 AC:Part combinations
          const stationFilters = filteredMappings.map((m: any) => ({
            acNo: m.acNo2025,
            partNo: m.partNo2025,
          }));

          // Fetch only the specific 2025 polling stations that are mapped
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pollingStations = await (LegacyPart2025 as any).find({
            $or: stationFilters,
          })
            .sort({ acNo: 1, partNo: 1 })
            .select({ acNo: 1, partNo: 1, partNameV1: 1, partNameTn: 1, localityV1: 1, localityTn: 1 })
            .lean()
            .exec();
        } else {
          // No mappings found after filtering
          pollingStations = [];
        }
      } else {
        // No mappings found for this AC
        pollingStations = [];
      }
    } else {
      // No constituency filter, return all polling stations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pollingStations = await (LegacyPart2025 as any).find({})
        .sort({ acNo: 1, partNo: 1 })
        .select({ acNo: 1, partNo: 1, partNameV1: 1, partNameTn: 1, localityV1: 1, localityTn: 1 })
        .lean()
        .exec();
    }

    return NextResponse.json({
      success: true,
      data: pollingStations,
    });
  } catch (error) {
    console.error('Polling stations 2025 fetch error:', error);
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
