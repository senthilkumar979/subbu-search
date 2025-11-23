# Polling Station Name Lookup - Technical Documentation

## Overview

The API fetches polling station names from the `LegacyPart` collection based on **BOTH** `acNo` (Assembly Constituency Number) and `partNo` (Part Number).

## Data Structure

### Voter Collections (AC210, AC211, AC212, AC224)

Each voter record contains:
```javascript
{
  acNo: 210,        // Assembly Constituency Number (extracted from table name)
  partNo: 1,        // Part Number
  slNoInPart: 1,    // Serial Number
  fmNameV2: "...",  // Voter name
  // ... other fields
}
```

### LegacyPart Collection

Contains polling station information:
```javascript
{
  acNo: 210,                    // Assembly Constituency Number
  partNo: 1,                    // Part Number
  partNameV1: "ஊராட்சி...",   // Polling Station Name in Tamil
  partNameEn: "..."             // Polling Station Name in English
}
```

## Matching Logic

### How the Lookup Works

The API uses MongoDB aggregation `$lookup` with a **composite match** on `acNo` AND `partNo`:

```javascript
// For a voter from AC210 collection with partNo = 1:
Voter { acNo: 210, partNo: 1 }
  ↓ (lookup)
LegacyPart { acNo: 210, partNo: 1 }
  ↓ (result)
partNameV1: "ஊராட்சி ஒன்றிய நடுநிலைப் பள்ளி..."
```

### Example Scenarios

#### Scenario 1: AC210 (Thoothukudi)
```
Voter Record:
  - Table: ac210s
  - acNo: 210
  - partNo: 1

Matches LegacyPart:
  - acNo: 210 ✓
  - partNo: 1 ✓

Result: Gets partNameV1 for AC 210, Part 1
```

#### Scenario 2: AC212 (Tiruchendur)
```
Voter Record:
  - Table: ac212s
  - acNo: 212
  - partNo: 5

Matches LegacyPart:
  - acNo: 212 ✓
  - partNo: 5 ✓

Result: Gets partNameV1 for AC 212, Part 5
```

#### Scenario 3: AC224 (Srivaikuntam)
```
Voter Record:
  - Table: ac224s
  - acNo: 224
  - partNo: 10

Matches LegacyPart:
  - acNo: 224 ✓
  - partNo: 10 ✓

Result: Gets partNameV1 for AC 224, Part 10
```

## MongoDB Aggregation Pipeline

```javascript
Model.aggregate([
  // 1. Match search criteria
  { $match: searchQuery },

  // 2. Sort results
  { $sort: { acNo: 1, partNo: 1, slNoInPart: 1 } },

  // 3. Pagination
  { $skip: skip },
  { $limit: limit },

  // 4. JOIN with LegacyPart collection
  {
    $lookup: {
      from: 'legacyparts',
      let: {
        acNo: '$acNo',      // Voter's AC Number (210, 211, 212, or 224)
        partNo: '$partNo'   // Voter's Part Number (1, 2, 3, etc.)
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$acNo', '$$acNo'] },     // Must match AC Number
                { $eq: ['$partNo', '$$partNo'] }  // Must match Part Number
              ]
            }
          }
        },
        { $limit: 1 }
      ],
      as: 'legacyPartInfo'
    }
  },

  // 5. Replace psName with partNameV1 from LegacyPart
  {
    $addFields: {
      psName: {
        $ifNull: [
          { $arrayElemAt: ['$legacyPartInfo.partNameV1', 0] },
          '$psName'  // Fallback to original if no match
        ]
      }
    }
  },

  // 6. Clean up temporary data
  {
    $project: {
      legacyPartInfo: 0
    }
  }
])
```

## Key Points

✅ **Composite Key Matching**: The lookup matches on **BOTH** `acNo` AND `partNo`, not just `partNo` alone

✅ **Constituency-Specific**: Each AC (210, 211, 212, 224) has its own set of parts

✅ **Automatic Mapping**:
- AC210 collection → acNo = 210
- AC211 collection → acNo = 211
- AC212 collection → acNo = 212
- AC224 collection → acNo = 224

✅ **Fallback Mechanism**: If no matching LegacyPart record is found, the original `psName` from the voter record is used

## Testing the Lookup

### Test Query Example:

```bash
# Search in AC212 (Tiruchendur) with partNo filter
curl "http://localhost:3000/api/voters/search?tsc=AC212&partNo=1"
```

**Expected Result:**
- Returns voters from AC212 collection where partNo = 1
- Each voter's `psName` will be populated with `partNameV1` from LegacyPart where acNo=212 AND partNo=1

### Verification Steps:

1. **Check voter data has correct acNo:**
   ```javascript
   // AC212 voters should have acNo: 212
   // AC210 voters should have acNo: 210
   ```

2. **Check LegacyPart has matching records:**
   ```javascript
   // LegacyPart should have records for:
   // { acNo: 210, partNo: 1 }, { acNo: 210, partNo: 2 }, ...
   // { acNo: 212, partNo: 1 }, { acNo: 212, partNo: 2 }, ...
   // etc.
   ```

3. **Verify the join is working:**
   - The returned `psName` should be in Tamil (from `partNameV1`)
   - It should match the correct AC and Part combination

## Troubleshooting

### Issue: Polling station name is blank or incorrect

**Possible Causes:**
1. LegacyPart collection is not populated
2. acNo or partNo mismatch in data
3. Missing records in LegacyPart for certain AC/Part combinations

**Solution:**
1. Run the import script to populate LegacyPart:
   ```bash
   npm run import
   ```

2. Verify LegacyPart has data for all ACs:
   ```javascript
   db.legacyparts.distinct('acNo')  // Should return [210, 211, 212, 224, ...]
   ```

3. Check if specific AC/Part combination exists:
   ```javascript
   db.legacyparts.findOne({ acNo: 212, partNo: 1 })
   ```

### Issue: All polling stations show the same name

**Possible Cause:** The lookup is only matching on `partNo`, not `acNo`

**Solution:** Verify the aggregation pipeline has the `$and` condition with both `acNo` and `partNo` matches

## Performance Considerations

- **Indexed Fields**: Both `acNo` and `partNo` are indexed in LegacyPart collection for fast lookups
- **Limit 1**: The lookup pipeline limits results to 1 record per voter, preventing duplicates
- **Aggregation Efficiency**: MongoDB performs the join at the database level, which is more efficient than application-level joins

## Summary

The polling station name lookup is a **two-key join**:
- **Key 1**: Assembly Constituency Number (acNo) - e.g., 210, 211, 212, 224
- **Key 2**: Part Number (partNo) - e.g., 1, 2, 3, etc.

Both keys must match for the correct polling station name to be retrieved.
