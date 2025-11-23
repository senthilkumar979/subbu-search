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
import mongoose from 'mongoose';
import connectDB from '../lib/mongodb.js';
import Voter from '../lib/models/Voter.js';
import LegacyPart from '../lib/models/LegacyPart.js';
import Sanscript from '@indic-transliteration/sanscript';

// Helper function to transliterate Tamil to English
function transliterateToEnglish(tamilText: string): string {
  if (!tamilText) return '';
  try {
    // Convert Tamil script to ISO romanization (Latin)
    return Sanscript.t(tamilText, 'tamil', 'iso');
  } catch (error) {
    console.warn('Transliteration error:', error);
    return '';
  }
}

async function importData() {
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

    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '..', '..', '2002 EROLL Detail AC 210 Part No 1.xlsx'),
      path.join(process.cwd(), '2002 EROLL Detail AC 210 Part No 1.xlsx'),
      path.join(__dirname, '..', '..', '..', '2002 EROLL Detail AC 210 Part No 1.xlsx'),
    ];

    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      throw new Error(
        `File not found. Please ensure "2002 EROLL Detail AC 210 Part No 1.xlsx" is in the project root directory.\nTried paths:\n${possiblePaths.join('\n')}`
      );
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

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    // @ts-expect-error - Mongoose typing issue with empty query object
    await Voter.deleteMany({});

    const voters = [];
    let processed = 0;

    for (const row of data as any[]) {
      try {
        const fmNameV2 = row.FM_NAME_V2?.toString() || row['FM_NAME_V2']?.toString() || '';
        const rlnFmNmV2 = row.RLN_FM_NM_V2?.toString() || row['RLN_FM_NM_V2']?.toString() || '';

        const voter = {
          acNo: parseInt(row.AC_NO) || parseInt(row['AC_NO']) || 0,
          partNo: parseInt(row.PART_NO) || parseInt(row['PART_NO']) || 0,
          slNoInPart: parseInt(row.SLNOINPART) || parseInt(row['SLNOINPART']) || 0,
          houseNo: row.HOUSE_NO?.toString() || row['HOUSE_NO']?.toString() || '',
          sectionNo: row.SECTION_NO?.toString() || row['SECTION_NO']?.toString() || '',
          fmNameV2: fmNameV2,
          fmNameEn: transliterateToEnglish(fmNameV2),
          rlnFmNmV2: rlnFmNmV2,
          rlnFmNmEn: transliterateToEnglish(rlnFmNmV2),
          rlnType: row.RLN_TYPE?.toString() || row['RLN_TYPE']?.toString() || '',
          age: row.AGE ? parseInt(row.AGE) : undefined,
          sex: row.SEX?.toString() || row['SEX']?.toString() || '',
          idCardNo: row.IDCARD_NO?.toString() || row['IDCARD_NO']?.toString() || '',
          psName: row.PS_NAME?.toString() || row['PS_NAME']?.toString() || '',
        };

        // Only add if we have at least AC_NO, PART_NO, and SLNOINPART
        if (voter.acNo && voter.partNo && voter.slNoInPart) {
          voters.push(voter);
          processed++;

          // Batch insert every 1000 records
          if (voters.length >= 1000) {
            // @ts-expect-error - Mongoose typing issue with document creation
            await Voter.insertMany(voters);
            console.log(`Inserted ${processed} records...`);
            voters.length = 0;
          }
        }
      } catch (err) {
        console.error(`Error processing row ${processed + 1}:`, err);
      }
    }

    // Insert remaining records
    if (voters.length > 0) {
      // @ts-expect-error - Mongoose typing issue with document creation
      await Voter.insertMany(voters);
      console.log(`Inserted remaining ${voters.length} records`);
    }

    console.log(`\nVoter import completed! Total records imported: ${processed}`);
    console.log(`Total Voter records in database: ${await Voter.countDocuments()}`);

    // Import Copy of LEGACY_PART sheet
    console.log('\n=== Importing Copy of LEGACY_PART sheet ===');
    const legacyPartSheet = workbook.Sheets['Copy of LEGACY_PART'];
    if (!legacyPartSheet) {
      console.log('Copy of LEGACY_PART sheet not found, skipping...');
    } else {
      const legacyPartData = XLSX.utils.sheet_to_json(legacyPartSheet, { raw: false });
      console.log(`Found ${legacyPartData.length} rows in Copy of LEGACY_PART sheet`);

      // Clear existing legacy part data
      console.log('Clearing existing legacy part data...');
      // @ts-expect-error - Mongoose typing issue with empty query object
      await LegacyPart.deleteMany({});

      const legacyParts = [];
      let legacyProcessed = 0;

      for (const row of legacyPartData as any[]) {
        try {
          const legacyPart = {
            stateCode: row.STATE_CODE?.toString() || '',
            districtNo: parseInt(row.DISTRICT_NO) || 0,
            acNo: parseInt(row.AC_NO) || 0,
            partNo: parseInt(row.PART_NO) || 0,
            partNameEn: row.PART_NAME_EN?.toString() || '',
            partNameV1: row.PART_NAME_V1?.toString() || '',
          };

          // Only add if we have required fields
          if (legacyPart.stateCode && legacyPart.acNo && legacyPart.partNo) {
            legacyParts.push(legacyPart);
            legacyProcessed++;

            // Batch insert every 100 records
            if (legacyParts.length >= 100) {
              // @ts-expect-error - Mongoose typing issue with document creation
              await LegacyPart.insertMany(legacyParts);
              console.log(`Inserted ${legacyProcessed} legacy part records...`);
              legacyParts.length = 0;
            }
          }
        } catch (err) {
          console.error(`Error processing legacy part row ${legacyProcessed + 1}:`, err);
        }
      }

      // Insert remaining records
      if (legacyParts.length > 0) {
        // @ts-expect-error - Mongoose typing issue with document creation
        await LegacyPart.insertMany(legacyParts);
        console.log(`Inserted remaining ${legacyParts.length} legacy part records`);
      }

      console.log(`\nLegacy Part import completed! Total records imported: ${legacyProcessed}`);
      console.log(`Total LegacyPart records in database: ${await LegacyPart.countDocuments()}`);
    }

    console.log('\n=== All imports completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importData();

