# Data Import Scripts

This directory contains scripts to import electoral roll data from Excel files into MongoDB.

## Available Scripts

### 1. Import AC 210 Data (Original)
Imports data from `2002 EROLL Detail AC 210 Part No 1.xlsx` into `Voter` collection

```bash
npm run import
```

### 2. Import AC212 and AC224 Data
Imports data from `AC212&AC224.xlsx` into two separate collections: `AC212` and `AC224`

```bash
npm run import:ac212-ac224
```

### 3. Import AC210 and AC211 Data
Imports data from `EROLL 2002.xlsx` into two separate collections: `AC210` and `AC211`

```bash
npm run import:ac210-ac211
```

### 4. Import AC225 and AC226 Data
Imports data from `AC225 and AC226.xlsx` into two separate collections: `AC225` and `AC226`

```bash
npm run import:ac225-ac226
```

### 5. Import AC227 Data
Imports data from `AC227.xlsx` into the `AC227` collection

```bash
npm run import:ac227
```

## Prerequisites

1. Make sure you have a `.env.local` file in the `apps/web` directory with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://your-connection-string
   ```

2. The Excel file should be placed at the correct path:
   - For AC212/AC224: `/Users/santhoshraja/Santhosh/Web Application/tuticorin-gov-app/AC212 AC224.xlsx`

## How It Works

### AC212 and AC224 Import (`import-ac212-ac224.ts`)

1. **Reads the Excel file** from the specified path
2. **Processes both sheets** (AC212 and AC224)
3. **Creates two separate MongoDB collections**:
   - `ac212s` collection for AC212 data
   - `ac224s` collection for AC224 data
4. **Transliterates Tamil names** to English for better searchability
5. **Batch inserts** 1000 records at a time for efficiency
6. **Creates indexes** on common query fields (name, relation name, age, gender, etc.)

### Data Fields

Each record contains:
- `acNo` - Assembly Constituency Number
- `partNo` - Part Number
- `slNoInPart` - Serial Number in Part
- `houseNo` - House Number
- `sectionNo` - Section Number
- `fmNameV2` - Voter Name (Tamil)
- `fmNameEn` - Voter Name (English transliteration)
- `rlnFmNmV2` - Relation Name (Tamil)
- `rlnFmNmEn` - Relation Name (English transliteration)
- `rlnType` - Relation Type (H/F/M/W/S/D/B/SI/O)
- `age` - Age
- `sex` - Gender (M/F/O)
- `idCardNo` - ID Card Number
- `psName` - Polling Station Name (dynamically fetched from LegacyPart table's `partNameV1` field based on `acNo` and `partNo`)

## API Usage

### Search API with Constituency Selection

The application supports searching across different constituencies using the `tsc` (Taluk/Sub-Constituency) query parameter.

**Endpoint:** `/api/voters/search`

**Query Parameters:**
- `tsc` - Constituency identifier (AC210, AC211, AC212, AC224, or Voter)
- `name` - Elector name (Tamil or English)
- `relationName` - Relation name (father/husband/mother)
- `idCardNo` - ID Card Number
- `partNo` - Part Number
- `age` - Age
- `sex` - Gender (M/F/O)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Example:**
```
/api/voters/search?tsc=AC212&name=சண்முகவேல்&page=1&limit=50
```

**Available Constituencies:**
- `AC210` - Thoothukudi (from EROLL 2002.xlsx - AC210withsex sheet)
- `AC211` - Vilathikulam (from EROLL 2002.xlsx - AC211withsex sheet)
- `AC212` - Tiruchendur (from AC212&AC224.xlsx - AC212 sheet)
- `AC224` - Srivaikuntam (from AC212&AC224.xlsx - AC224 sheet)
- `AC225` - (from AC225 and AC226.xlsx - AC225 sheet)
- `AC226` - (from AC225 and AC226.xlsx - AC226 sheet)
- `AC227` - (from AC227.xlsx - AC227 sheet)
- `Voter` - Original AC 210 data (legacy, from 2002 EROLL Detail AC 210 Part No 1.xlsx)

### Frontend Usage

The frontend automatically reads the `tsc` parameter from the URL. Users can:
1. Select constituency from the dropdown selector
2. Access directly via URL: `/?tsc=AC212`
3. The selected constituency persists in the URL when searching

### Polling Station Name Lookup

The API uses MongoDB aggregation with `$lookup` to fetch the polling station name from the `LegacyPart` collection:
- **Matches on BOTH `acNo` AND `partNo`** (composite key)
  - Example: AC212 voter with partNo=5 → LegacyPart record where acNo=212 AND partNo=5
- Retrieves `partNameV1` (Tamil name) from LegacyPart table
- Falls back to the voter record's `psName` if no match is found in LegacyPart

**Constituency to acNo Mapping:**
- AC210 (Thoothukudi) → acNo = 210
- AC211 (Vilathikulam) → acNo = 211
- AC212 (Tiruchendur) → acNo = 212
- AC224 (Srivaikuntam) → acNo = 224
- AC225 → acNo = 225
- AC226 → acNo = 226
- AC227 → acNo = 227

**Note:** Ensure the LegacyPart collection is populated by running the original import script (`npm run import`) which imports the "Copy of LEGACY_PART" sheet.

**Detailed Technical Documentation:** See [POLLING_STATION_LOOKUP.md](../POLLING_STATION_LOOKUP.md) for complete technical details on how the lookup works.

## Troubleshooting

### File not found error
Make sure the Excel file exists at the specified path. Update the `filePath` variable in the script if needed.

### Connection error
Verify your `MONGODB_URI` in `.env.local` is correct and the MongoDB server is running.

### Storage quota exceeded
If you encounter "over your space quota" errors, you may need to:
- Upgrade your MongoDB Atlas tier
- Delete unused collections
- Use a different MongoDB instance with more storage

### TypeScript errors
The scripts use TypeScript with `tsx`. Make sure all dependencies are installed:
```bash
npm install
```
