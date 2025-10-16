
# Supabase Integration Guide

## Overview

This inventory counter app now uses Supabase for cloud storage, real-time synchronization, and data persistence. The app seamlessly syncs data between local storage and Supabase, providing a smooth and reliable experience.

## Features

### 1. **Cloud Storage**
- All inventory data is automatically synced to Supabase
- Categories, items, and item numbers are stored in PostgreSQL tables
- Data persists across devices and sessions

### 2. **Real-Time Sync**
- Changes are automatically synced to the cloud within 1 second
- Real-time subscriptions update the UI when data changes
- Multiple devices can work with the same inventory simultaneously

### 3. **Offline Support**
- App works offline using local AsyncStorage
- Changes are queued and synced when connection is restored
- Sync status indicator shows current connection state

### 4. **Performance Optimizations**
- Debounced sync prevents excessive API calls
- Indexed database queries for fast data retrieval
- Efficient real-time subscriptions using Supabase channels

## Database Schema

### Tables

#### `categories`
- `id` (TEXT, PRIMARY KEY) - Unique category identifier
- `name` (TEXT) - Category display name
- `icon` (TEXT) - Icon name for UI
- `color` (TEXT) - Hex color code
- `is_locked` (BOOLEAN) - Whether category can be deleted
- `is_custom` (BOOLEAN) - Whether category is user-created
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `items` (Legacy)
- `id` (TEXT, PRIMARY KEY) - Unique item identifier
- `name` (TEXT) - Item name
- `quantity` (INTEGER) - Item quantity
- `description` (TEXT) - Item description
- `category` (TEXT, FOREIGN KEY) - References categories(id)
- `item_number` (TEXT) - Optional item number
- `floor_count` (INTEGER) - Floor inventory count
- `storage_count` (INTEGER) - Storage inventory count
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `item_numbers`
- `id` (TEXT, PRIMARY KEY) - Unique identifier
- `item_number` (TEXT, UNIQUE) - Item number/SKU
- `product_name` (TEXT) - Product name
- `floor_count` (INTEGER) - Floor inventory count
- `storage_count` (INTEGER) - Storage inventory count
- `total_count` (INTEGER, COMPUTED) - Automatically calculated total
- `category` (TEXT, FOREIGN KEY) - References categories(id)
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `export_snapshots`
- `id` (UUID, PRIMARY KEY) - Unique snapshot identifier
- `snapshot_data` (JSONB) - Snapshot of inventory at export time
- `export_date` (TIMESTAMPTZ) - When export was created
- `item_count` (INTEGER) - Number of items in snapshot
- `created_at` (TIMESTAMPTZ) - Creation timestamp

### Indexes
- `idx_items_category` - Fast category filtering for items
- `idx_item_numbers_category` - Fast category filtering for item numbers
- `idx_item_numbers_item_number` - Fast item number lookups
- `idx_export_snapshots_export_date` - Fast export history queries

### Row Level Security (RLS)
All tables have RLS enabled with public access policies. In production, you should:
1. Enable authentication
2. Update RLS policies to restrict access based on user ID
3. Add user_id columns to tables for multi-tenant support

## Usage

### Accessing Supabase Client

```typescript
import { supabase } from '@/services/supabase';

// Query data
const { data, error } = await supabase
  .from('item_numbers')
  .select('*')
  .eq('category', 'oils');

// Insert data
const { error } = await supabase
  .from('item_numbers')
  .insert({
    id: 'unique-id',
    item_number: 'OIL-001',
    product_name: '5W-30 Synthetic Oil',
    floor_count: 5,
    storage_count: 10,
    category: 'oils',
  });
```

### Using the Inventory Context

The `InventoryContext` automatically handles Supabase sync:

```typescript
import { useInventory } from '@/contexts/InventoryContext';

function MyComponent() {
  const { 
    itemNumbers, 
    addItemNumber, 
    isSyncing, 
    syncStatus 
  } = useInventory();

  // Add item - automatically syncs to Supabase
  const handleAdd = async () => {
    await addItemNumber({
      itemNumber: 'NEW-001',
      productName: 'New Product',
      floorCount: 0,
      storageCount: 0,
      totalCount: 0,
      category: 'oils',
    });
  };

  return (
    <View>
      <Text>Sync Status: {syncStatus}</Text>
      {isSyncing && <ActivityIndicator />}
    </View>
  );
}
```

### Real-Time Subscriptions

Real-time updates are automatically configured in the `InventoryContext`. When data changes in Supabase (from any device), the app automatically refreshes.

## Excel Import/Export

The Excel import/export functionality has been optimized:

### Import Process
1. **Two-Step Validation**
   - Step 1: Download and validate file structure
   - Step 2: Process data and assign to categories

2. **Automatic Sync**
   - Imported data is automatically synced to Supabase
   - Duplicate item numbers are replaced
   - Category matching is flexible and intelligent

3. **Error Handling**
   - Detailed error messages for each row
   - Validation of required columns
   - Category matching with fallback logic

### Export Process
1. **Snapshot Tracking**
   - Creates snapshot of current inventory
   - Tracks which items have changed since last export
   - Stores snapshots in Supabase for history

2. **Multiple Export Options**
   - Export all categories with separate tabs
   - Export individual categories
   - Export includes adjusted items flag

## Performance Tips

1. **Batch Operations**
   - Use bulk inserts/updates when possible
   - Debounce frequent updates

2. **Efficient Queries**
   - Use indexes for filtering
   - Select only needed columns
   - Use pagination for large datasets

3. **Real-Time Optimization**
   - Limit real-time subscriptions to necessary tables
   - Use filters in subscriptions to reduce data transfer

4. **Offline First**
   - App works offline using AsyncStorage
   - Sync happens automatically when online
   - No user intervention needed

## Troubleshooting

### Sync Issues
- Check internet connection
- Verify Supabase project is active
- Check browser console for errors
- Ensure RLS policies allow access

### Data Not Updating
- Force refresh using `forceRefresh()` from context
- Check real-time subscription status
- Verify data is in Supabase dashboard

### Import Errors
- Ensure Excel file has correct column headers
- Check category names match existing categories
- Verify file is not corrupted
- Check file size (max 10MB)

## Future Enhancements

1. **Authentication**
   - Add user login/signup
   - Implement user-specific RLS policies
   - Multi-tenant support

2. **Conflict Resolution**
   - Handle simultaneous edits from multiple devices
   - Implement last-write-wins or merge strategies

3. **Advanced Features**
   - Audit logs for all changes
   - Undo/redo functionality
   - Data versioning and history

4. **Performance**
   - Implement pagination for large datasets
   - Add caching layer for frequently accessed data
   - Optimize real-time subscriptions

## Support

For issues or questions:
1. Check Supabase dashboard for errors
2. Review console logs for detailed error messages
3. Verify database schema matches expected structure
4. Test with sample data first
