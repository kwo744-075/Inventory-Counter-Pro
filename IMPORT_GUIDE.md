
# Excel Import Guide

## Overview

The inventory counter app now features a **single-step Excel import** process that directly uploads data to Supabase. This replaces the legacy two-step validation process.

## Features

- ✅ **Single-Step Upload**: Select file → Parse → Upload to Supabase → Summary
- 📊 **Real-time Feedback**: Visual status updates during upload
- 🔄 **Automatic Upsert**: New items are added, existing items are updated
- 📝 **Detailed Summary**: Shows total items, new vs updated, category breakdown, and errors
- 💾 **Supabase Integration**: All data stored in cloud database with RLS policies
- 🔍 **Smart Validation**: Flexible column header matching and category detection

## Required Excel Format

### Column Headers (Case-Insensitive)

Your Excel file must contain these columns:

- **ProductName** - Item description (optional but recommended)
- **itemNumber** - Unique identifier (required)
- **FloorCount** - Floor quantity (required)
- **StorageCount** - Storage quantity (required)
- **Category** - Category name or ID (required)

### Example Excel Structure

```
ProductName              | itemNumber | FloorCount | StorageCount | Category
5W-30 Synthetic Oil      | OIL-001    | 5          | 12           | Oils
K&N Oil Filter           | OF-001     | 3          | 8            | Oil Filters
Engine Air Filter        | AF-001     | 2          | 6            | Air Filters
```

## Category Matching

The import process uses **smart category matching** that handles:

- Exact ID matches: `oils`, `oil-filters`, `air-filters`, `cabin-filters`, `wipers`, `misc`
- Name matches: `Oils`, `Oil Filters`, `Air Filters`, etc.
- Flexible variations: `oil filter`, `oilfilters`, `oil_filters`
- Partial matches: `oil` → `Oils`, `filter` → `Oil Filters`

## Import Process

### Step-by-Step Flow

1. **File Selection** - User selects Excel file (.xlsx, .xls, or .csv)
2. **File Reading** - App reads file content as Base64
3. **Excel Parsing** - XLSX library parses workbook and converts to CSV
4. **Header Validation** - Checks for required columns
5. **Data Parsing** - Processes each row and validates data
6. **Category Matching** - Automatically matches categories
7. **Supabase Upsert** - Uploads data with conflict resolution
8. **Summary Generation** - Calculates statistics and category counts
9. **Logging** - Records upload to `upload_logs` table
10. **UI Refresh** - Updates local state and displays summary modal

### Visual Feedback

The import button shows three states:

- **Idle**: "Import Excel File" (Blue)
- **Uploading**: "Uploading..." with spinner (Blue)
- **Complete**: "Upload Complete!" with checkmark (Green)

## Upload Summary Modal

After successful upload, a modal displays:

- ✅ **Total Items Processed** - Total rows successfully imported
- 🆕 **New Items** - Items added to database
- 🔄 **Updated Items** - Existing items that were updated
- ⚠️ **Skipped/Errors** - Rows that failed validation
- 🕒 **Timestamp** - Upload date and time
- 📄 **File Name** - Name of uploaded file
- 🗂 **Items per Category** - Breakdown by category
- ⚠️ **Error Details** - First 10 error messages (if any)

## Database Schema

### item_numbers Table

```sql
CREATE TABLE item_numbers (
  id TEXT PRIMARY KEY,
  item_number TEXT UNIQUE NOT NULL,
  product_name TEXT,
  floor_count INTEGER DEFAULT 0,
  storage_count INTEGER DEFAULT 0,
  total_count INTEGER GENERATED ALWAYS AS (floor_count + storage_count) STORED,
  category TEXT REFERENCES categories(id),
  last_updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### upload_logs Table

```sql
CREATE TABLE upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_items INTEGER,
  category_counts JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  uploader_id TEXT,
  uploader_email TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

### Common Errors

1. **Missing Required Columns**
   - Error: "Missing required columns: itemNumber, FloorCount..."
   - Solution: Ensure Excel has all required headers

2. **Invalid Category**
   - Error: "Could not match category 'xyz' to any available category"
   - Solution: Use valid category names (Oils, Oil Filters, etc.)

3. **Empty Item Number**
   - Error: "Row X: Empty item number"
   - Solution: Ensure all rows have item numbers

4. **File Read Error**
   - Error: "File is empty or could not be read"
   - Solution: Check file format and permissions

### Debug Logging

The import process includes extensive console logging:

```
🚀 Starting single-step Supabase import...
📂 Step 1: Selecting file...
📖 Step 2: Reading file...
📊 Step 3: Parsing Excel file...
✅ Step 4: Validating headers...
📊 Step 5: Parsing data rows...
💾 Step 6: Upserting to Supabase...
📊 Step 7: Calculating category counts...
📝 Step 8: Creating upload summary...
📝 Step 9: Logging upload to Supabase...
🔄 Step 10: Refreshing local state...
✅ Import complete!
```

## Best Practices

1. **Prepare Your Excel File**
   - Use exact column headers: `ProductName`, `itemNumber`, `FloorCount`, `StorageCount`, `Category`
   - Ensure no empty rows between data
   - Remove any merged cells
   - Save as .xlsx format

2. **Category Names**
   - Use standard category names: Oils, Oil Filters, Air Filters, Cabin Filters, Wipers, Miscellaneous
   - Or use category IDs: oils, oil-filters, air-filters, cabin-filters, wipers, misc

3. **Data Validation**
   - Ensure item numbers are unique
   - Use numeric values for counts (no text)
   - Remove any special characters from item numbers

4. **Testing**
   - Start with a small test file (5-10 rows)
   - Verify the summary modal shows correct counts
   - Check the app to ensure items appear in correct categories

## Troubleshooting

### Import Button Not Responding

- Check console logs for errors
- Ensure file picker permissions are granted
- Try restarting the app

### Items Not Appearing After Import

- Check the summary modal for errors
- Verify Supabase connection (look for sync indicator)
- Force refresh by navigating away and back
- Check console logs for Supabase errors

### Duplicate Items

- The import uses **upsert** logic
- Existing items (by item_number) are automatically updated
- No duplicates will be created

### Category Mismatch

- Check spelling of category names
- Use the exact names shown in the app
- Check console logs for category matching details

## API Reference

### handleImportExcel()

Main import function that orchestrates the entire process.

**Returns**: `Promise<void>`

**Throws**: Displays Alert on error

### validateExcelColumns(headers: string[])

Validates that required columns exist in the Excel file.

**Parameters**:
- `headers: string[]` - Array of column headers from Excel

**Returns**: `{ valid: boolean; missing: string[] }`

### parseExcelRow(values: string[], headers: string[], rowIndex: number)

Parses a single Excel row into a structured item object.

**Parameters**:
- `values: string[]` - Array of cell values
- `headers: string[]` - Array of column headers
- `rowIndex: number` - Row number for error reporting

**Returns**: `ParsedItem | null`

### logUploadToSupabase(summary: UploadSummary)

Logs upload summary to the `upload_logs` table.

**Parameters**:
- `summary: UploadSummary` - Upload summary object

**Returns**: `Promise<void>`

## Future Enhancements

- [ ] Batch upload progress indicator
- [ ] Excel template download
- [ ] Import history view
- [ ] Rollback functionality
- [ ] CSV export of errors
- [ ] Multi-sheet support
- [ ] Custom column mapping
- [ ] Scheduled imports
- [ ] Email notifications on completion

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Excel file format matches requirements
3. Ensure Supabase connection is active
4. Review this guide for troubleshooting steps
