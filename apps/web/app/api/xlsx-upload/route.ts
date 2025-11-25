import { withApiProtectionAndBody } from "@/lib/api-middleware";
import AC177 from "@/lib/models/AC177";
import connectDB from "@/lib/mongodb";
import Sanscript from "@indic-transliteration/sanscript";
import { NextRequest, NextResponse } from "next/server";

interface UploadRequestBody {
  data: Array<Record<string, string | number | null>>;
  collectionName: string;
}

function transliterateToEnglish(tamilText: string): string {
  if (!tamilText) return "";
  try {
    return Sanscript.t(tamilText, "tamil", "iso");
  } catch (error) {
    console.warn("Transliteration error:", error);
    return "";
  }
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  const cleaned = value.toString().replace(/[^\d]/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
}

function mapRowToAC177(
  row: Record<string, string | number | null>
): Partial<import("@/lib/models/AC177").IAC177> {
  // Helper to get value with multiple possible key variations
  const getValue = (...keys: string[]): string => {
    for (const key of keys) {
      const value =
        row[key] || row[key.toUpperCase()] || row[key.toLowerCase()];
      if (value !== null && value !== undefined) {
        return value.toString().trim();
      }
    }
    return "";
  };

  const getNumber = (...keys: string[]): number | undefined => {
    for (const key of keys) {
      const value =
        row[key] || row[key.toUpperCase()] || row[key.toLowerCase()];
      if (value !== null && value !== undefined) {
        return parseNumber(value);
      }
    }
    return undefined;
  };

  // Map common header variations to AC177 schema
  const acNo = getNumber(
    "AC_NO",
    "ACNO",
    "acNo",
    "AC No",
    "Assembly Constituency"
  );
  const partNo = getNumber(
    "PART_NO",
    "PARTNO",
    "partNo",
    "Part No",
    "Part Number"
  );
  const slNoInPart = getNumber(
    "SLNOINPART",
    "SL_NO_IN_PART",
    "slNoInPart",
    "Serial No",
    "Serial Number"
  );

  const fmNameV2 = getValue(
    "FM_NAME_V2",
    "FMNAMEV2",
    "fmNameV2",
    "Name",
    "Voter Name",
    "Elector Name"
  );
  const rlnFmNmV2 = getValue(
    "RLN_FM_NM_V2",
    "RLNFMNMV2",
    "rlnFmNmV2",
    "Relation Name",
    "Father Name",
    "Husband Name"
  );

  return {
    acNo: acNo || 0,
    partNo: partNo || 0,
    slNoInPart: slNoInPart || 0,
    houseNo:
      getValue("HOUSE_NO", "HOUSENO", "houseNo", "House No", "House Number") ||
      undefined,
    sectionNo:
      getValue(
        "SECTION_NO",
        "SECTIONNO",
        "sectionNo",
        "Section No",
        "Section Number"
      ) || undefined,
    fmNameV2: fmNameV2 || undefined,
    fmNameEn: fmNameV2 ? transliterateToEnglish(fmNameV2) : undefined,
    rlnFmNmV2: rlnFmNmV2 || undefined,
    rlnFmNmEn: rlnFmNmV2 ? transliterateToEnglish(rlnFmNmV2) : undefined,
    rlnType:
      getValue("RLN_TYPE", "RLNTYPE", "rlnType", "Relation Type") || undefined,
    age: getNumber("AGE", "age", "Age") || undefined,
    sex: getValue("SEX", "sex", "Gender", "Sex") || undefined,
    idCardNo:
      getValue("IDCARD_NO", "IDCARDNO", "idCardNo", "ID Card No", "EPIC No") ||
      undefined,
    psName:
      getValue(
        "PS_NAME",
        "PSNAME",
        "psName",
        "Polling Station",
        "Polling Station Name"
      ) || undefined,
  };
}

async function handlePOST(
  request: NextRequest,
  body: UploadRequestBody
): Promise<NextResponse> {
  try {
    // Validate MongoDB connection string exists
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MONGODB_URI environment variable is not configured. Please check your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Validate connection string format
    if (
      !mongoUri.startsWith("mongodb://") &&
      !mongoUri.startsWith("mongodb+srv://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://",
        },
        { status: 500 }
      );
    }

    await connectDB();

    const { data, collectionName } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No data provided or data is not an array",
        },
        { status: 400 }
      );
    }

    if (collectionName !== "AC177") {
      return NextResponse.json(
        {
          success: false,
          error: "Only AC177 collection is supported",
        },
        { status: 400 }
      );
    }

    // Map data to AC177 schema
    const mappedRecords: Array<import("@/lib/models/AC177").IAC177> = [];
    let validRecords = 0;
    let skippedRecords = 0;

    for (const row of data) {
      try {
        const mapped = mapRowToAC177(row);

        // Only add if we have required fields
        if (mapped.acNo && mapped.partNo && mapped.slNoInPart) {
          // Type assertion is safe here because we've verified required fields exist
          mappedRecords.push(mapped as import("@/lib/models/AC177").IAC177);
          validRecords++;
        } else {
          skippedRecords++;
        }
      } catch (error) {
        console.error("Error mapping row:", error);
        skippedRecords++;
      }
    }

    if (mappedRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No valid records found after mapping. Please check your data format.",
          skipped: skippedRecords,
        },
        { status: 400 }
      );
    }

    // Batch insert records
    const batchSize = 1000;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < mappedRecords.length; i += batchSize) {
      const batch = mappedRecords.slice(i, i + batchSize);
      try {
        await AC177.insertMany(batch, { ordered: false });
        inserted += batch.length;
        console.log(
          `Inserted ${inserted} of ${mappedRecords.length} records...`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMessage}`);
        console.error(
          `Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data uploaded successfully",
      stats: {
        total: data.length,
        valid: validRecords,
        inserted,
        skipped: skippedRecords,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Provide more helpful error messages for common MongoDB connection issues
    let errorMessage = "An error occurred while uploading data";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common MongoDB connection errors
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("querySrv")
      ) {
        errorMessage =
          "MongoDB connection failed. Please check your MONGODB_URI in .env.local file. The connection string may be missing or incorrectly formatted. Expected format: mongodb+srv://username:password@cluster.mongodb.net/database";
      } else if (error.message.includes("authentication failed")) {
        errorMessage =
          "MongoDB authentication failed. Please check your username and password in the connection string.";
      } else if (error.message.includes("timeout")) {
        errorMessage =
          "MongoDB connection timeout. Please check your network connection and MongoDB server status.";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = withApiProtectionAndBody<UploadRequestBody>(handlePOST);
