# Thoothukudi Electoral Roll Search Application

A robust search application for the 2002 electoral roll dataset of Thoothukudi Assembly Constituency (AC 210). This application can handle over 266,000 records efficiently.

## Features

- **Multiple Search Types:**
  - Search by voter name (Tamil) - supports partial matching
  - Search by house number
  - Search by ID card number (EPIC) - exact match

- **Advanced Filters:**
  - Filter by Part Number
  - Filter by Age
  - Filter by Gender

- **Performance:**
  - Optimized MongoDB queries with indexes
  - Pagination support (50 results per page)
  - Fast search response times

- **User-Friendly Interface:**
  - Clean, modern UI
  - Responsive design
  - Real-time search results
  - Detailed voter information display

## Prerequisites

1. **Node.js** (>= 20)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **pnpm** package manager

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure MongoDB

Create a `.env.local` file in the `apps/web` directory:

```bash
cd apps/web
cp .env.local.example .env.local
```

Edit `.env.local` and set your MongoDB connection string:

```env
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/tuticorin-electoral-roll

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tuticorin-electoral-roll
```

### 3. Start MongoDB

If using local MongoDB, make sure it's running:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod
```

### 4. Import Data

Ensure the Excel file `2002 EROLL Detail AC 210 Part No 1.xlsx` is in the project root directory.

Run the import script:

```bash
cd apps/web
pnpm import
```

The script will:
- Connect to MongoDB
- Read the Excel file
- Parse all records
- Import them into the database
- Create necessary indexes for fast searches

**Note:** The import script will clear existing data before importing. For the full dataset (266,723 rows), the import may take several minutes.

### 5. Start the Development Server

```bash
# From project root
pnpm dev

# Or from apps/web
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:3000`

## Usage

### Search by Name

1. Select "Name (Tamil)" from the Search Type dropdown
2. Enter the voter's name (supports partial matches)
3. Optionally add filters (Part No, Age, Gender)
4. Click "Search"

### Search by House Number

1. Select "House Number" from the Search Type dropdown
2. Enter the house number
3. Click "Search" to see all voters in that house

### Search by ID Card Number

1. Select "ID Card Number" from the Search Type dropdown
2. Enter the exact ID card number
3. Click "Search"

### Using Filters

- **Part No:** Filter results to a specific part number
- **Age:** Filter by exact age
- **Gender:** Filter by M (Male), F (Female), or O (Other)

Filters can be combined with any search type.

## API Endpoints

### Search Voters

```
GET /api/voters/search
```

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Search type - `name`, `house`, or `idcard` (default: `name`)
- `partNo` (optional): Filter by part number
- `age` (optional): Filter by age
- `sex` (optional): Filter by gender (M/F/O)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Example:**
```
GET /api/voters/search?q=ராஜா&type=name&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "acNo": 210,
      "partNo": 1,
      "slNoInPart": 1,
      "fmNameV2": "ராஜா",
      "rlnFmNmV2": "முருகன்",
      "rlnType": "F",
      "age": 45,
      "sex": "M",
      "idCardNo": "ABC123456",
      "houseNo": "123",
      "psName": "Polling Station 1"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Database Schema

The `Voter` model includes the following fields:

- `acNo`: Assembly Constituency Number
- `partNo`: Part Number
- `slNoInPart`: Serial Number in Part
- `houseNo`: House Number
- `sectionNo`: Section Number
- `fmNameV2`: Voter Name (Tamil)
- `rlnFmNmV2`: Relation Name (Tamil)
- `rlnType`: Relation Type (H/F/M/etc.)
- `age`: Age
- `sex`: Gender (M/F/O)
- `idCardNo`: ID Card Number (EPIC)
- `psName`: Polling Station Name

## Indexes

The following indexes are created for optimal performance:

- Single field indexes on: `acNo`, `partNo`, `houseNo`, `fmNameV2`, `age`, `sex`, `idCardNo`, `psName`
- Compound index on: `(acNo, partNo)`
- Compound index on: `(houseNo, sectionNo)`
- Text index on: `(fmNameV2, rlnFmNmV2)`

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check your `MONGODB_URI` in `.env.local`
- Verify network connectivity for MongoDB Atlas

### Import Script Issues

- Ensure the Excel file is in the project root
- Check file permissions
- Verify MongoDB connection before running import

### Search Performance

- Ensure indexes are created (they're created automatically on first import)
- For very large result sets, use filters to narrow down results
- Consider increasing the `limit` parameter if needed

## Production Deployment

1. Set `MONGODB_URI` environment variable in your hosting platform
2. Build the application: `pnpm build`
3. Start the production server: `pnpm start`
4. Ensure MongoDB is accessible from your hosting environment

## License

Private project for Thoothukudi Government application.

