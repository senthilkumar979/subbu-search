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
import AC212 from '../lib/models/AC212.js';
import AC224 from '../lib/models/AC224.js';
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

async function importSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  Model: any,
  modelName: string
) {
  console.log(`\n=== Importing ${sheetName} sheet to ${modelName} collection ===`);

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.log(`Sheet "${sheetName}" not found, skipping...`);
    return;
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  console.log(`Found ${data.length} rows in ${sheetName} sheet`);

  // Clear existing data
  console.log(`Clearing existing ${modelName} data...`);
  await Model.deleteMany({});

  const records = [];
  let processed = 0;

  for (const row of data as any[]) {
    try {
      const fmNameV2 = row.FM_NAME_V2?.toString() || row['FM_NAME_V2']?.toString() || '';
      const rlnFmNmV2 = row.RLN_FM_NM_V2?.toString() || row['RLN_FM_NM_V2']?.toString() || row.Rln_FM_NM_V2?.toString() || row['Rln_FM_NM_V2']?.toString() || '';

      const record = {
        acNo: parseInt(row.AC_NO || row.ac_no || row['AC_NO'] || row['ac_no']) || 0,
        partNo: parseInt(row.PART_NO || row.part_no || row['PART_NO'] || row['part_no']) || 0,
        slNoInPart: parseInt(row.SLNOINPART || row.slnoinpart || row['SLNOINPART'] || row['slnoinpart']) || 0,
        houseNo: row.HOUSE_NO?.toString() || row.house_no?.toString() || row['HOUSE_NO']?.toString() || row['house_no']?.toString() || '',
        sectionNo: row.SECTION_NO?.toString() || row.section_no?.toString() || row['SECTION_NO']?.toString() || row['section_no']?.toString() || '',
        fmNameV2: fmNameV2,
        fmNameEn: transliterateToEnglish(fmNameV2),
        rlnFmNmV2: rlnFmNmV2,
        rlnFmNmEn: transliterateToEnglish(rlnFmNmV2),
        rlnType: row.RLN_TYPE?.toString() || row.rln_type?.toString() || row['RLN_TYPE']?.toString() || row['rln_type']?.toString() || '',
        age: row.AGE || row.age ? parseInt(row.AGE || row.age) : undefined,
        sex: row.SEX?.toString() || row.sex?.toString() || row['SEX']?.toString() || row['sex']?.toString() || '',
        idCardNo: row.IDCARD_NO?.toString() || row.idcard_no?.toString() || row['IDCARD_NO']?.toString() || row['idcard_no']?.toString() || '',
        psName: row.PS_NAME?.toString() || row.ps_name?.toString() || row['PS_NAME']?.toString() || row['ps_name']?.toString() || '',
      };

      // Only add if we have at least AC_NO, PART_NO, and SLNOINPART
      if (record.acNo && record.partNo && record.slNoInPart) {
        records.push(record);
        processed++;

        // Batch insert every 1000 records
        if (records.length >= 1000) {
          await Model.insertMany(records);
          console.log(`Inserted ${processed} ${modelName} records...`);
          records.length = 0;
        }
      }
    } catch (err) {
      console.error(`Error processing ${modelName} row ${processed + 1}:`, err);
    }
  }

  // Insert remaining records
  if (records.length > 0) {
    await Model.insertMany(records);
    console.log(`Inserted remaining ${records.length} ${modelName} records`);
  }

  console.log(`\n${modelName} import completed! Total records imported: ${processed}`);
  console.log(`Total ${modelName} records in database: ${await Model.countDocuments()}`);
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

    // File path for AC212&AC224.xlsx
    const filePath = '/Users/santhoshraja/Santhosh/Web Application/tuticorin-gov-app/AC212&AC224.xlsx';

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `File not found: ${filePath}\nPlease ensure "AC212 AC224.xlsx" exists at the specified path.`
      );
    }

    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    console.log(`Sheets found in workbook: ${workbook.SheetNames.join(', ')}`);

    // Import AC212 sheet
    await importSheetData(workbook, 'AC212', AC212, 'AC212');

    // Import AC224 sheet
    await importSheetData(workbook, 'AC224', AC224, 'AC224');

    console.log('\n=== All imports completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

importData();
