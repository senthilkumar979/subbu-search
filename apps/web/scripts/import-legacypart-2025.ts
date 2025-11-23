import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local FIRST, before other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env.local from the apps/web directory
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback to root .env.local if it exists
  const rootEnvPath = path.join(__dirname, '..', '..', '..', '.env.local');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
}

// Now import modules that depend on environment variables
import XLSX from 'xlsx';
import connectDB from '../lib/mongodb.js';
import LegacyPart2025 from '../lib/models/LegacyPart2025.js';

// Helper function to clean and parse numeric values
function parseNumber(value: any): number {
  if (!value) return 0;
  // Remove any non-numeric characters (like backticks, spaces, etc.) except digits
  const cleaned = value.toString().replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

async function importLegacyPart2025() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables. Please check your .env.local file.');
    }

    // Log connection info (masked password)
    const maskedUri = mongoUri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    console.log('Connecting to MongoDB...');
    console.log(`Connection string: ${maskedUri}`);
    await connectDB();
    console.log('Connected to MongoDB successfully!');

    // Define the path to the Excel file
    const filePath = path.join(__dirname, '..', '..', '..', 'excel-data', '2025 PS Master.xlsx');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error('No sheets found in the Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    console.log(`Found ${data.length} rows in Excel file`);

    // Clear existing data in legacypart_2025 collection
    console.log('Clearing existing data in legacypart_2025 collection...');
    // @ts-expect-error - Mongoose typing issue with empty query object
    await LegacyPart2025.deleteMany({});

    const legacyParts = [];
    let processed = 0;

    for (const row of data as any[]) {
      try {
        const legacyPart = {
          acNo: parseNumber(row.AC_NO || row['AC_NO']),
          partNo: parseNumber(row.PART_NO || row['PART_NO']),
          localityTn: row.LOCALITY_TN?.toString() || row['LOCALITY_TN']?.toString() || '',
          partNameTn: row.PART_NAME_TN?.toString() || row['PART_NAME_TN']?.toString() || '',
          localityV1: row.LOCALITY_V1?.toString() || row['LOCALITY_V1']?.toString() || '',
          partNameV1: row.PART_NAME_V1?.toString() || row['PART_NAME_V1']?.toString() || '',
        };

        // Only add if we have required fields (acNo and partNo)
        if (legacyPart.acNo && legacyPart.partNo) {
          legacyParts.push(legacyPart);
          processed++;

          // Batch insert every 100 records
          if (legacyParts.length >= 100) {
            // @ts-expect-error - Mongoose typing issue with document creation
            await LegacyPart2025.insertMany(legacyParts);
            console.log(`Inserted ${processed} records...`);
            legacyParts.length = 0;
          }
        }
      } catch (err) {
        console.error(`Error processing row ${processed + 1}:`, err);
      }
    }

    // Insert remaining records
    if (legacyParts.length > 0) {
      // @ts-expect-error - Mongoose typing issue with document creation
      await LegacyPart2025.insertMany(legacyParts);
      console.log(`Inserted remaining ${legacyParts.length} records`);
    }

    console.log(`\nLegacyPart2025 import completed! Total records imported: ${processed}`);
    console.log(`Total LegacyPart2025 records in database: ${await LegacyPart2025.countDocuments()}`);

    console.log('\n=== Import completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importLegacyPart2025();
