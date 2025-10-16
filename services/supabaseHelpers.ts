
import { supabase } from './supabase';
import { ItemNumberEntry, CategoryManagement } from '@/types/inventory';

/**
 * DRY Supabase Helper Functions
 * Centralized CRUD operations for all Supabase interactions
 */

// ============================================
// ITEM NUMBERS CRUD
// ============================================

export const fetchAllItemNumbers = async (): Promise<ItemNumberEntry[]> => {
  try {
    console.log('📥 Fetching all item numbers from Supabase...');
    const { data, error } = await supabase
      .from('item_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Fetched ${data?.length || 0} item numbers`);
    return (data || []).map(transformSupabaseItemToLocal);
  } catch (error) {
    console.error('❌ Error fetching item numbers:', error);
    throw error;
  }
};

export const fetchItemNumbersByCategory = async (category: string): Promise<ItemNumberEntry[]> => {
  try {
    console.log(`📥 Fetching item numbers for category: ${category}`);
    const { data, error } = await supabase
      .from('item_numbers')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Fetched ${data?.length || 0} items for ${category}`);
    return (data || []).map(transformSupabaseItemToLocal);
  } catch (error) {
    console.error(`❌ Error fetching items for ${category}:`, error);
    throw error;
  }
};

export const upsertItemNumber = async (item: ItemNumberEntry, userId?: string): Promise<ItemNumberEntry> => {
  try {
    console.log('💾 Upserting item number:', item.itemNumber);
    
    const dataToUpsert = {
      id: item.id,
      item_number: item.itemNumber,
      product_name: item.productName,
      floor_count: item.floorCount,
      storage_count: item.storageCount,
      category: item.category,
      last_updated_by: userId || 'system',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('item_numbers')
      .upsert(dataToUpsert, { onConflict: 'item_number' })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Successfully upserted item number');
    return transformSupabaseItemToLocal(data);
  } catch (error) {
    console.error('❌ Error upserting item number:', error);
    throw error;
  }
};

export const bulkUpsertItemNumbers = async (items: ItemNumberEntry[], userId?: string): Promise<number> => {
  try {
    console.log(`💾 Bulk upserting ${items.length} item numbers...`);
    
    const dataToUpsert = items.map(item => ({
      id: item.id,
      item_number: item.itemNumber,
      product_name: item.productName,
      floor_count: item.floorCount,
      storage_count: item.storageCount,
      category: item.category,
      last_updated_by: userId || 'system',
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('item_numbers')
      .upsert(dataToUpsert, { onConflict: 'item_number' })
      .select();

    if (error) throw error;

    console.log(`✅ Successfully upserted ${data?.length || 0} items`);
    return data?.length || 0;
  } catch (error) {
    console.error('❌ Error bulk upserting items:', error);
    throw error;
  }
};

export const deleteItemNumber = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting item number:', id);
    
    const { error } = await supabase
      .from('item_numbers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Successfully deleted item number');
  } catch (error) {
    console.error('❌ Error deleting item number:', error);
    throw error;
  }
};

export const resetFloorCountsInSupabase = async (): Promise<void> => {
  try {
    console.log('🔄 Resetting all floor counts to 0...');
    
    const { error } = await supabase
      .from('item_numbers')
      .update({ 
        floor_count: 0,
        updated_at: new Date().toISOString() 
      })
      .neq('id', ''); // Update all rows

    if (error) throw error;

    console.log('✅ Successfully reset all floor counts');
  } catch (error) {
    console.error('❌ Error resetting floor counts:', error);
    throw error;
  }
};

export const resetStorageCountsInSupabase = async (): Promise<void> => {
  try {
    console.log('🔄 Resetting all storage counts to 0...');
    
    const { error } = await supabase
      .from('item_numbers')
      .update({ 
        storage_count: 0,
        updated_at: new Date().toISOString() 
      })
      .neq('id', ''); // Update all rows

    if (error) throw error;

    console.log('✅ Successfully reset all storage counts');
  } catch (error) {
    console.error('❌ Error resetting storage counts:', error);
    throw error;
  }
};

export const deleteAllItemNumbers = async (): Promise<void> => {
  try {
    console.log('🗑️ Deleting all item numbers...');
    
    const { error } = await supabase
      .from('item_numbers')
      .delete()
      .neq('id', ''); // Delete all rows

    if (error) throw error;

    console.log('✅ Successfully deleted all item numbers');
  } catch (error) {
    console.error('❌ Error deleting all item numbers:', error);
    throw error;
  }
};

// ============================================
// CATEGORIES CRUD
// ============================================

export const fetchAllCategories = async (): Promise<CategoryManagement[]> => {
  try {
    console.log('📥 Fetching all categories from Supabase...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`✅ Fetched ${data?.length || 0} categories`);
    return (data || []).map(transformSupabaseCategoryToLocal);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
};

export const upsertCategory = async (category: CategoryManagement): Promise<CategoryManagement> => {
  try {
    console.log('💾 Upserting category:', category.name);
    
    const dataToUpsert = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      is_locked: category.isLocked,
      is_custom: category.isCustom,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('categories')
      .upsert(dataToUpsert, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Successfully upserted category');
    return transformSupabaseCategoryToLocal(data);
  } catch (error) {
    console.error('❌ Error upserting category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting category:', id);
    
    // First delete all item numbers in this category
    await supabase
      .from('item_numbers')
      .delete()
      .eq('category', id);
    
    // Then delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Successfully deleted category');
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    throw error;
  }
};

// ============================================
// UPLOAD LOGS
// ============================================

export interface UploadLogData {
  total_items: number;
  category_counts: { [key: string]: number };
  timestamp: string;
  uploader_id?: string;
  uploader_email?: string;
  file_name?: string;
  new_items?: number;
  updated_items?: number;
  skipped_items?: number;
}

export const logUploadToSupabase = async (logData: UploadLogData): Promise<void> => {
  try {
    console.log('📝 Logging upload to Supabase...');
    const { error } = await supabase
      .from('upload_logs')
      .insert(logData);

    if (error) throw error;

    console.log('✅ Upload logged successfully');
  } catch (error) {
    console.error('❌ Error logging upload:', error);
    throw error;
  }
};

export const fetchRecentUploadLogs = async (limit: number = 10): Promise<any[]> => {
  try {
    console.log(`📥 Fetching ${limit} recent upload logs...`);
    const { data, error } = await supabase
      .from('upload_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    console.log(`✅ Fetched ${data?.length || 0} upload logs`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching upload logs:', error);
    throw error;
  }
};

// ============================================
// EXPORT SNAPSHOTS
// ============================================

export const saveExportSnapshot = async (items: ItemNumberEntry[]): Promise<void> => {
  try {
    console.log('📸 Saving export snapshot...');
    
    const snapshotData = {
      snapshot_data: items,
      export_date: new Date().toISOString(),
      item_count: items.length,
    };

    const { error } = await supabase
      .from('export_snapshots')
      .insert(snapshotData);

    if (error) throw error;

    console.log('✅ Export snapshot saved successfully');
  } catch (error) {
    console.error('❌ Error saving export snapshot:', error);
    throw error;
  }
};

export const fetchLatestExportSnapshot = async (): Promise<ItemNumberEntry[] | null> => {
  try {
    console.log('📥 Fetching latest export snapshot...');
    const { data, error } = await supabase
      .from('export_snapshots')
      .select('*')
      .order('export_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('ℹ️ No export snapshot found');
        return null;
      }
      throw error;
    }

    console.log('✅ Fetched export snapshot');
    return data?.snapshot_data as ItemNumberEntry[] || null;
  } catch (error) {
    console.error('❌ Error fetching export snapshot:', error);
    return null;
  }
};

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

function transformSupabaseItemToLocal(item: any): ItemNumberEntry {
  return {
    id: item.id,
    itemNumber: item.item_number,
    productName: item.product_name,
    floorCount: item.floor_count || 0,
    storageCount: item.storage_count || 0,
    totalCount: item.total_count || (item.floor_count + item.storage_count),
    category: item.category,
  };
}

function transformSupabaseCategoryToLocal(cat: any): CategoryManagement {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isLocked: cat.is_locked || false,
    isCustom: cat.is_custom || false,
    createdAt: new Date(cat.created_at),
    updatedAt: new Date(cat.updated_at),
  };
}
