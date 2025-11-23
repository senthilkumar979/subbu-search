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
import Map20252002Part from '../lib/models/Map20252002Part.js';

// Helper function to clean and parse numeric values
function parseNumber(value: any): number {
  if (!value) return 0;
  // Remove any non-numeric characters (like backticks, spaces, etc.) except digits
  const cleaned = value.toString().replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

async function importMap20252002() {
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
    const filePath = path.join(__dirname, '..', '..', '..', 'excel-data', '2025_2002_mapping.xlsx');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Read first sheet

    if (!sheetName) {
      throw new Error('No sheets found in the Excel file');
    }

    console.log(`Reading sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    console.log(`Found ${data.length} rows in Excel file`);

    // Clear existing data in map_2025_2002_part collection
    console.log('Clearing existing data in map_2025_2002_part collection...');
    // @ts-expect-error - Mongoose typing issue with empty query object
    await Map20252002Part.deleteMany({});

    const mappings = [];
    let processed = 0;

    for (const row of data as any[]) {
      try {
        const mapping = {
          acNo2002: parseNumber(row.AC_NO_2002 || row['AC_NO_2002']),
          partNo2002: parseNumber(row.part_no_2002 || row['part_no_2002']),
          acNo2025: parseNumber(row.AC_NO_2025 || row['AC_NO_2025']),
          partNo2025: parseNumber(row.part_no_2025 || row['part_no_2025']),
        };

        // Only add if we have all required fields
        if (mapping.acNo2002 && mapping.partNo2002 && mapping.acNo2025 && mapping.partNo2025) {
          mappings.push(mapping);
          processed++;

          // Batch insert every 500 records
          if (mappings.length >= 500) {
            // @ts-expect-error - Mongoose typing issue with document creation
            await Map20252002Part.insertMany(mappings);
            console.log(`Inserted ${processed} records...`);
            mappings.length = 0;
          }
        }
      } catch (err) {
        console.error(`Error processing row ${processed + 1}:`, err);
      }
    }

    // Insert remaining records
    if (mappings.length > 0) {
      // @ts-expect-error - Mongoose typing issue with document creation
      await Map20252002Part.insertMany(mappings);
      console.log(`Inserted remaining ${mappings.length} records`);
    }

    console.log(`\nMap20252002Part import completed! Total records imported: ${processed}`);
    console.log(`Total Map20252002Part records in database: ${await Map20252002Part.countDocuments()}`);

    console.log('\n=== Import completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importMap20252002();
