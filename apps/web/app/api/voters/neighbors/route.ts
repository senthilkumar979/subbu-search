import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Voter from '@/lib/models/Voter';
import AC210 from '@/lib/models/AC210';
import AC211 from '@/lib/models/AC211';
import AC212 from '@/lib/models/AC212';
import AC224 from '@/lib/models/AC224';
import AC225 from '@/lib/models/AC225';
import AC226 from '@/lib/models/AC226';
import AC227 from '@/lib/models/AC227';
import { Model } from 'mongoose';
import { withApiProtection } from '@/lib/api-middleware';

// Model mapping based on tsc (Taluk/Constituency) parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_MAP: Record<string, Model<any>> = {
  'AC210': AC210,
  'AC211': AC211,
  'AC212': AC212,
  'AC224': AC224,
  'AC225': AC225,
  'AC226': AC226,
  'AC227': AC227,
  'Voter': Voter, // Default/legacy
};

async function handleGET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const tsc = searchParams.get('tsc') || 'Voter';
    const partNo = searchParams.get('partNo');
    const slNoInPart = searchParams.get('slNoInPart');

    // Validate required parameters
    if (!partNo || !slNoInPart) {
      return NextResponse.json(
        {
          success: false,
          error: 'partNo and slNoInPart are required',
        },
        { status: 400 }
      );
    }

    // Select the appropriate model based on tsc parameter
    const Model = MODEL_MAP[tsc] || Voter;

    // Validate tsc parameter
    if (!MODEL_MAP[tsc] && tsc !== 'Voter') {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid tsc parameter. Valid values are: ${Object.keys(MODEL_MAP).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const partNumber = parseInt(partNo);
    const slNumber = parseInt(slNoInPart);

    // Fetch 5 voters before and 5 voters after the selected voter
    // Total 11 voters (5 before + selected + 5 after)
    const neighbors = await Model.aggregate([
      {
        $match: {
          partNo: partNumber,
          slNoInPart: {
            $gte: slNumber - 5,
            $lte: slNumber + 5,
          },
        },
      },
      { $sort: { slNoInPart: 1 } },
      {
        $lookup: {
          from: 'legacyparts',
          let: { acNo: '$acNo', partNo: '$partNo' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$acNo', '$$acNo'] },
                    { $eq: ['$partNo', '$$partNo'] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'legacyPartInfo'
        }
      },
      {
        $addFields: {
          psName: {
            $ifNull: [
              { $arrayElemAt: ['$legacyPartInfo.partNameV1', 0] },
              '$psName'
            ]
          }
        }
      },
      {
        $project: {
          legacyPartInfo: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: neighbors,
      selectedSlNo: slNumber,
    });
  } catch (error) {
    console.error('Neighbors search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching neighbors',
      },
      { status: 500 }
    );
  }
}

// Export with HMAC protection
export const GET = withApiProtection(handleGET);
